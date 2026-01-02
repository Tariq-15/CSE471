"""
Main Flask application file.
This file imports and registers all route blueprints.
"""
from flask import Flask
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
CORS(app)

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

