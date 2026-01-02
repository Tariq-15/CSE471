"""Route blueprints for the Flask application."""

# Export all blueprints for easier imports
from .products import bp as products_bp
from .cart import bp as cart_bp
from .orders import bp as orders_bp
from .user import bp as user_bp
from .admin import bp as admin_bp
from .recommendations import bp as recommendations_bp
from .virtual_try_on import bp as virtual_try_on_bp
from .upload import bp as upload_bp
from .size_charts import bp as size_charts_bp
from .test import bp as test_bp

__all__ = [
    'products_bp',
    'cart_bp',
    'orders_bp',
    'user_bp',
    'admin_bp',
    'recommendations_bp',
    'virtual_try_on_bp',
    'upload_bp',
    'size_charts_bp',
    'test_bp'
]
