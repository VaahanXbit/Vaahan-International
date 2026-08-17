"""
================================================================================
    FLEET TELEMATICS PLATFORM - Fleet Management Routes
    Module: routes/fleet_routes.py
    Purpose: Fleet owner dashboard endpoints
================================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
import logging

from database import get_db
from models import Driver, DailyScore, Trip, Vehicle

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/drivers")
async def get_fleet_drivers(company_id: str, limit: int = 50, db: Session = Depends(get_db)):
    """Get all drivers in a company"""
    try:
        drivers = db.query(Driver).filter(Driver.company_id == company_id).limit(limit).all()
        return {
            "status": "success",
            "drivers": [
                {
                    "id": str(d.id),
                    "name": d.name,
                    "phone": d.phone_number,
                    "status": d.status
                }
                for d in drivers
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get drivers")

@router.get("/scores")
async def get_all_scores(company_id: str, db: Session = Depends(get_db)):
    """Get all drivers' scores for company based on last 24h trips with dynamic fallbacks"""
    try:
        from models import Driver, Trip
        from datetime import datetime, timedelta
        
        drivers = db.query(Driver).filter(Driver.company_id == company_id).all()
        scores = []
        
        for driver in drivers:
            trips = db.query(Trip).filter(Trip.driver_id == driver.id).order_by(Trip.start_time.desc()).all()
            if not trips:
                scores.append({
                    "driver_id": str(driver.id),
                    "score": "Driver yet to take first ride"
                })
            else:
                now = datetime.utcnow()
                limit_24h = now - timedelta(hours=24)
                trips_24h = [t for t in trips if t.start_time >= limit_24h]
                
                if trips_24h:
                    # Calculate average score of all trips in that 24 hours
                    valid_scores = [float(t.final_score) for t in trips_24h if t.final_score is not None]
                    avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 100.0
                    scores.append({
                        "driver_id": str(driver.id),
                        "score": avg_score
                    })
                else:
                    # No trips in the last 24 hours: persist previous 24h window score
                    # (average score of all trips in the 24-hour window ending at the most recent trip)
                    most_recent_time = trips[0].start_time
                    limit_recent_24h = most_recent_time - timedelta(hours=24)
                    recent_window_trips = [t for t in trips if limit_recent_24h <= t.start_time <= most_recent_time]
                    
                    valid_scores = [float(t.final_score) for t in recent_window_trips if t.final_score is not None]
                    avg_score = sum(valid_scores) / len(valid_scores) if valid_scores else 100.0
                    scores.append({
                        "driver_id": str(driver.id),
                        "score": avg_score
                    })
                    
        return {
            "status": "success",
            "scores": scores
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get scores")

@router.get("/vehicles")
async def get_fleet_vehicles(company_id: str, db: Session = Depends(get_db)):
    """Get all vehicles in company"""
    try:
        vehicles = db.query(Vehicle).filter(Vehicle.company_id == company_id).all()
        return {
            "status": "success",
            "vehicles": [
                {
                    "id": str(v.id),
                    "number": v.vehicle_number,
                    "type": v.vehicle_type,
                    "fastag_id": v.fastag_id,
                    "fastag_balance": float(v.fastag_balance or 0),
                    "driver_id": str(v.driver_id) if v.driver_id else None
                }
                for v in vehicles
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get vehicles")

@router.get("/active-trips")
async def get_active_trips(company_id: str, db: Session = Depends(get_db)):
    """Get all active trips in company"""
    try:
        trips = db.query(Trip).filter(
            Trip.company_id == company_id,
            Trip.status == "active"
        ).all()
        return {
            "status": "success",
            "count": len(trips),
            "trips": [{"id": str(t.id), "driver_id": str(t.driver_id)} for t in trips]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get active trips")

@router.get("/dashboard")
async def get_fleet_dashboard(company_id: str, db: Session = Depends(get_db)):
    """Get fleet dashboard KPIs"""
    try:
        total_drivers = db.query(Driver).filter(Driver.company_id == company_id).count()
        active_trips = db.query(Trip).filter(
            Trip.company_id == company_id,
            Trip.status == "active"
        ).count()
        
        return {
            "status": "success",
            "total_drivers": total_drivers,
            "active_trips": active_trips
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get dashboard")

logger.info("  Fleet routes module loaded")
