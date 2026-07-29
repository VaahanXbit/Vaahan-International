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
    """Get all drivers' scores for company"""
    try:
        yesterday = date.today() - timedelta(days=1)
        scores = db.query(DailyScore).filter(
            DailyScore.company_id == company_id,
            DailyScore.date == yesterday
        ).order_by(DailyScore.avg_score.desc()).all()
        
        return {
            "status": "success",
            "scores": [{"driver_id": str(s.driver_id), "score": float(s.avg_score or 0)} for s in scores]
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
                    "fastag_id": v.fastag_id,
                    "fastag_balance": float(v.fastag_balance or 0)
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
