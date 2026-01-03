import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Wrap the Flask app to ensure CORS headers are always set
class CORSMiddleware:
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        def new_start_response(status, response_headers, exc_info=None):
            # Add CORS headers
            response_headers.append(('Access-Control-Allow-Origin', '*'))
            response_headers.append(('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH'))
            response_headers.append(('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'))
            response_headers.append(('Access-Control-Max-Age', '3600'))
            return start_response(status, response_headers, exc_info)
        
        return self.app(environ, new_start_response)

# Wrap the app with CORS middleware
app = CORSMiddleware(app)

# Vercel Python runtime automatically detects Flask apps
# The app variable is automatically used as the WSGI application

