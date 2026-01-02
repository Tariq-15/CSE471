"""OTP utility functions for verification."""
from datetime import datetime, timedelta

# In-memory OTP storage (in production, use Redis or database)
otp_storage = {}


def is_phone_verified(phone_number: str) -> tuple[bool, str]:
    """
    Check if phone number is verified.
    Returns: (is_verified: bool, message: str)
    """
    if phone_number not in otp_storage:
        return False, "Please verify your phone number with OTP first"
    
    otp_data = otp_storage.get(phone_number)
    if not otp_data.get('verified'):
        return False, "Phone number not verified. Please verify OTP first."
    
    # Check if verification is still valid (10 minutes)
    if datetime.now() > otp_data.get('expires_at', datetime.now()):
        return False, "OTP verification expired. Please verify again."
    
    return True, "Phone number is verified"

