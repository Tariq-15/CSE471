"""Order-related routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.supabase_client import get_supabase

bp = Blueprint('orders', __name__, url_prefix='/api/orders')
supabase = get_supabase()


@bp.route('', methods=['POST'])
def create_order():
    """Create order from cart"""
    try:
        data = request.json
        session_id = data.get('session_id')
        customer_data = data.get('customer', {})
        discount_percentage = data.get('discount_percentage', 0)
        delivery_fee = data.get('delivery_fee', 15)
        
        if not session_id:
            return jsonify({
                "success": False,
                "message": "session_id is required"
            }), 400
        
        cart_response = supabase.table('cart_items')\
            .select('*, products(name, image_url, image_urls)')\
            .eq('session_id', session_id)\
            .execute()
        
        if not cart_response.data:
            return jsonify({
                "success": False,
                "message": "Cart is empty"
            }), 400
        
        subtotal = sum(float(item['price']) * item['quantity'] for item in cart_response.data)
        discount = subtotal * (discount_percentage / 100)
        total = subtotal - discount + delivery_fee
        
        customer_response = supabase.table('customers').insert({
            'full_name': customer_data.get('full_name'),
            'email': customer_data.get('email'),
            'phone_number': customer_data.get('phone_number'),
            'district': customer_data.get('district'),
            'thana': customer_data.get('thana'),
            'full_address': customer_data.get('full_address')
        }).execute()
        
        customer_id = customer_response.data[0]['id']
        user_id = data.get('user_id')
        
        order_data = {
            'customer_id': customer_id,
            'session_id': session_id,
            'subtotal': subtotal,
            'discount': discount,
            'delivery_fee': delivery_fee,
            'total': total,
            'status': 'pending'
        }
        if user_id:
            order_data['user_id'] = user_id
        
        order_response = supabase.table('orders').insert(order_data).execute()
        order_id = order_response.data[0]['id']
        
        order_items = []
        for item in cart_response.data:
            product_info = item.get('products', {})
            product_name = product_info.get('name') if product_info else None
            
            product_image = None
            if product_info:
                image_urls = product_info.get('image_urls')
                if image_urls and isinstance(image_urls, list) and len(image_urls) > 0:
                    product_image = image_urls[0]
                else:
                    product_image = product_info.get('image_url')
            
            order_items.append({
                'order_id': order_id,
                'product_id': item['product_id'],
                'product_name': product_name,
                'product_image': product_image,
                'size': item.get('size'),
                'color': item.get('color'),
                'quantity': item['quantity'],
                'price': item['price']
            })
        
        if order_items:
            supabase.table('order_items').insert(order_items).execute()
        
        supabase.table('cart_items').delete().eq('session_id', session_id).execute()
        
        return jsonify({
            "success": True,
            "message": "Order created successfully",
            "order_id": order_id,
            "order_summary": {
                "subtotal": round(subtotal, 2),
                "discount": round(discount, 2),
                "delivery_fee": delivery_fee,
                "total": round(total, 2)
            }
        }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<order_id>', methods=['GET'])
def get_order(order_id):
    """Get order details by ID"""
    try:
        order_response = supabase.table('orders')\
            .select('*, customers(*)')\
            .eq('id', order_id)\
            .execute()
        
        if not order_response.data:
            return jsonify({
                "success": False,
                "message": "Order not found"
            }), 404
        
        order = order_response.data[0]
        customer = order.get('customers', {})
        
        items_response = supabase.table('order_items')\
            .select('*')\
            .eq('order_id', order_id)\
            .execute()
        
        order_items = []
        for item in items_response.data:
            order_items.append({
                'product_image': item.get('product_image'),
                'product_name': item.get('product_name'),
                'price': float(item.get('price', 0)),
                'quantity': item.get('quantity', 0)
            })
        
        response_data = {
            'name': customer.get('full_name', ''),
            'order_date': order.get('created_at', ''),
            'phone': customer.get('phone_number', ''),
            'status': order.get('status', 'pending'),
            'district': customer.get('district', ''),
            'thana': customer.get('thana', ''),
            'address': customer.get('full_address', ''),
            'order': order_items,
            'subtotal': float(order.get('subtotal', 0)),
            'shipping': float(order.get('delivery_fee', 0)),
            'total': float(order.get('total', 0))
        }
        
        return jsonify({
            "success": True,
            "data": response_data
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('', methods=['GET'])
def get_all_orders():
    """Get all orders with customer info, status, and product images"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status_filter = request.args.get('status')
        
        offset = (page - 1) * limit
        
        query = supabase.table('orders').select('*, customers(full_name, full_address, district, thana, phone_number)', count='exact')
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        count_query = supabase.table('orders').select('id', count='exact')
        if status_filter:
            count_query = count_query.eq('status', status_filter)
        total_count = count_query.execute().count
        
        response = query.range(offset, offset + limit).order('created_at', desc=True).execute()
        
        orders_list = []
        for order in response.data:
            customer = order.get('customers', {})
            
            items_response = supabase.table('order_items')\
                .select('product_image, product_name')\
                .eq('order_id', order['id'])\
                .limit(4)\
                .execute()
            
            product_images = [item.get('product_image') for item in items_response.data if item.get('product_image')]
            
            order_data = {
                'id': order['id'],
                'name': customer.get('full_name', ''),
                'address': customer.get('full_address', ''),
                'order_status': order.get('status', 'pending'),
                'order_date': order.get('created_at', ''),
                'product_images': product_images[:4]
            }
            orders_list.append(order_data)
        
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        
        return jsonify({
            "success": True,
            "data": orders_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "count": len(orders_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

