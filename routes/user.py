"""User profile and related routes."""
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase

bp = Blueprint('user', __name__, url_prefix='/api/user')
supabase = get_supabase()


@bp.route('/profile', methods=['GET', 'PUT'])
def user_profile():
    """Get or update user profile"""
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            profile_response = supabase.table('user_profiles')\
                .select('*')\
                .eq('user_id', user_id)\
                .execute()
            
            if profile_response.data:
                return jsonify({
                    "success": True,
                    "data": profile_response.data[0]
                }), 200
            else:
                return jsonify({
                    "success": True,
                    "data": {
                        "user_id": user_id,
                        "first_name": None,
                        "last_name": None,
                        "phone_number": None
                    }
                }), 200
        
        elif request.method == 'PUT':
            data = request.json
            user_id = data.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            existing = supabase.table('user_profiles')\
                .select('id')\
                .eq('user_id', user_id)\
                .execute()
            
            update_data = {
                "first_name": data.get('first_name'),
                "last_name": data.get('last_name'),
                "phone_number": data.get('phone_number')
            }
            
            if existing.data:
                response = supabase.table('user_profiles')\
                    .update(update_data)\
                    .eq('user_id', user_id)\
                    .execute()
            else:
                update_data['user_id'] = user_id
                response = supabase.table('user_profiles')\
                    .insert(update_data)\
                    .execute()
            
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else update_data,
                "message": "Profile updated successfully"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/addresses', methods=['GET', 'POST'])
def user_addresses():
    """Get all addresses or create new address for a user"""
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            response = supabase.table('user_addresses')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('is_default', desc=True)\
                .order('created_at', desc=True)\
                .execute()
            
            return jsonify({
                "success": True,
                "data": response.data or []
            }), 200
        
        elif request.method == 'POST':
            data = request.json
            user_id = data.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            if data.get('is_default'):
                supabase.table('user_addresses')\
                    .update({'is_default': False})\
                    .eq('user_id', user_id)\
                    .execute()
            
            address_data = {
                "user_id": user_id,
                "label": data.get('label'),
                "full_name": data.get('full_name'),
                "phone_number": data.get('phone_number'),
                "district": data.get('district'),
                "thana": data.get('thana'),
                "full_address": data.get('full_address'),
                "is_default": data.get('is_default', False)
            }
            
            response = supabase.table('user_addresses')\
                .insert(address_data)\
                .execute()
            
            return jsonify({
                "success": True,
                "data": response.data[0],
                "message": "Address added successfully"
            }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/addresses/<address_id>', methods=['PUT', 'DELETE'])
def user_address(address_id):
    """Update or delete a user address"""
    try:
        if request.method == 'PUT':
            data = request.json
            user_id = data.get('user_id')
            
            if data.get('is_default') and user_id:
                supabase.table('user_addresses')\
                    .update({'is_default': False})\
                    .eq('user_id', user_id)\
                    .neq('id', address_id)\
                    .execute()
            
            update_data = {
                "label": data.get('label'),
                "full_name": data.get('full_name'),
                "phone_number": data.get('phone_number'),
                "district": data.get('district'),
                "thana": data.get('thana'),
                "full_address": data.get('full_address'),
                "is_default": data.get('is_default', False)
            }
            
            response = supabase.table('user_addresses')\
                .update(update_data)\
                .eq('id', address_id)\
                .execute()
            
            if not response.data:
                return jsonify({
                    "success": False,
                    "message": "Address not found"
                }), 404
            
            return jsonify({
                "success": True,
                "data": response.data[0],
                "message": "Address updated successfully"
            }), 200
        
        elif request.method == 'DELETE':
            response = supabase.table('user_addresses')\
                .delete()\
                .eq('id', address_id)\
                .execute()
            
            return jsonify({
                "success": True,
                "message": "Address deleted successfully"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/orders', methods=['GET'])
def user_orders():
    """Get order history for a user"""
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({
                "success": False,
                "message": "user_id is required"
            }), 400
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        offset = (page - 1) * limit
        
        orders_response = supabase.table('orders')\
            .select('*, customers(full_name, phone_number, district, thana, full_address)')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        orders_list = []
        for order in orders_response.data:
            items_response = supabase.table('order_items')\
                .select('*')\
                .eq('order_id', order['id'])\
                .execute()
            
            customer = order.get('customers', {})
            order_data = {
                "id": order['id'],
                "order_number": f"ORD-{order['id'][:8].upper()}",
                "date": order.get('created_at', ''),
                "status": order.get('status', 'pending'),
                "total": float(order.get('total', 0)),
                "subtotal": float(order.get('subtotal', 0)),
                "discount": float(order.get('discount', 0)),
                "delivery_fee": float(order.get('delivery_fee', 0)),
                "customer": {
                    "full_name": customer.get('full_name', ''),
                    "phone_number": customer.get('phone_number', ''),
                    "district": customer.get('district', ''),
                    "thana": customer.get('thana', ''),
                    "full_address": customer.get('full_address', '')
                },
                "items": items_response.data or []
            }
            orders_list.append(order_data)
        
        return jsonify({
            "success": True,
            "data": orders_list,
            "count": len(orders_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/wishlist', methods=['GET', 'POST', 'DELETE'])
def user_wishlist():
    """Get, add, or remove items from wishlist"""
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            response = supabase.table('wishlist_items')\
                .select('*, products(id, name, price, image_url, image_urls, category, tags)')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            wishlist_items = []
            for item in response.data or []:
                product = item.get('products', {})
                if product:
                    wishlist_items.append({
                        "id": item['id'],
                        "product_id": product.get('id'),
                        "name": product.get('name'),
                        "price": product.get('price'),
                        "image": product.get('image_urls', [product.get('image_url')])[0] if product.get('image_urls') else product.get('image_url'),
                        "rating": 4.0,
                        "created_at": item.get('created_at')
                    })
            
            return jsonify({
                "success": True,
                "data": wishlist_items
            }), 200
        
        elif request.method == 'POST':
            data = request.json
            user_id = data.get('user_id')
            product_id = data.get('product_id')
            
            if not user_id or not product_id:
                return jsonify({
                    "success": False,
                    "message": "user_id and product_id are required"
                }), 400
            
            existing = supabase.table('wishlist_items')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('product_id', product_id)\
                .execute()
            
            if existing.data:
                return jsonify({
                    "success": False,
                    "message": "Product already in wishlist"
                }), 400
            
            response = supabase.table('wishlist_items')\
                .insert({
                    "user_id": user_id,
                    "product_id": product_id
                })\
                .execute()
            
            return jsonify({
                "success": True,
                "data": response.data[0],
                "message": "Product added to wishlist"
            }), 201
        
        elif request.method == 'DELETE':
            user_id = request.args.get('user_id')
            product_id = request.args.get('product_id')
            
            if not user_id or not product_id:
                return jsonify({
                    "success": False,
                    "message": "user_id and product_id are required"
                }), 400
            
            response = supabase.table('wishlist_items')\
                .delete()\
                .eq('user_id', user_id)\
                .eq('product_id', product_id)\
                .execute()
            
            return jsonify({
                "success": True,
                "message": "Product removed from wishlist"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

