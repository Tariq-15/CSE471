import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel Python runtime automatically detects Flask apps
# The app variable is automatically used as the WSGI application

