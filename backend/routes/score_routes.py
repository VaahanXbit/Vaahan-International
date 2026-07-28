"""
================================================================================
    FLEET TELEMATICS PLATFORM - Score Routes
    Module: routes/score_routes.py
    Purpose: Driver safety score endpoints
================================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date, timedelta
import logging

from database import get_db
from models import DailyScore

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/yesterday")
async def get_yesterday_score(driver_id: str, db: Session = Depends(get_db)):
    """Get yesterday's score"""
    try:
        yesterday = date.today() - timedelta(days=1)
        score = db.query(DailyScore).filter(
            DailyScore.driver_id == driver_id,
            DailyScore.date == yesterday
        ).first()
        
        if not score:
            return {"status": "success", "score": None}
        
        return {
            "status": "success",
            "score": float(score.avg_score or 0),
            "date": str(yesterday),
            "trip_count": score.trip_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get score")

@router.get("/weekly")
async def get_weekly_average(driver_id: str, db: Session = Depends(get_db)):
    """Get 7-day average score"""
    try:
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        scores = db.query(DailyScore).filter(
            DailyScore.driver_id == driver_id,
            DailyScore.date >= week_ago
        ).all()
        
        if not scores:
            return {"status": "success", "average": None}
        
        avg = sum(float(s.avg_score or 0) for s in scores) / len(scores)
        return {"status": "success", "average": round(avg, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get weekly score")

@router.get("/monthly")
async def get_monthly_average(driver_id: str, db: Session = Depends(get_db)):
    """Get 30-day average score"""
    try:
        today = date.today()
        month_ago = today - timedelta(days=30)
        
        scores = db.query(DailyScore).filter(
            DailyScore.driver_id == driver_id,
            DailyScore.date >= month_ago
        ).all()
        
        if not scores:
            return {"status": "success", "average": None}
        
        avg = sum(float(s.avg_score or 0) for s in scores) / len(scores)
        return {"status": "success", "average": round(avg, 2)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get monthly score")

@router.get("/history")
async def get_score_history(driver_id: str, days: int = 30, db: Session = Depends(get_db)):
    """Get score history"""
    try:
        start_date = date.today() - timedelta(days=days)
        scores = db.query(DailyScore).filter(
            DailyScore.driver_id == driver_id,
            DailyScore.date >= start_date
        ).order_by(DailyScore.date.desc()).all()
        
        return {
            "status": "success",
            "scores": [{"date": str(s.date), "score": float(s.avg_score or 0)} for s in scores]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get history")

logger.info("  Score routes module loaded")
