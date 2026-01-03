"""
Main Flask application file.
This file imports and registers all route blueprints.
"""
from flask import Flask, jsonify
from flask_cors import CORS

# Import route blueprints
from routes import (
    products_bp,
    cart_bp,
    orders_bp,
    user_bp,
    admin_bp,
    recommendations_bp,
    virtual_try_on_bp,
    upload_bp,
    size_charts_bp,
    test_bp,
    otp_bp
)

app = Flask(__name__)
# Configure CORS to allow requests from all origins (needed for Vercel deployments)
CORS(app, 
     origins="*",
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
     allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
     supports_credentials=False
)

# Add explicit CORS headers for all responses (needed for Vercel serverless)
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response

# Handle OPTIONS requests explicitly
@app.before_request
def handle_preflight():
    """Handle CORS preflight requests"""
    from flask import request
    if request.method == "OPTIONS":
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response

# Root route
@app.route('/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({
        "message": "VELORA API Server",
        "status": "running",
        "version": "1.0.0"
    })

# Register all blueprints
app.register_blueprint(products_bp)
app.register_blueprint(cart_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(user_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(recommendations_bp)
app.register_blueprint(virtual_try_on_bp)
app.register_blueprint(upload_bp)
app.register_blueprint(size_charts_bp)
app.register_blueprint(test_bp)
app.register_blueprint(otp_bp)


if __name__ == '__main__':
    app.run(debug=True, port=1581)

