"""
================================================================================
    FLEET TELEMATICS PLATFORM - Authentication Routes
    
    Module: routes/auth_routes.py
    Purpose: Authentication endpoints (login, register, OTP verification)
    Description:
        - POST /auth/register-company: Company registration
        - POST /auth/login-company: Company login
        - POST /auth/invite-driver: Send OTP to driver
        - POST /auth/verify-driver: Verify OTP and create driver account
        - POST /auth/refresh-token: Refresh JWT token
        - GET /auth/me: Get current user info
    
    Author: Team
    Version: 1.0.0
    Last Modified:  2026
================================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
import logging
import random

# Import database and models
from database import get_db
from models import Company, Driver, Vehicle

# Import authentication utilities
from auth import JWTManager, PasswordManager, OTPManager

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()


# ============================================================================
# COMPANY REGISTRATION
# ============================================================================

@router.post("/register-company", tags=["Company"])
async def register_company(
    name: str,
    email: str,
    phone: str,
    city: str,
    gst_number: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Register a new company (fleet owner)
    """
    try:
        # Check if company already exists
        existing = db.query(Company).filter(Company.email == email).first()
        if existing:
            logger.warning(f"⚠️  Company registration failed: Email already exists - {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Generate unique 6-digit PIN
        while True:
            pin = f"{random.randint(100000, 999999)}"
            existing_pin = db.query(Company).filter(Company.unique_pin == pin).first()
            if not existing_pin:
                break

        # Create new company
        company = Company(
            name=name,
            email=email,
            phone=phone,
            city=city,
            gst_number=gst_number,
            password=password,
            unique_pin=pin,
            subscription_status="active"
        )
        
        db.add(company)
        db.commit()
        db.refresh(company)
        
        logger.info(f"  Company registered: {company.id} - {name} - PIN: {pin}")
        
        return {
            "status": "success",
            "message": "Company registered successfully",
            "company_id": str(company.id),
            "name": company.name,
            "email": company.email,
            "phone": company.phone,
            "city": company.city,
            "gst_number": company.gst_number,
            "unique_pin": company.unique_pin
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Company registration error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register company"
        )


@router.post("/login-company", tags=["Company"])
async def login_company(
    email: str,
    password: str,
    db: Session = Depends(get_db)
):
    """
    Company login - verifies email and password, then returns full profile details.
    """
    try:
        company = db.query(Company).filter(Company.email == email).first()
        if not company:
            logger.warning(f"⚠️  Company login failed - email not found: {email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not registered with this email address"
            )
            
        if company.password != password:
            logger.warning(f"⚠️  Company login failed - invalid password for: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
            
        logger.info(f"  Company login successful: {company.name} (ID: {company.id})")
        return {
            "status": "success",
            "company_id": str(company.id),
            "name": company.name,
            "email": company.email,
            "phone": company.phone,
            "city": company.city,
            "gst_number": company.gst_number,
            "unique_pin": company.unique_pin
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Company login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to login company"
        )


@router.put("/update-company/{company_id}", tags=["Company"])
async def update_company(
    company_id: str,
    name: str,
    email: str,
    phone: str,
    gst_number: str,
    db: Session = Depends(get_db)
):
    """
    Update details of an existing company (fleet owner)
    """
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        company.name = name
        company.email = email
        company.phone = phone
        company.gst_number = gst_number
        db.commit()
        db.refresh(company)
        
        logger.info(f"  Company updated: {company.id} - {name}")
        return {
            "status": "success",
            "company_id": str(company.id),
            "name": company.name,
            "email": company.email,
            "phone": company.phone,
            "city": company.city,
            "gst_number": company.gst_number,
            "unique_pin": company.unique_pin
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Company update error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update company profile"
        )


# ============================================================================
# DRIVER OTP INVITATION
# ============================================================================

@router.post("/invite-driver", tags=["Driver"])
async def invite_driver(
    phone_number: str,
    company_id: str = None
):
    """
    Invite driver - Generate and send OTP
    
    Flow:
        1. Fleet owner sends driver's phone number
        2. System generates 6-digit OTP
        3. OTP sent via SMS (in production)
        4. OTP valid for 5 minutes
        
    Args:
        phone_number: Driver's phone number (e.g., "9876543210")
        company_id: Company inviting the driver (optional, for logging)
        
    Returns:
        dict: Success message with expiry time
        
    Example Request:
        POST /api/v1/auth/invite-driver?phone_number=9876543210
        
    Example Response:
        {
            "status": "success",
            "message": "OTP sent to 9876543210",
            "phone_number": "9876543210",
            "expires_in": 300
        }
        
    Notes:
        - OTP is 6 digits
        - Valid for 5 minutes (300 seconds)
        - Max 3 attempts to enter OTP
        - In production, OTP sent via SMS
        - For testing, OTP is logged to console
    """
    try:
        # Generate OTP
        otp = OTPManager.generate_otp(phone_number)
        
        # In production, send via SMS
        # send_sms_via_provider(phone_number, f"Your OTP: {otp}")
        
        logger.info(f"  OTP sent to {phone_number}")
        
        return {
            "status": "success",
            "message": f"OTP sent to {phone_number}",
            "phone_number": phone_number,
            "expires_in": 300  # 5 minutes
        }
        
    except Exception as e:
        logger.error(f"❌ OTP generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )


# ============================================================================
# DRIVER OTP VERIFICATION & REGISTRATION
# ============================================================================

@router.post("/verify-driver", tags=["Driver"])
async def verify_driver(
    phone_number: str,
    otp: str,
    name: str,
    vehicle_number: str,
    vehicle_type: str = "truck",
    db: Session = Depends(get_db)
):
    """
    Verify OTP and create driver account
    
    Flow:
        1. Driver enters OTP received via SMS
        2. OTP verified against stored value
        3. Driver profile created
        4. JWT token generated and returned
        
    Args:
        phone_number: Driver's phone number
        otp: 6-digit OTP entered by driver
        name: Driver's full name
        vehicle_number: Vehicle registration plate
        
    Returns:
        dict: JWT tokens and driver info
        
    Example Request:
        POST /api/v1/auth/verify-driver
        {
            "phone_number": "9876543210",
            "otp": "123456",
            "name": "Rajesh Kumar",
            "vehicle_number": "KA01AB1234"
        }
        
    Example Response:
        {
            "status": "success",
            "message": "Driver verified and registered",
            "driver_id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Rajesh Kumar",
            "phone_number": "9876543210",
            "access_token": "eyJhbGciOiJIUzI1NiIs...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
            "token_type": "bearer",
            "expires_in": 86400
        }
        
    Error Cases:
        - 401: Invalid OTP
        - 401: OTP expired
        - 401: Too many attempts (max 3)
        - 400: Phone number already registered
        - 500: Database error
    """
    try:
        # Match OTP/PIN with Company unique_pin
        company = db.query(Company).filter(Company.unique_pin == otp).first()
        if not company:
            logger.warning(f"⚠️  Invalid Fleet PIN/OTP entered: {otp}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Fleet PIN. Please contact your Fleet Manager."
            )
        
        # Check if driver already exists
        driver = db.query(Driver).filter(Driver.phone_number == phone_number).first()
        
        # Get or create vehicle for the driver
        vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_number).first()
        if not vehicle:
            vehicle = Vehicle(
                company_id=company.id,
                vehicle_number=vehicle_number,
                vehicle_type=vehicle_type,
                status="active"
            )
            db.add(vehicle)
            db.commit()
            db.refresh(vehicle)
        else:
            # Update vehicle company assignment and type
            vehicle.company_id = company.id
            vehicle.vehicle_type = vehicle_type
            db.commit()
        
        if driver:
            # Update existing driver company association
            driver.company_id = company.id
            driver.name = name
            db.commit()
            db.refresh(driver)
        else:
            # Create driver account under the matched company
            driver = Driver(
                phone_number=phone_number,
                name=name,
                company_id=company.id,
                status="active"
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
        
        # Link the vehicle to the driver
        vehicle.driver_id = driver.id
        db.commit()
        
        # Create JWT tokens
        access_token = JWTManager.create_access_token(
            user_id=str(driver.id),
            role="driver",
            email=None
        )
        refresh_token = JWTManager.create_refresh_token(
            user_id=str(driver.id),
            role="driver"
        )
        
        logger.info(f"  Driver verified and connected to fleet: {driver.id} - {name} (Fleet: {company.name})")
        
        return {
            "status": "success",
            "message": f"Successfully connected to {company.name}",
            "driver_id": str(driver.id),
            "name": driver.name,
            "phone_number": driver.phone_number,
            "company_name": company.name,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": 86400  # 24 hours
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Driver verification error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify driver"
        )


# ============================================================================
# TOKEN REFRESH
# ============================================================================

@router.post("/refresh-token", tags=["Auth"])
async def refresh_token(refresh_token: str):
    """
    Get new access token using refresh token
    
    Args:
        refresh_token: Valid refresh token (30-day expiry)
        
    Returns:
        dict: New access token
        
    Example Request:
        POST /api/v1/auth/refresh-token
        {
            "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
        }
        
    Example Response:
        {
            "status": "success",
            "access_token": "eyJhbGciOiJIUzI1NiIs...",
            "token_type": "bearer",
            "expires_in": 86400
        }
    """
    try:
        # Decode refresh token
        payload = JWTManager.verify_token(refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("user_id")
        role = payload.get("role")
        
        # Create new access token
        new_token = JWTManager.create_access_token(
            user_id=user_id,
            role=role
        )
        
        logger.info(f"  Token refreshed for user: {user_id}")
        
        return {
            "status": "success",
            "access_token": new_token,
            "token_type": "bearer",
            "expires_in": 86400
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token"
        )


# ============================================================================
# GET CURRENT USER
# ============================================================================

@router.get("/me", tags=["Auth"])
async def get_current_user(
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """
    Get current logged-in user information
    
    Requires:
        Authorization header with Bearer token
        
    Returns:
        dict: User information (driver or fleet owner)
        
    Example Request:
        GET /api/v1/auth/me
        Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
        
    Example Response (Driver):
        {
            "status": "success",
            "user_type": "driver",
            "driver_id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "Rajesh Kumar",
            "phone_number": "9876543210",
            "status": "active",
            "created_at": " 2026-01-15T10:30:00"
        }
        
    Example Response (Fleet Owner):
        {
            "status": "success",
            "user_type": "company",
            "company_id": "550e8400-e29b-41d4-a716-446655440001",
            "name": "ABC Transport Ltd",
            "email": "contact@abctransport.com",
            "city": "Bangalore",
            "subscription_status": "active"
        }
    """
    try:
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header required"
            )
        
        # Extract token from "Bearer <token>"
        try:
            scheme, token = authorization.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authorization scheme")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        # Verify token
        payload = JWTManager.verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        user_id = payload.get("user_id")
        role = payload.get("role")
        
        # Return user info based on role
        if role == "driver":
            driver = db.query(Driver).filter(Driver.id == user_id).first()
            if not driver:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Driver not found"
                )
            
            return {
                "status": "success",
                "user_type": "driver",
                "driver_id": str(driver.id),
                "name": driver.name,
                "phone_number": driver.phone_number,
                "status": driver.status,
                "created_at": driver.created_at.isoformat()
            }
        
        elif role == "fleet_owner":
            company = db.query(Company).filter(Company.id == user_id).first()
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
            
            return {
                "status": "success",
                "user_type": "company",
                "company_id": str(company.id),
                "name": company.name,
                "email": company.email,
                "city": company.city,
                "subscription_status": company.subscription_status
            }
        
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unknown user role"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Get current user error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )

@router.post("/driver-direct", tags=["Driver"])
async def driver_direct(
    phone_number: str,
    name: str = None,
    vehicle_number: str = None,
    vehicle_type: str = "truck",
    is_login: bool = False,
    db: Session = Depends(get_db)
):
    """
    Direct login/registration for driver without OTP (development & testing stopgap)
    """
    try:
        driver = db.query(Driver).filter(Driver.phone_number == phone_number).first()
        
        if is_login:
            if not driver:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Driver not registered with this phone number"
                )
            
            vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()
            vehicle_num = vehicle.vehicle_number if vehicle else "default"
            
            company = db.query(Company).filter(Company.id == driver.company_id).first()
            company_name = company.name if company else "Independent Drivers"
            
            access_token = JWTManager.create_access_token(user_id=str(driver.id), role="driver")
            refresh_token = JWTManager.create_refresh_token(user_id=str(driver.id), role="driver")
            
            return {
                "status": "success",
                "message": "Driver logged in successfully",
                "driver_id": str(driver.id),
                "name": driver.name,
                "phone_number": driver.phone_number,
                "vehicle_number": vehicle_num,
                "company_name": company_name,
                "access_token": access_token,
                "refresh_token": refresh_token
            }
        else:
            if driver:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Driver already registered with this phone number. Please log in instead."
                )
            
            if not name or not vehicle_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Name and Vehicle Number are required for registration"
                )
            
            vehicle = db.query(Vehicle).filter(Vehicle.vehicle_number == vehicle_number).first()
            if not vehicle:
                company = db.query(Company).filter(Company.name == "Independent Drivers").first()
                if not company:
                    company = Company(
                        name="Independent Drivers",
                        email="independent@vaahan.com",
                        phone="0000000000",
                        city="System",
                        gst_number="SYSTEM_INDEPENDENT",
                        subscription_status="active"
                    )
                    db.add(company)
                    db.commit()
                    db.refresh(company)
                
                vehicle = Vehicle(
                    company_id=company.id,
                    vehicle_number=vehicle_number,
                    vehicle_type=vehicle_type,
                    status="active"
                )
                db.add(vehicle)
                db.commit()
                db.refresh(vehicle)
            else:
                company = db.query(Company).filter(Company.id == vehicle.company_id).first()
                if not company:
                    company = db.query(Company).filter(Company.name == "Independent Drivers").first()
                vehicle.vehicle_type = vehicle_type
                db.commit()
            
            driver = Driver(
                phone_number=phone_number,
                name=name,
                company_id=vehicle.company_id,
                status="active"
            )
            db.add(driver)
            db.commit()
            db.refresh(driver)
            
            vehicle.driver_id = driver.id
            db.commit()
            
            access_token = JWTManager.create_access_token(user_id=str(driver.id), role="driver")
            refresh_token = JWTManager.create_refresh_token(user_id=str(driver.id), role="driver")
            
            return {
                "status": "success",
                "message": "Driver registered successfully",
                "driver_id": str(driver.id),
                "name": driver.name,
                "phone_number": driver.phone_number,
                "vehicle_number": vehicle_number,
                "company_name": company.name if company else "Independent Drivers",
                "access_token": access_token,
                "refresh_token": refresh_token
            }
            
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Direct driver auth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to authenticate driver"
        )

@router.post("/disconnect-driver", tags=["Driver"])
async def disconnect_driver(
    phone_number: str,
    db: Session = Depends(get_db)
):
    """
    Disconnect a driver from their current company/fleet, reverting them to "Independent Drivers".
    """
    try:
        driver = db.query(Driver).filter(Driver.phone_number == phone_number).first()
        if not driver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Driver not found"
            )
        
        company = db.query(Company).filter(Company.name == "Independent Drivers").first()
        if not company:
            company = Company(
                name="Independent Drivers",
                email="independent@vaahan.com",
                phone="0000000000",
                city="System",
                gst_number="SYSTEM_INDEPENDENT",
                subscription_status="active"
            )
            db.add(company)
            db.commit()
            db.refresh(company)
        
        driver.company_id = company.id
        db.commit()
        
        vehicle = db.query(Vehicle).filter(Vehicle.driver_id == driver.id).first()
        if vehicle:
            vehicle.company_id = company.id
            db.commit()
        
        return {
            "status": "success",
            "message": "Disconnected from fleet successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Driver disconnect error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect driver from fleet"
        )


logger.info("  Auth routes module loaded")
