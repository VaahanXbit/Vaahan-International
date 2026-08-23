"""
================================================================================
    FLEET TELEMATICS PLATFORM - Database Models
    
    Module: models.py
    Purpose: SQLAlchemy ORM models for database tables
    Description:
        - Defines 8 core database tables
        - Companies: Fleet owner accounts
        - Drivers: Driver information and profiles
        - Vehicles: Vehicle details and registration
        - Trips: Trip records with metadata
        - GPSCoordinates: GPS tracking data (HIGH VOLUME)
        - TripEvents: Detected unsafe events
        - DailyScores: Calculated daily driver scores
        - FASTAGWallets: Toll payment wallets
        
        Relationships:
            Company 1--> Many Drivers
            Company 1--> Many Vehicles
            Driver 1--> Many Trips
            Vehicle 1--> Many Trips
            Trip 1--> Many GPSCoordinates
            Trip 1--> Many TripEvents
    
    Author: Team
    Version: 1.0.0
    Last Modified:  2026
================================================================================
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Numeric, Date, BigInteger, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

# Import Base from database module
from database import Base

# ============================================================================
# TABLE 1: COMPANIES
# ============================================================================

class Company(Base):
    """
    Represents fleet owner companies
    
    Attributes:
        id: Unique company identifier (UUID)
        name: Company name
        email: Company email (unique)
        phone: Contact phone number
        city: Company city
        gst_number: GST registration number (unique)
        subscription_status: active/suspended/inactive
        total_drivers: Denormalized count of drivers
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """
    __tablename__ = "companies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20))
    city = Column(String(100))
    state = Column(String(100))
    address = Column(Text)
    gst_number = Column(String(50), unique=True)
    plan_type = Column(String(20), default="starter")  # starter, pro, enterprise
    subscription_status = Column(String(50), default="active")  # active, suspended
    total_drivers = Column(Integer, default=0)
    unique_pin = Column(String(6), unique=True, nullable=True)
    password = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    drivers = relationship("Driver", back_populates="company", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", back_populates="company", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="company", cascade="all, delete-orphan")
    daily_scores = relationship("DailyScore", back_populates="company", cascade="all, delete-orphan")


# ============================================================================
# TABLE 2: DRIVERS
# ============================================================================

class Driver(Base):
    """
    Represents individual drivers
    
    Attributes:
        id: Unique driver identifier (UUID)
        company_id: Foreign key to company (B2B model)
        phone_number: Unique phone number (UNIQUE - for OTP)
        name: Driver full name
        license_number: Driving license number
        license_expiry: License expiration date
        status: active/suspended/deleted
        documents_json: JSON storing Firebase URLs
                       {"license": "url", "rc": "url", "insurance": "url"}
        created_at: Registration timestamp
    
    Notes:
        - Drivers are onboarded by companies (B2B flow)
        - No self-registration allowed
        - Phone number is unique and used for OTP login
    """
    __tablename__ = "drivers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    license_number = Column(String(50))
    license_expiry = Column(Date)
    aadhaar_number = Column(String(255))
    onboarded_by = Column(String(20))
    status = Column(String(50), default="active")  # active, suspended, deleted
    documents_json = Column(JSON)  # {license, rc, insurance URLs}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="drivers")
    vehicles = relationship("Vehicle", back_populates="driver", cascade="all, delete-orphan")
    trips = relationship("Trip", back_populates="driver", cascade="all, delete-orphan")
    gps_coordinates = relationship("GPSCoordinate", back_populates="driver", cascade="all, delete-orphan")
    trip_events = relationship("TripEvent", back_populates="driver", cascade="all, delete-orphan")
    daily_scores = relationship("DailyScore", back_populates="driver", cascade="all, delete-orphan")


# ============================================================================
# TABLE 3: VEHICLES
# ============================================================================

class Vehicle(Base):
    """
    Represents fleet vehicles
    
    Attributes:
        id: Unique vehicle identifier (UUID)
        company_id: Foreign key to company
        driver_id: Foreign key to assigned driver
        vehicle_number: Registration plate (UNIQUE, e.g., KA01AB1234)
        vehicle_type: truck/auto/bike/bus
        make: Vehicle manufacturer
        model: Vehicle model
        year: Manufacturing year
        vin: VIN number (UNIQUE)
        registration_expiry: RC expiration date
        fitness_expiry: Fitness certificate expiration
        permit_expiry: Transport permit expiration
        insurance_expiry: Insurance policy expiration
        fastag_id: FASTAG tag ID (if applicable)
        fastag_balance: Current FASTAG balance
        status: active/inactive
    """
    __tablename__ = "vehicles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"), nullable=True)
    vehicle_number = Column(String(20), unique=True, index=True)
    vehicle_type = Column(String(50))  # truck, auto, bike, bus
    make = Column(String(100))
    model = Column(String(100))
    year = Column(Integer)
    vin = Column(String(50), unique=True)
    registration_expiry = Column(Date)
    fitness_expiry = Column(Date)
    permit_expiry = Column(Date)
    insurance_expiry = Column(Date)
    fastag_id = Column(String(50))
    fastag_balance = Column(Numeric(10, 2), default=0)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="vehicles")
    driver = relationship("Driver", back_populates="vehicles")
    trips = relationship("Trip", back_populates="vehicle", cascade="all, delete-orphan")


# ============================================================================
# TABLE 4: TRIPS
# ============================================================================

class Trip(Base):
    """
    Represents individual trips/journeys
    
    Attributes:
        id: Unique trip identifier (UUID)
        driver_id: Foreign key to driver
        vehicle_id: Foreign key to vehicle
        company_id: Denormalized for query efficiency
        start_time: Trip start timestamp
        end_time: Trip end timestamp
        start_location: JSON {lat, lng}
        end_location: JSON {lat, lng}
        distance_km: Calculated distance
        duration_minutes: Trip duration in minutes
        total_events: Count of unsafe events
        harsh_brake_count: Denormalized count
        speeding_count: Denormalized count
        harsh_corner_count: Denormalized count
        status: active/completed/paused
        
    Index on (driver_id, start_time DESC) for fast query
    """
    __tablename__ = "trips"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    start_location = Column(JSON)  # {lat, lng}
    end_location = Column(JSON)  # {lat, lng}
    distance_km = Column(Numeric(10, 2))
    duration_minutes = Column(Integer)
    total_events = Column(Integer, default=0)
    harsh_brake_count = Column(Integer, default=0)
    speeding_count = Column(Integer, default=0)
    harsh_corner_count = Column(Integer, default=0)
    status = Column(String(50), default="active")  # active, completed, paused
    final_score = Column(Numeric(5, 2), default=100.0)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = relationship("Company", back_populates="trips")
    driver = relationship("Driver", back_populates="trips")
    vehicle = relationship("Vehicle", back_populates="trips")
    gps_coordinates = relationship("GPSCoordinate", back_populates="trip", cascade="all, delete-orphan")
    trip_events = relationship("TripEvent", back_populates="trip", cascade="all, delete-orphan")


# ============================================================================
# TABLE 5: GPS_COORDINATES
# ============================================================================

class GPSCoordinate(Base):
    """
    GPS tracking data - HIGH VOLUME TABLE
    
    Stores all GPS points collected during trips (every 5 seconds)
    ~180,000 rows per day for 100 drivers
    
    Attributes:
        id: Auto-incrementing BigInteger (for performance)
        trip_id: Foreign key to trip
        driver_id: Denormalized for efficient queries
        latitude: GPS latitude (9,6 precision)
        longitude: GPS longitude (9,6 precision)
        accuracy: GPS accuracy in meters
        speed_kmh: Current speed in km/h
        bearing: Direction heading in degrees
        timestamp: Data collection timestamp
        
    Index on (trip_id, timestamp DESC) for quick replay
    Partial index for recent data (last 30 days)
    """
    __tablename__ = "gps_coordinates"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    latitude = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    accuracy = Column(Numeric(5, 2))  # meters
    speed_kmh = Column(Numeric(5, 1))  # km/h
    bearing = Column(Integer)  # degrees (0-360)
    accel_x = Column(Numeric(9, 6), nullable=True)
    accel_y = Column(Numeric(9, 6), nullable=True)
    accel_z = Column(Numeric(9, 6), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    trip = relationship("Trip", back_populates="gps_coordinates")
    driver = relationship("Driver", back_populates="gps_coordinates")


# ============================================================================
# TABLE 6: TRIP_EVENTS
# ============================================================================

class TripEvent(Base):
    """
    Represents detected unsafe driving events
    
    Attributes:
        id: Unique event identifier (UUID)
        trip_id: Foreign key to trip
        driver_id: Denormalized for queries
        event_type: harsh_brake / speeding / harsh_corner
        severity: 0.0 to 1.0 (how severe the event was)
        latitude: Event location latitude
        longitude: Event location longitude
        metadata: JSON with event details
                 {speed, threshold, deceleration, etc.}
        created_at: Event detection timestamp
        
    Index on (trip_id) for event retrieval
    Index on (driver_id, created_at DESC) for driver history
    """
    __tablename__ = "trip_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=False)
    event_type = Column(String(50), nullable=False)  # harsh_brake, speeding, harsh_corner
    severity = Column(Numeric(3, 2))  # 0 to 1
    latitude = Column(Numeric(9, 6))
    longitude = Column(Numeric(9, 6))
    event_metadata = Column("metadata", JSON)  # {speed, threshold, deceleration, etc.}
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    trip = relationship("Trip", back_populates="trip_events")
    driver = relationship("Driver", back_populates="trip_events")


# ============================================================================
# TABLE 7: DAILY_SCORES
# ============================================================================

class DailyScore(Base):
    """
    KEY TABLE - Daily driver safety scores
    
    Attributes:
        id: Unique identifier (UUID)
        company_id: For fleet-level reporting
        driver_id: Foreign key to driver
        date: Score date (DATE type, not timestamp)
        avg_score: Average score for the day (0-100)
        trip_count: Number of completed trips
        total_distance_km: Total km driven
        total_duration_minutes: Total driving time
        harsh_brake_count: Total harsh brakes
        speeding_count: Total speeding incidents
        harsh_corner_count: Total harsh corners
        status: calculated/pending
        created_at: When score was calculated
        updated_at: Last update timestamp
        
    Unique constraint: (driver_id, date) - one score per driver per day
    Index on (driver_id, date DESC) for driver history
    Index on (company_id, date DESC) for fleet reports
    
    Calculated at 11:59 PM every night by Celery job
    Visible to driver and fleet owner next morning
    """
    __tablename__ = "driver_daily_scores"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    avg_score = Column(Numeric(5, 2))  # 0-100
    trip_count = Column(Integer, default=0)
    total_distance_km = Column(Numeric(10, 2))
    total_duration_minutes = Column(Integer)
    harsh_brake_count = Column(Integer, default=0)
    speeding_count = Column(Integer, default=0)
    harsh_corner_count = Column(Integer, default=0)
    status = Column(String(50), default="calculated")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        # Unique constraint: one score per driver per day
        # We'll add this via migration for better control
    )
    
    # Relationships
    company = relationship("Company", back_populates="daily_scores")
    driver = relationship("Driver", back_populates="daily_scores")


# ============================================================================
# TABLE 8: FASTAG_WALLETS
# ============================================================================

class FASTAGWallet(Base):
    """
    FASTAG (highway toll) payment wallets
    
    Attributes:
        id: Unique wallet identifier (UUID)
        driver_id: Foreign key to driver (UNIQUE)
        vehicle_id: Foreign key to vehicle (UNIQUE)
        fastag_id: FASTAG tag ID (UNIQUE)
        current_balance: Current wallet balance (₹)
        total_topups: Total amount topped up
        total_payments: Total amount paid for tolls
        last_topup_amount: Last topup amount
        last_topup_date: Last topup timestamp
        last_synced: Last sync with FASTAG provider
        status: active/inactive/suspended
        created_at: Wallet creation timestamp
        updated_at: Last update timestamp
        
    Accessible by:
        - Driver: View balance
        - Fleet Owner: Top-up wallet
        
    Synced with FASTAG provider every 6 hours
    """
    __tablename__ = "fastag_wallets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.id", ondelete="CASCADE"), unique=True, nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id", ondelete="CASCADE"), unique=True)
    fastag_id = Column(String(50), unique=True)
    current_balance = Column(Numeric(10, 2), default=0)
    total_topups = Column(Numeric(10, 2), default=0)
    total_payments = Column(Numeric(10, 2), default=0)
    last_topup_amount = Column(Numeric(10, 2))
    last_topup_date = Column(DateTime)
    last_synced = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    driver = relationship("Driver", uselist=False)


print("  All database models defined")
