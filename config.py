"""Configuration file for the Flask application."""
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_IMAGE_API')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash-image')  # Model name can stay as default

# Flask Configuration
DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
PORT = int(os.getenv('FLASK_PORT', '1581'))