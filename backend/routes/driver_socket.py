from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
from datetime import datetime, timezone
from database import SessionLocal
from models import Trip, GPSCoordinate, TripEvent
from services.geocoding import reverse_geocode, trip_geocode_state

logger = logging.getLogger(__name__)
router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}  # trip_id -> set of WebSockets

    async def connect(self, trip_id: str, websocket: WebSocket):
        await websocket.accept()
        if trip_id not in self.active_connections:
            self.active_connections[trip_id] = set()
        self.active_connections[trip_id].add(websocket)
        logger.info(f"🔌 WebSocket client connected for Trip: {trip_id}. Total: {len(self.active_connections[trip_id])}")

    def disconnect(self, trip_id: str, websocket: WebSocket):
        if trip_id in self.active_connections:
            if websocket in self.active_connections[trip_id]:
                self.active_connections[trip_id].remove(websocket)
            if not self.active_connections[trip_id]:
                del self.active_connections[trip_id]
        logger.info(f"🔌 WebSocket client disconnected for Trip: {trip_id}")

    async def broadcast_to_trip(self, trip_id: str, message: dict, sender: WebSocket):
        if trip_id in self.active_connections:
            for connection in list(self.active_connections[trip_id]):
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        # Stale connection, clean up
                        logger.warning(f"Failed to send broadcast frame: {str(e)}")

manager = ConnectionManager()

async def background_geocode_task(lat: float, lng: float, trip_id: str, websocket: WebSocket, manager: ConnectionManager):
    """
    Asynchronously queries Nominatim in the background to prevent telemetry connection blocking.
    """
    try:
        location_name = await reverse_geocode(lat, lng, trip_id)
        if location_name:
            # 1. Update the driver app (ack format)
            try:
                await websocket.send_json({
                    "received": True,
                    "event_detected": "",
                    "location_name": location_name
                })
            except Exception:
                pass
            
            # 2. Update the fleet app listener (broadcast format)
            broadcast_payload = {
                "lat": lat,
                "lng": lng,
                "speed_kmh": 0.0,
                "accel_x": 0.0,
                "accel_y": 0.0,
                "accel_z": 0.0,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_detected": "",
                "location_name": location_name
            }
            await manager.broadcast_to_trip(trip_id, broadcast_payload, websocket)
    except Exception as e:
        logger.error(f"Error in background geocoding task: {str(e)}")

@router.websocket("/ws/trip/{trip_id}")
async def websocket_trip_endpoint(websocket: WebSocket, trip_id: str):
    """
    WebSocket endpoint for live driver telemetry during an active trip.
    """
    await manager.connect(trip_id, websocket)
    
    gravity_filter = None
    try:
        while True:
            data = await websocket.receive_json()
            
            lat = float(data.get("lat", 0.0))
            lng = float(data.get("lng", 0.0))
            speed_kmh = float(data.get("speed_kmh", 0.0))
            accel_x = float(data.get("accel_x", 0.0))
            accel_y = float(data.get("accel_y", 0.0))
            accel_z = float(data.get("accel_z", 0.0))
            timestamp_str = data.get("timestamp")
            
            # Parse timestamp if available, else default to current UTC time
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                except ValueError:
                    timestamp = datetime.now(timezone.utc)
            else:
                timestamp = datetime.now(timezone.utc)
            
            event_detected = ""
            session = SessionLocal()
            try:
                # Query Trip to satisfy foreign key relationships and retrieve driver_id
                trip = session.query(Trip).filter(Trip.id == trip_id).first()
                if not trip:
                    logger.warning(f"Trip {trip_id} not found in database. Telemetry ignored.")
                    await websocket.send_json({"received": False, "error": "Trip not found"})
                    continue
                
                # 1. Insert GPS Coordinate
                gps = GPSCoordinate(
                    trip_id=trip.id,
                    driver_id=trip.driver_id,
                    latitude=lat,
                    longitude=lng,
                    speed_kmh=speed_kmh,
                    accel_x=accel_x,
                    accel_y=accel_y,
                    accel_z=accel_z,
                    timestamp=timestamp
                )
                session.add(gps)
                
                # 2. Check and detect harsh driving events
                detected_events = []
                
                # Convert raw database Gs back to m/s² for consistency with our standard low-pass math
                ax_raw_ms2 = accel_x * 9.81
                ay_raw_ms2 = accel_y * 9.81
                az_raw_ms2 = accel_z * 9.81
 
                if gravity_filter is None:
                    gravity_filter = [ax_raw_ms2, ay_raw_ms2, az_raw_ms2]
 
                # Update running average (ALPHA = 0.8)
                gravity_filter[0] = 0.8 * gravity_filter[0] + 0.2 * ax_raw_ms2
                gravity_filter[1] = 0.8 * gravity_filter[1] + 0.2 * ay_raw_ms2
                gravity_filter[2] = 0.8 * gravity_filter[2] + 0.2 * az_raw_ms2
 
                # Remove gravity and convert back to G
                lax = (ax_raw_ms2 - gravity_filter[0]) / 9.81
                lay = (ay_raw_ms2 - gravity_filter[1]) / 9.81
                laz = (az_raw_ms2 - gravity_filter[2]) / 9.81
                
                # Harsh braking / Acceleration check using linear longitudinal force (lay)
                if abs(lay) > 0.8:
                    event_type = "harsh_brake" if lay < -0.8 else "harsh_accel"
                    severity = min(abs(lay), 1.0)
                    detected_events.append((event_type, severity))
                
                # Harsh corner check using linear lateral force (lax)
                if abs(lax) > 0.7:
                    event_type = "harsh_corner"
                    severity = min(abs(lax), 1.0)
                    detected_events.append((event_type, severity))
                
                # Insert detected events into TripEvent table
                for evt_type, severity in detected_events:
                    event_detected = evt_type
                    trip_event = TripEvent(
                        trip_id=trip.id,
                        driver_id=trip.driver_id,
                        event_type=evt_type,
                        severity=severity,
                        latitude=lat,
                        longitude=lng,
                        event_metadata={
                            "speed_kmh": speed_kmh,
                            "accel_x": accel_x,
                            "accel_y": accel_y,
                            "accel_z": accel_z
                        },
                        created_at=timestamp
                    )
                    session.add(trip_event)
                
                session.commit()
                
                # Get location name (either from in-memory cache or fallback to "Locating...")
                state = trip_geocode_state.get(trip_id)
                location_name = state["last_name"] if (state and state.get("last_name")) else "Locating..."
                
                # Broadcast payload to listeners (like fleet-app)
                broadcast_payload = {
                    "lat": lat,
                    "lng": lng,
                    "speed_kmh": speed_kmh,
                    "accel_x": accel_x,
                    "accel_y": accel_y,
                    "accel_z": accel_z,
                    "timestamp": timestamp.isoformat(),
                    "event_detected": event_detected,
                    "location_name": location_name
                }
                await manager.broadcast_to_trip(trip_id, broadcast_payload, websocket)
                
            except Exception as e:
                session.rollback()
                logger.error(f"Error saving telemetry to database: {str(e)}")
                state = trip_geocode_state.get(trip_id)
                location_name = state["last_name"] if (state and state.get("last_name")) else "Locating..."
            finally:
                session.close()
                
            await websocket.send_json({
                "received": True,
                "event_detected": event_detected,
                "location_name": location_name
            })
            
            # Launch geocode update task asynchronously in the background (non-blocking)
            import asyncio
            asyncio.create_task(background_geocode_task(lat, lng, trip_id, websocket, manager))
            
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error on Trip ID {trip_id}: {str(e)}")
        manager.disconnect(trip_id, websocket)

@router.websocket("/ws/trip/{trip_id}/listen")
async def websocket_trip_listen_endpoint(websocket: WebSocket, trip_id: str):
    """
    WebSocket endpoint for listeners (like fleet owners) to stream live telemetry updates.
    """
    await manager.connect(trip_id, websocket)
    try:
        while True:
            # We keep the socket alive by waiting for any potential incoming text
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(trip_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket listener error on Trip ID {trip_id}: {str(e)}")
        manager.disconnect(trip_id, websocket)
