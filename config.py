"""Configuration file for the Flask application."""
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://lcwwwlfzpiwovrhhmwib.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd3d3bGZ6cGl3b3ZyaGhtd2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTk5MTAsImV4cCI6MjA4MDU5NTkxMH0.ickBC8Rglp6fBM7OULayfywgTxa0e8pUHGwuy9fdfIU')

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_IMAGE_API', 'AIzaSyDCLW5ESXh1_wc--e1OpcTpfVBLZO8RctM')
GEMINI_MODEL = "gemini-2.5-flash-image"  # Image generation model

# Flask Configuration
DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
PORT = int(os.getenv('FLASK_PORT', '1581'))

