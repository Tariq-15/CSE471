"""Cart-related routes."""
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase

bp = Blueprint('cart', __name__, url_prefix='/api/cart')
supabase = get_supabase()


@bp.route('', methods=['GET'])
def get_cart():
    """Get cart items by session_id"""
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({
                "success": False,
                "message": "session_id is required"
            }), 400
        
        cart_response = supabase.table('cart_items')\
            .select('*, products(name, image_url, description)')\
            .eq('session_id', session_id)\
            .order('created_at', desc=True)\
            .execute()
        
        items = []
        for item in cart_response.data:
            product_info = item.get('products', {})
            items.append({
                'id': item['id'],
                'product_id': item['product_id'],
                'product_name': product_info.get('name') if product_info else None,
                'size': item.get('size'),
                'color': item.get('color'),
                'quantity': item['quantity'],
                'price': float(item['price']),
                'image_url': product_info.get('image_url') if product_info else None,
                'description': product_info.get('description') if product_info else None
            })
        
        subtotal = sum(float(item['price']) * item['quantity'] for item in items)
        
        return jsonify({
            "success": True,
            "data": {
                "items": items,
                "subtotal": round(subtotal, 2),
                "item_count": len(items)
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('', methods=['POST'])
def add_to_cart():
    """Add item to cart"""
    try:
        data = request.json
        session_id = data.get('session_id')
        product_id = data.get('product_id')
        size = data.get('size')
        color = data.get('color')
        quantity = data.get('quantity', 1)
        
        if not session_id or not product_id:
            return jsonify({
                "success": False,
                "message": "session_id and product_id are required"
            }), 400
        
        product_response = supabase.table('products').select('price').eq('id', product_id).execute()
        
        if not product_response.data:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        price = product_response.data[0]['price']
        
        existing_response = supabase.table('cart_items')\
            .select('id, quantity')\
            .eq('session_id', session_id)\
            .eq('product_id', product_id)\
            .eq('size', size)\
            .eq('color', color)\
            .execute()
        
        if existing_response.data:
            existing_item = existing_response.data[0]
            new_quantity = existing_item['quantity'] + quantity
            supabase.table('cart_items')\
                .update({'quantity': new_quantity})\
                .eq('id', existing_item['id'])\
                .execute()
            cart_item_id = existing_item['id']
        else:
            cart_data = {
                'session_id': session_id,
                'product_id': product_id,
                'size': size,
                'color': color,
                'quantity': quantity,
                'price': price
            }
            response = supabase.table('cart_items').insert(cart_data).execute()
            cart_item_id = response.data[0]['id'] if response.data else None
        
        return jsonify({
            "success": True,
            "message": "Item added to cart",
            "cart_item_id": cart_item_id
        }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<cart_item_id>', methods=['PUT'])
def update_cart_item(cart_item_id):
    """Update cart item quantity"""
    try:
        data = request.json
        quantity = data.get('quantity')
        
        if not quantity or quantity < 1:
            return jsonify({
                "success": False,
                "message": "Valid quantity is required"
            }), 400
        
        response = supabase.table('cart_items')\
            .update({'quantity': quantity})\
            .eq('id', cart_item_id)\
            .execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Cart item not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Cart item updated"
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<cart_item_id>', methods=['DELETE'])
def remove_from_cart(cart_item_id):
    """Remove item from cart"""
    try:
        response = supabase.table('cart_items').delete().eq('id', cart_item_id).execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Cart item not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Item removed from cart"
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

