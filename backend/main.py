"""
================================================================================
    FLEET TELEMATICS PLATFORM - Backend API
    
    Module: main.py
    Purpose: FastAPI application initialization and configuration
    Description: 
        - Initializes FastAPI application
        - Configures CORS for mobile app access
        - Registers all API route modules
        - Sets up middleware and exception handlers
        - Creates database tables on startup
    
    Author: Team
    Version: 1.0.0
    Last Modified: 2026
================================================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from datetime import datetime

# Import database setup
from database import engine, Base, SessionLocal

# Import route modules
from routes import auth_routes, trip_routes, score_routes, fleet_routes, driver_socket

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# STARTUP / SHUTDOWN EVENTS
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - startup and shutdown events
    
    Startup:
        - Create database tables from models
        - Log initialization
        
    Shutdown:
        - Cleanup resources
        - Log shutdown
    """
    # STARTUP
    logger.info("=" * 80)
    logger.info("🚀 FLEET TELEMATICS PLATFORM - Backend API Starting...")
    logger.info("=" * 80)
    
    try:
        # Create all tables based on SQLAlchemy models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully")
        logger.info("CORS middleware configured for mobile apps")
        logger.info("All route handlers registered")
        logger.info(f"Timestamp: {datetime.utcnow().isoformat()}")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        raise
    
    yield
    
    # SHUTDOWN
    logger.info("Fleet Telematics Platform - Backend shutting down...")


# ============================================================================
# FASTAPI APPLICATION INITIALIZATION
# ============================================================================

app = FastAPI(
    title="Fleet Telematics Platform API",
    description="Driver Safety & Fleet Management Platform",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================================
# MIDDLEWARE CONFIGURATION
# ============================================================================

# CORS Middleware - Allow mobile apps to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Local development
        "http://localhost:8081",      # React Native dev
        "http://localhost:19000",     # Expo dev
        "https://*.example.com",      # Production domains
    ],
    allow_credentials=True,
    allow_methods=["*"],
    max_age=600,
    allow_headers=["*"],
)

logger.info("  CORS middleware configured")


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    
    Returns:
        dict: Status and timestamp
    """
    return {
        "status": "healthy",
        "service": "Fleet Telematics Platform",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }


@app.get("/", tags=["System"])
async def root():
    """
    Root endpoint - API information
    
    Returns:
        dict: API metadata and available endpoints
    """
    return {
        "service": "Fleet Telematics Platform API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/v1/auth",
            "trips": "/api/v1/trips",
            "scores": "/api/v1/scores",
            "fleet": "/api/v1/fleet",
            "docs": "/docs"
        },
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# ROUTE REGISTRATION
# ============================================================================

# Authentication Routes
app.include_router(
    auth_routes.router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

# Trip Management Routes
app.include_router(
    trip_routes.router,
    prefix="/api/v1/trips",
    tags=["Trips"]
)

# Score Routes
app.include_router(
    score_routes.router,
    prefix="/api/v1/scores",
    tags=["Scores"]
)

# Fleet Management Routes
app.include_router(
    fleet_routes.router,
    prefix="/api/v1/fleet",
    tags=["Fleet"]
)

# Driver Telemetry WebSocket Routes
app.include_router(
    driver_socket.router,
    tags=["Driver Telemetry"]
)

logger.info("  All route modules registered")


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler for unhandled errors
    
    Args:
        request: FastAPI request object
        exc: Exception raised
        
    Returns:
        dict: Error response with details
    """
    logger.error(f"❌ Unhandled exception: {str(exc)}", exc_info=True)
    
    return {
        "error": "Internal server error",
        "detail": str(exc),
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting Uvicorn server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )


