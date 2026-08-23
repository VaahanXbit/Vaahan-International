"""
Database Reset Utility Script
Run this script to drop all tables and re-create them fresh.
Usage:
    python reset_db.py
"""
import logging
from database import engine, Base, init_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def reset_database():
    logger.info("Dropping all existing database tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Tables dropped successfully!")
        
        logger.info("Re-creating all database tables...")
        init_db()
        logger.info("Database reset completed successfully!")
    except Exception as e:
        logger.error(f"❌ Failed to reset database: {str(e)}")

if __name__ == "__main__":
    reset_database()
