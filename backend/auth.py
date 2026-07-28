"""
================================================================================
    FLEET TELEMATICS PLATFORM - Authentication & Security
    
    Module: auth.py
    Purpose: JWT token management, password hashing, OTP generation/verification
    Description:
        - JWT token creation and validation (24-hour expiry)
        - Password hashing with bcrypt (12 rounds)
        - OTP generation and verification (5-minute expiry)
        - Secure authentication for drivers and fleet owners
    
    Author: Team
    Version: 1.0.0
    Last Modified: 2026
================================================================================
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Dict, Optional
import os
import random
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# SECURITY CONFIGURATION
# ============================================================================

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 30

"""
Security Notes:
- In production: Use environment variable for SECRET_KEY
- Use strong 32+ character key
- Rotate keys regularly
- Use HTTPS for all communications
"""


# ============================================================================
# JWT TOKEN MANAGEMENT
# ============================================================================

class JWTManager:
    """
    JWT Token creation, validation, and refresh
    
    Tokens contain:
        - user_id: UUID of driver or fleet owner
        - role: "driver" or "fleet_owner"
        - email: User email (optional)
        - exp: Expiration time
        - iat: Issued at time
    """
    
    @staticmethod
    def create_access_token(user_id: str, role: str, email: str = None) -> str:
        """
        Create JWT access token (24-hour expiry)
        
        Args:
            user_id: User UUID
            role: "driver" or "fleet_owner"
            email: User email (optional)
            
        Returns:
            str: Encoded JWT token
            
        Example:
            token = JWTManager.create_access_token("uuid-123", "driver")
            # token = "eyJhbGciOiJIUzI1NiIs..."
        """
        payload = {
            "user_id": str(user_id),
            "role": role,
            "email": email,
            "exp": datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        logger.info(f"Access token created for user: {user_id}")
        return token
    
    @staticmethod
    def create_refresh_token(user_id: str, role: str) -> str:
        """
        Create JWT refresh token (30-day expiry)
        
        Args:
            user_id: User UUID
            role: User role
            
        Returns:
            str: Encoded refresh token
        """
        payload = {
            "user_id": str(user_id),
            "role": role,
            "exp": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        return token
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict]:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            dict: Token payload if valid, None if invalid
            
        Raises:
            jwt.ExpiredSignatureError: Token has expired
            jwt.InvalidTokenError: Token is invalid
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Verify expiration
            if "exp" in payload:
                exp_time = datetime.fromtimestamp(payload["exp"])
                if datetime.utcnow() > exp_time:
                    logger.warning(f"⚠️  Token expired for user: {payload.get('user_id')}")
                    return None
            
            logger.debug(f"  Token verified for user: {payload.get('user_id')}")
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("⚠️  Token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"⚠️  Invalid token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"❌ Token verification error: {str(e)}")
            return None


# ============================================================================
# PASSWORD HASHING
# ============================================================================

class PasswordManager:
    """
    Secure password hashing and verification using bcrypt
    
    Features:
        - 12 rounds of hashing (computationally expensive)
        - Salting is automatic with bcrypt
        - Resistant to rainbow tables
    """
    
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hash password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            str: Hashed password (can be stored in database)
            
        Example:
            hashed = PasswordManager.hash_password("user_password")
            # hashed = "$2b$12$..."
        """
        try:
            # Generate salt with 12 rounds
            salt = bcrypt.gensalt(rounds=12)
            # Hash password
            hashed = bcrypt.hashpw(password.encode(), salt).decode()
            logger.debug("Password hashed successfully")
            return hashed
        except Exception as e:
            logger.error(f"Password hashing failed: {str(e)}")
            raise
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verify password against hash
        
        Args:
            password: Plain text password to verify
            hashed_password: Hashed password from database
            
        Returns:
            bool: True if password matches, False otherwise
            
        Example:
            if PasswordManager.verify_password("user_password", hashed_from_db):
                print("Password is correct")
        """
        try:
            is_valid = bcrypt.checkpw(password.encode(), hashed_password.encode())
            if is_valid:
                logger.debug("  Password verified successfully")
            else:
                logger.warning("⚠️  Password verification failed")
            return is_valid
        except Exception as e:
            logger.error(f"❌ Password verification error: {str(e)}")
            return False


# ============================================================================
# OTP MANAGEMENT
# ============================================================================

class OTPManager:
    """
    OTP (One-Time Password) generation and verification
    
    Features:
        - 6-digit random codes
        - 5-minute expiry
        - 3 attempt limit
        - In-memory storage (use Redis in production)
    """
    
    # In-memory OTP store (use Redis in production!)
    otp_store = {}
    
    @staticmethod
    def generate_otp(phone_number: str) -> str:
        """
        Generate 6-digit OTP for phone number
        
        Args:
            phone_number: Driver or fleet owner phone number
            
        Returns:
            str: 6-digit OTP code
            
        Notes:
            - OTP expires after 5 minutes
            - Max 3 attempts to enter OTP
            - Stored in memory (use Redis in production)
            
        Example:
            otp = OTPManager.generate_otp("9876543210")
            # otp = "123456"
            # Send to user via SMS
        """
        # Generate 6-digit code
        otp_code = str(random.randint(100000, 999999))
        
        # Store with expiry and attempts
        OTPManager.otp_store[phone_number] = {
            "code": otp_code,
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "attempts": 0,
            "created_at": datetime.utcnow()
        }
        
        logger.info(f"OTP generated for {phone_number}: {otp_code}")
        # In production, send via SMS: send_sms(phone_number, f"Your OTP: {otp_code}")
        return otp_code
    
    @staticmethod
    def verify_otp(phone_number: str, code: str) -> bool:
        """
        Verify OTP code
        
        Args:
            phone_number: Driver or fleet owner phone number
            code: OTP code entered by user
            
        Returns:
            bool: True if OTP is valid, False otherwise
            
        Validation checks:
            1. OTP exists for this phone number
            2. OTP has not expired (5 minutes)
            3. Less than 3 attempt failures
            4. Code matches stored code
            
        Example:
            if OTPManager.verify_otp("9876543210", "123456"):
                # Create user account
            else:
                # Show error: Invalid OTP
        """
        if phone_number not in OTPManager.otp_store:
            logger.warning(f"⚠️  OTP not found for {phone_number}")
            return False
        
        otp_data = OTPManager.otp_store[phone_number]
        
        # Check expiry
        if datetime.utcnow() > otp_data["expires_at"]:
            logger.warning(f"⚠️  OTP expired for {phone_number}")
            del OTPManager.otp_store[phone_number]
            return False
        
        # Check attempts (max 3)
        if otp_data["attempts"] >= 3:
            logger.warning(f"⚠️  Too many OTP attempts for {phone_number}")
            del OTPManager.otp_store[phone_number]
            return False
        
        # Verify code
        if otp_data["code"] != code:
            otp_data["attempts"] += 1
            logger.warning(f"⚠️  Invalid OTP attempt ({otp_data['attempts']}/3) for {phone_number}")
            return False
        
        # OTP verified - delete from store
        del OTPManager.otp_store[phone_number]
        logger.info(f"  OTP verified successfully for {phone_number}")
        return True
    
    @staticmethod
    def get_otp(phone_number: str) -> Optional[str]:
        """
        Get stored OTP for a phone number (for testing only)
        
        Args:
            phone_number: Phone number to lookup
            
        Returns:
            str: OTP code if exists, None otherwise
            
        WARNING: Only use for development/testing
        """
        if phone_number in OTPManager.otp_store:
            return OTPManager.otp_store[phone_number]["code"]
        return None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_token_payload(token: str) -> Optional[Dict]:
    """
    Get payload from token without verification (for debugging only)
    
    WARNING: This decodes without verifying signature
    Use only for debugging, never in production decision-making
    """
    try:
        payload = jwt.decode(token, options={"verify_signature": False})
        return payload
    except:
        return None


if __name__ == "__main__":
    # Test examples
    print("Testing Authentication Module...")
    
    # Test JWT
    token = JWTManager.create_access_token("user-123", "driver", "driver@example.com")
    print(f"Token created: {token[:50]}...")
    
    payload = JWTManager.verify_token(token)
    print(f"Token verified: {payload}")
    
    # Test Password
    pwd = "user_password_123"
    hashed = PasswordManager.hash_password(pwd)
    print(f"Password hashed: {hashed[:50]}...")
    
    is_valid = PasswordManager.verify_password(pwd, hashed)
    print(f"Password verified: {is_valid}")
    
    # Test OTP
    otp = OTPManager.generate_otp("9876543210")
    print(f"OTP generated: {otp}")
    
    verified = OTPManager.verify_otp("9876543210", otp)
    print(f"OTP verified: {verified}")
