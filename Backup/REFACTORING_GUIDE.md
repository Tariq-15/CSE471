# File Structure Refactoring Guide

This guide explains the new organized file structure and how to complete the refactoring.

## New Structure

```
CSE471/
├── app.py                    # Original file (keep as backup)
├── app_new.py                  # New organized main file
├── config.py                # Configuration settings
├── utils/                    # Shared utilities
│   ├── __init__.py
│   ├── supabase_client.py   # Supabase client initialization
│   └── image_utils.py        # Image processing utilities
├── routes/                   # Feature-based route modules
│   ├── __init__.py
│   ├── products.py          # Product-related routes (PARTIALLY COMPLETE)
│   ├── cart.py              # Cart routes (TO BE CREATED)
│   ├── orders.py            # Order routes (TO BE CREATED)
│   ├── user.py              # User profile routes (TO BE CREATED)
│   ├── admin.py             # Admin routes (TO BE CREATED)
│   ├── recommendations.py   # Recommendation routes (TO BE CREATED)
│   ├── virtual_try_on.py   # Virtual try-on routes (TO BE CREATED)
│   ├── upload.py            # Image upload routes (TO BE CREATED)
│   └── size_charts.py       # Size chart routes (TO BE CREATED)
└── extract_routes.py        # Helper script to extract routes
```

## Features Identified

Based on the original `app.py`, here are the main features:

1. **Products** (`routes/products.py`)
   - `/api/products/filter` - Filter products
   - `/api/products/<id>` - Get product details
   - `/api/products/<id>/size-chart` - Get size chart
   - `/api/products/<id>/reviews` - Get/add reviews
   - `/api/products/<id>/related` - Get related products
   - `/api/products/new-arrivals` - Get new arrivals
   - `/api/products/best-selling` - Get best sellers
   - `/api/products/featured` - Get featured products
   - `/api/products/categories` - Get categories
   - `/api/products` - Get all products
   - `/api/products/search` - Search products

2. **Cart** (`routes/cart.py`)
   - `/api/cart` - GET/POST cart items
   - `/api/cart/<id>` - PUT/DELETE cart item

3. **Orders** (`routes/orders.py`)
   - `/api/orders` - POST create order, GET all orders
   - `/api/orders/<id>` - GET order details

4. **User** (`routes/user.py`)
   - `/api/user/profile` - GET/PUT user profile
   - `/api/user/addresses` - GET/POST addresses
   - `/api/user/addresses/<id>` - PUT/DELETE address
   - `/api/user/orders` - GET user orders
   - `/api/user/wishlist` - GET/POST/DELETE wishlist

5. **Admin** (`routes/admin.py`)
   - `/api/admin/products` - Admin product management
   - `/api/admin/orders` - Admin order management
   - `/api/admin/customers` - Admin customer management
   - `/api/admin/dashboard/*` - Dashboard stats
   - `/api/admin/discounts` - Discount management

6. **Recommendations** (`routes/recommendations.py`)
   - `/api/recommendations` - POST get recommendations

7. **Virtual Try-On** (`routes/virtual_try_on.py`)
   - `/api/virtual-try-on` - POST generate try-on image
   - `/api/virtual-try-on/download` - POST download image

8. **Upload** (`routes/upload.py`)
   - `/api/admin/upload/image` - POST single image
   - `/api/admin/upload/images` - POST multiple images
   - `/api/admin/upload/delete` - DELETE image

9. **Size Charts** (`routes/size_charts.py`)
   - `/api/admin/size-charts/templates` - Template management
   - `/api/admin/size-charts/templates/<id>/rows` - Row management
   - `/api/admin/size-charts/templates/<id>/columns` - Column management
   - `/api/admin/size-charts/templates/<id>/values` - Value management

## How to Complete the Refactoring

### Step 1: Create Route Files

For each feature, create a route file following this pattern:

```python
"""Feature description."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils import get_supabase

bp = Blueprint('feature_name', __name__, url_prefix='/api/feature-prefix')
supabase = get_supabase()

@bp.route('/endpoint', methods=['GET', 'POST'])
def function_name():
    """Route description."""
    try:
        # Route logic here
        return jsonify({"success": True, "data": result}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
```

### Step 2: Extract Routes from app.py

1. Find the route in `app.py` using the section markers (lines with `# ===`)
2. Copy the route function
3. Replace `@app.route` with `@bp.route`
4. Update imports to use `from utils import get_supabase`
5. Remove any direct `supabase` initialization (use `get_supabase()`)

### Step 3: Register Blueprints

In `app_new.py`, uncomment the import and registration for each completed route module.

### Step 4: Test

1. Rename `app.py` to `app_old.py` (backup)
2. Rename `app_new.py` to `app.py`
3. Test all endpoints to ensure they work

## Helper Script

The `extract_routes.py` script can help identify all routes. Run it with:

```bash
python extract_routes.py
```

## Notes

- All routes should use the `get_supabase()` utility function
- Configuration is centralized in `config.py`
- Image utilities are in `utils/image_utils.py`
- Each route file should be self-contained for its feature

## Status

- ✅ Configuration (`config.py`)
- ✅ Utilities (`utils/`)
- ✅ Products routes (PARTIALLY COMPLETE - needs more routes added)
- ⏳ Cart routes
- ⏳ Orders routes
- ⏳ User routes
- ⏳ Admin routes
- ⏳ Recommendations routes
- ⏳ Virtual Try-On routes
- ⏳ Upload routes
- ⏳ Size Charts routes

