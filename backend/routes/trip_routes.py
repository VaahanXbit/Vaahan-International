"""
================================================================================
    FLEET TELEMATICS PLATFORM - Trip Management Routes
    Module: routes/trip_routes.py
    Purpose: Trip CRUD operations, GPS tracking, event detection
    Description:
        - POST /trips/start: Start a new trip
        - PUT /trips/{trip_id}/locations: Send GPS batch
        - POST /trips/{trip_id}/end: End trip
        - GET /trips/{trip_id}: Get trip details
        - GET /trips: List driver's trips
    
    Author: Team
    Version: 1.0.0
================================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from database import get_db
from models import Driver, Trip, GPSCoordinate, TripEvent, Vehicle
from tasks import calculate_trip_scores_task
from services.geocoding import trip_geocode_state

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start")
async def start_trip(driver_id: str | None = None, vehicle_id: str | None = None, db: Session = Depends(get_db)):
    """Start a new trip"""
    try:
        # Fallback to first driver if none specified or is string 'undefined'/'null'
        if not driver_id or driver_id in ["undefined", "null", "default"]:
            driver = db.query(Driver).first()
            if not driver:
                raise HTTPException(status_code=404, detail="No drivers seeded in database")
            driver_id = str(driver.id)
        else:
            driver = db.query(Driver).filter(Driver.id == driver_id).first()
            if not driver:
                raise HTTPException(status_code=404, detail="Driver not found")

        # Fallback to linked vehicle if none specified or is string 'undefined'/'null'
        if not vehicle_id or vehicle_id in ["undefined", "null", "default"]:
            vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()
            if not vehicle:
                vehicle = db.query(Vehicle).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="No vehicles seeded in database")
            vehicle_id = str(vehicle.id)
        else:
            vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
            if not vehicle:
                raise HTTPException(status_code=404, detail="Vehicle not found")

        trip = Trip(
            company_id=driver.company_id,
            driver_id=driver_id,
            vehicle_id=vehicle_id,
            start_time=datetime.utcnow(),
            status="active"
        )
        db.add(trip)
        db.commit()
        db.refresh(trip)
        logger.info(f"  Trip started: {trip.id}")
        return {"status": "success", "trip_id": str(trip.id)}
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error starting trip: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to start trip")

@router.put("/{trip_id}/locations")
async def update_gps(trip_id: str, gps_points: list = Body(..., embed=True), db: Session = Depends(get_db)):
    """Update GPS locations for active trip"""
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")

        for point in gps_points:
            gps = GPSCoordinate(
                trip_id=trip_id,
                driver_id=trip.driver_id,
                latitude=point["lat"],
                longitude=point["lng"],
                speed_kmh=point.get("speed", 0)
            )
            db.add(gps)
        db.commit()
        logger.info(f"  GPS points recorded: {len(gps_points)}")
        return {"status": "success", "points_recorded": len(gps_points)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to record GPS")

@router.post("/{trip_id}/end")
async def end_trip(trip_id: str, distance_km: float, duration_minutes: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """End an active trip"""
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        trip.end_time = datetime.utcnow()
        trip.distance_km = distance_km
        trip.duration_minutes = duration_minutes
        trip.status = "completed"
        db.commit()
        logger.info(f"  Trip completed: {trip_id}")
        
        # Trigger async scoring calculation task via FastAPI BackgroundTasks
        background_tasks.add_task(calculate_trip_scores_task, trip_id)
        
        return {"status": "success"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to end trip")

@router.get("/{trip_id}")
async def get_trip(trip_id: str, db: Session = Depends(get_db)):
    """Get trip details with GPS points and events"""
    try:
        trip = db.query(Trip).filter(Trip.id == trip_id).first()
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found")
        
        gps_points = db.query(GPSCoordinate).filter(GPSCoordinate.trip_id == trip_id).all()
        events = db.query(TripEvent).filter(TripEvent.trip_id == trip_id).all()
        
        # Get last geocoded location name from cache
        state = trip_geocode_state.get(trip_id)
        current_location = state["last_name"] if (state and state.get("last_name")) else None
        if not current_location and gps_points:
            last_pt = gps_points[-1]
            current_location = f"{float(last_pt.latitude):.5f}, {float(last_pt.longitude):.5f}"
            
        return {
            "status": "success",
            "trip": {
                "id": str(trip.id),
                "status": trip.status,
                "final_score": float(trip.final_score) if trip.final_score is not None else 100.0,
                "distance_km": float(trip.distance_km) if trip.distance_km is not None else 0.0,
                "duration_minutes": trip.duration_minutes or 0,
                "total_events": trip.total_events or 0,
                "harsh_brake_count": trip.harsh_brake_count or 0,
                "speeding_count": trip.speeding_count or 0,
                "harsh_corner_count": trip.harsh_corner_count or 0,
                "current_location": current_location,
            },
            "gps_points": [
                {
                    "latitude": float(p.latitude),
                    "longitude": float(p.longitude),
                    "timestamp": p.timestamp.isoformat() if p.timestamp else None
                }
                for p in gps_points
            ],
            "events": [
                {
                    "event_type": e.event_type,
                    "severity": float(e.severity) if e.severity else 0.0,
                    "latitude": float(e.latitude) if e.latitude else 0.0,
                    "longitude": float(e.longitude) if e.longitude else 0.0,
                    "created_at": e.created_at.isoformat() if e.created_at else None
                }
                for e in events
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get trip")

@router.get("")
async def list_trips(driver_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """List all trips for a driver (paginated)"""
    try:
        trips = db.query(Trip).filter(Trip.driver_id == driver_id).order_by(Trip.start_time.desc()).limit(limit).all()
        return {
            "status": "success",
            "trips": [{"id": str(t.id), "status": t.status} for t in trips]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to list trips")

logger.info("  Trip routes module loaded")
