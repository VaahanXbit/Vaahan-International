"""
================================================================================
    FLEET TELEMATICS PLATFORM - Database Configuration
    
    Module: database.py
    Purpose: Database connection, session management, and engine setup
    Description:
        - Creates SQLAlchemy engine with connection pooling
        - Provides session factory for database operations
        - Implements dependency injection for FastAPI routes
        - Handles connection lifecycle
    
    Author: Team
    Version: 1.0.0
    Last Modified:  2026
================================================================================
"""

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from typing import Generator
import os
import logging
from dotenv import load_dotenv

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# Get database URL from environment or use default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/platform"
)

"""
Database URL Format:
    postgresql://username:password@host:port/database
    
Example:
    postgresql://postgres:password@localhost:5432/fleet_platform
    
For production, use environment variable:
    export DATABASE_URL=postgresql://user:pass@prod-db:5432/platform
"""

logger.info(f"Database URL: {DATABASE_URL}")

# ============================================================================
# ENGINE SETUP WITH CONNECTION POOLING
# ============================================================================

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False
    )
    logger.info("  SQLAlchemy SQLite engine created")
else:
    engine = create_engine(
        DATABASE_URL,
        poolclass=None,  # Use default pool (QueuePool)
        pool_size=20,  # Keep 20 connections in pool
        max_overflow=10,  # Allow up to 10 additional overflow connections
        pool_pre_ping=True,  # Test connection before using
        echo=False,  # Set to True for SQL debugging
        connect_args={
            "connect_timeout": 10,
            "application_name": "fleet_platform_backend",
        }
    )
    logger.info("  SQLAlchemy engine created with connection pooling")

# ============================================================================
# SESSION FACTORY
# ============================================================================

SessionLocal = sessionmaker(
    autocommit=False,  # Require explicit commit
    autoflush=False,  # Don't auto-flush before queries
    bind=engine  # Bind to our engine
)

logger.info("  Session factory created")

# ============================================================================
# DECLARATIVE BASE FOR ORM MODELS
# ============================================================================

Base = declarative_base()

"""
Usage in models.py:
    
    class Company(Base):
        __tablename__ = "companies"
        id = Column(UUID(as_uuid=True), primary_key=True)
        name = Column(String(255))
        ...
"""

# ============================================================================
# DEPENDENCY INJECTION FOR FASTAPI
# ============================================================================

def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI routes to get database session
    
    Yields:
        Session: SQLAlchemy database session
        
    Usage in routes:
        @router.get("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            # db is available here
            result = db.query(Model).all()
            return result
            
    Features:
        - Automatic session creation per request
        - Automatic cleanup/close after request
        - Rollback on exception
        - Clean error handling
    """
    db = SessionLocal()
    try:
        logger.debug(f"Database session created: {id(db)}")
        yield db
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()
        logger.debug(f"Database session closed: {id(db)}")


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Initialize database tables from models
    
    Call this once on application startup:
        init_db()
        
    Creates all tables defined in models.py based on SQLAlchemy models
    """
    try:
        from models import Base as ImportedBase
        ImportedBase.metadata.create_all(bind=engine)
        logger.info("  All database tables created successfully")
        
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE gps_coordinates ADD COLUMN IF NOT EXISTS accel_x NUMERIC(9, 6)"))
            conn.execute(text("ALTER TABLE gps_coordinates ADD COLUMN IF NOT EXISTS accel_y NUMERIC(9, 6)"))
            conn.execute(text("ALTER TABLE gps_coordinates ADD COLUMN IF NOT EXISTS accel_z NUMERIC(9, 6)"))
            conn.execute(text("ALTER TABLE trips ADD COLUMN IF NOT EXISTS final_score NUMERIC(5, 2) DEFAULT 100.0"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS unique_pin VARCHAR(6) UNIQUE"))
            conn.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS password VARCHAR(255)"))
            conn.commit()
        logger.info("  Startup migrations for accelerometer columns completed successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {str(e)}")
        raise


def verify_db_connection() -> bool:
    """
    Verify database connection is working
    
    Returns:
        bool: True if connection successful, False otherwise
        
    Usage:
        if verify_db_connection():
            print("Database is ready")
        else:
            print("Database connection failed")
    """
    try:
        with engine.connect() as conn:
            # Simple test query
            result = conn.execute(text("SELECT 1"))
            logger.info("  Database connection verified")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {str(e)}")
        return False


# ============================================================================
# CONNECTION EVENT LISTENERS
# ============================================================================

@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """
    Called when a raw DB-API connection is established
    
    Usage: Enable foreign key constraints, set connection parameters
    """
    # For SQLite, enable foreign keys
    try:
        if dbapi_conn.__class__.__module__.startswith("sqlite3"):
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()
            logger.debug("Foreign key constraints enabled for SQLite")
    except Exception as e:
        logger.debug(f"Could not enable foreign keys: {e}")


@event.listens_for(engine.pool, "connect")
def receive_pool_connect(dbapi_conn, connection_record):
    """
    Called when a connection is retrieved from the pool
    """
    logger.debug("Connection retrieved from pool")


@event.listens_for(engine.pool, "checkout")
def receive_pool_checkout(dbapi_conn, connection_record, connection_proxy):
    """
    Called when a connection is checked out from the pool
    """
    pass


@event.listens_for(engine.pool, "checkin")
def receive_pool_checkin(dbapi_conn, connection_record):
    """
    Called when a connection is returned to the pool
    """
    pass


# ============================================================================
# DATABASE UTILITIES
# ============================================================================

def get_db_stats():
    """
    Get database connection pool statistics
    
    Returns:
        dict: Pool statistics
    """
    pool = engine.pool
    return {
        "pool_size": pool.size() if hasattr(pool, 'size') else "N/A",
        "checked_out": pool.checkedout() if hasattr(pool, 'checkedout') else "N/A",
        "overflow": pool.overflow() if hasattr(pool, 'overflow') else "N/A",
        "total_connections": pool.size() + pool.overflow() if hasattr(pool, 'size') else "N/A"
    }


if __name__ == "__main__":
    # Test database connection on module run
    logger.info("Testing database connection...")
    if verify_db_connection():
        logger.info("Connection successful! Initializing database tables...")
        init_db()
        logger.info("Tables created successfully!")
    else:
        logger.error("Connection failed!")
