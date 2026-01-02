"""OTP-related routes for SMS verification."""
from flask import Blueprint, request, jsonify
import random
import urllib.parse
import requests
from datetime import datetime, timedelta
from utils.supabase_client import get_supabase
from utils.otp_utils import otp_storage

bp = Blueprint('otp', __name__, url_prefix='/api/otp')
supabase = get_supabase()

# SMS API Configuration
SMS_API_KEY = "KnTJvkYZz7wypnpETNsy"
SMS_SENDER_ID = "8809617623860"
SMS_API_URL = "http://bulksmsbd.net/api/smsapi"
BRAND_NAME = "VELORA"


def generate_otp():
    """Generate a 4-digit OTP"""
    return str(random.randint(1000, 9999))


def format_phone_number(phone: str) -> str:
    """Add country code 88 before phone number if not present"""
    phone = phone.strip()
    if not phone.startswith('88'):
        phone = '88' + phone
    return phone


def send_sms(phone_number: str, message: str) -> dict:
    """Send SMS using bulksmsbd.net API"""
    try:
        formatted_phone = format_phone_number(phone_number)
        encoded_message = urllib.parse.quote(message)
        
        url = f"{SMS_API_URL}?api_key={SMS_API_KEY}&type=text&number={formatted_phone}&senderid={SMS_SENDER_ID}&message={encoded_message}"
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            result = response.text.strip()
            
            # Try to parse as JSON first
            try:
                json_result = response.json()
                response_code = json_result.get('response_code')
                success_message = json_result.get('success_message', '')
                error_message = json_result.get('error_message', '')
                
                # Check if response_code is 202 (success) or if success_message exists
                if response_code == 202 or (success_message and not error_message):
                    return {"success": True, "message": success_message or "SMS sent successfully"}
                else:
                    return {"success": False, "message": f"SMS API Error: {error_message or f'Response code: {response_code}'}"}
            except (ValueError, AttributeError):
                # If not JSON, check if it's just "202" as string
                if result == "202":
                    return {"success": True, "message": "SMS sent successfully"}
                else:
                    return {"success": False, "message": f"SMS API Error: {result}"}
        else:
            return {"success": False, "message": f"HTTP Error: {response.status_code}"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send SMS: {str(e)}"}


@bp.route('/send', methods=['POST'])
def send_otp():
    """Send OTP to phone number"""
    try:
        data = request.json
        phone_number = data.get('phone_number')
        
        if not phone_number:
            return jsonify({
                "success": False,
                "message": "Phone number is required"
            }), 400
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with expiration (5 minutes)
        otp_key = f"{phone_number}_{datetime.now().timestamp()}"
        otp_storage[phone_number] = {
            'otp': otp,
            'expires_at': datetime.now() + timedelta(minutes=5),
            'attempts': 0
        }
        
        # Create SMS message
        message = f"Your {BRAND_NAME} OTP is {otp}"
        
        # Send SMS
        sms_result = send_sms(phone_number, message)
        
        if sms_result['success']:
            return jsonify({
                "success": True,
                "message": "OTP sent successfully",
                "data": {
                    "phone_number": phone_number,
                    "expires_in": 300  # 5 minutes in seconds
                }
            }), 200
        else:
            # Still store OTP even if SMS fails (for testing)
            return jsonify({
                "success": False,
                "message": sms_result['message']
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to send OTP: {str(e)}"
        }), 500


@bp.route('/verify', methods=['POST'])
def verify_otp():
    """Verify OTP"""
    try:
        data = request.json
        phone_number = data.get('phone_number')
        otp = data.get('otp')
        
        if not phone_number or not otp:
            return jsonify({
                "success": False,
                "message": "Phone number and OTP are required"
            }), 400
        
        # Check if OTP exists
        if phone_number not in otp_storage:
            return jsonify({
                "success": False,
                "message": "OTP not found. Please request a new OTP."
            }), 400
        
        otp_data = otp_storage[phone_number]
        
        # Check if OTP has expired
        if datetime.now() > otp_data['expires_at']:
            del otp_storage[phone_number]
            return jsonify({
                "success": False,
                "message": "OTP has expired. Please request a new OTP."
            }), 400
        
        # Check attempts (max 5 attempts)
        if otp_data['attempts'] >= 5:
            del otp_storage[phone_number]
            return jsonify({
                "success": False,
                "message": "Too many failed attempts. Please request a new OTP."
            }), 400
        
        # Verify OTP
        if otp_data['otp'] == otp:
            # OTP verified successfully
            # Mark as verified (store for 10 minutes for order creation)
            otp_storage[phone_number]['verified'] = True
            otp_storage[phone_number]['verified_at'] = datetime.now()
            otp_storage[phone_number]['expires_at'] = datetime.now() + timedelta(minutes=10)
            
            return jsonify({
                "success": True,
                "message": "OTP verified successfully",
                "data": {
                    "phone_number": phone_number,
                    "verified": True
                }
            }), 200
        else:
            # Increment attempts
            otp_data['attempts'] += 1
            remaining_attempts = 5 - otp_data['attempts']
            return jsonify({
                "success": False,
                "message": f"Invalid OTP. {remaining_attempts} attempts remaining."
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to verify OTP: {str(e)}"
        }), 500


@bp.route('/check-verification', methods=['POST'])
def check_verification():
    """Check if phone number has verified OTP"""
    try:
        data = request.json
        phone_number = data.get('phone_number')
        
        if not phone_number:
            return jsonify({
                "success": False,
                "message": "Phone number is required"
            }), 400
        
        if phone_number not in otp_storage:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "OTP not found"
            }), 200
        
        otp_data = otp_storage[phone_number]
        
        # Check if verified and not expired
        if otp_data.get('verified') and datetime.now() <= otp_data['expires_at']:
            return jsonify({
                "success": True,
                "verified": True,
                "message": "Phone number is verified"
            }), 200
        else:
            return jsonify({
                "success": False,
                "verified": False,
                "message": "Phone number is not verified"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Failed to check verification: {str(e)}"
        }), 500

