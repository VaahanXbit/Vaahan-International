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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from database import get_db
from models import Trip, GPSCoordinate, TripEvent

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/start")
async def start_trip(driver_id: str, vehicle_id: str, db: Session = Depends(get_db)):
    """Start a new trip"""
    try:
        trip = Trip(
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
async def update_gps(trip_id: str, gps_points: list, db: Session = Depends(get_db)):
    """Update GPS locations for active trip"""
    try:
        for point in gps_points:
            gps = GPSCoordinate(
                trip_id=trip_id,
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
async def end_trip(trip_id: str, distance_km: float, duration_minutes: int, db: Session = Depends(get_db)):
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
        
        return {
            "status": "success",
            "trip": {"id": str(trip.id), "status": trip.status},
            "gps_points": len(gps_points),
            "events": len(events)
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
