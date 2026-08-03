from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
from datetime import datetime, timezone
from database import SessionLocal
from models import Trip, GPSCoordinate, TripEvent

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/trip/{trip_id}")
async def websocket_trip_endpoint(websocket: WebSocket, trip_id: str):
    """
    WebSocket endpoint for live driver telemetry during an active trip.
    """
    await websocket.accept()
    logger.info(f"🔌 WebSocket connected: Trip ID {trip_id}")
    
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
                    timestamp=timestamp
                )
                session.add(gps)
                
                # 2. Check and detect harsh driving events
                detected_events = []
                
                # Harsh braking / Acceleration check (accel_y)
                if abs(accel_y) > 0.8:
                    event_type = "harsh_brake" if accel_y < -0.8 else "harsh_accel"
                    severity = min(abs(accel_y), 1.0)
                    detected_events.append((event_type, severity))
                
                # Harsh corner check (accel_x)
                if abs(accel_x) > 0.7:
                    event_type = "harsh_corner"
                    severity = min(abs(accel_x), 1.0)
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
                
            except Exception as e:
                session.rollback()
                logger.error(f"Error saving telemetry to database: {str(e)}")
            finally:
                session.close()
                
            await websocket.send_json({
                "received": True,
                "event_detected": event_detected
            })
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected cleanly: Trip ID {trip_id}")
    except Exception as e:
        logger.error(f"WebSocket error on Trip ID {trip_id}: {str(e)}")
