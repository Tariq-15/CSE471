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
        if not data:
            return jsonify({
                "success": False,
                "message": "Request body is required"
            }), 400
            
        session_id = data.get('session_id')
        customer_data = data.get('customer', {})
        discount_percentage = data.get('discount_percentage', 0)
        discount_amount = data.get('discount_amount', 0)
        delivery_fee = data.get('delivery_fee', 15)
        
        # Validate required fields
        if not session_id:
            return jsonify({
                "success": False,
                "message": "session_id is required"
            }), 400
        
        # Validate customer data
        required_customer_fields = ['full_name', 'email', 'phone_number', 'district', 'thana', 'full_address']
        missing_fields = [field for field in required_customer_fields if not customer_data.get(field)]
        if missing_fields:
            return jsonify({
                "success": False,
                "message": f"Missing required customer fields: {', '.join(missing_fields)}"
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
        
        # Calculate subtotal with validation
        subtotal = 0
        for item in cart_response.data:
            try:
                price = float(item.get('price', 0))
                quantity = int(item.get('quantity', 0))
                if price <= 0 or quantity <= 0:
                    return jsonify({
                        "success": False,
                        "message": f"Invalid price or quantity in cart item"
                    }), 400
                subtotal += price * quantity
            except (ValueError, TypeError) as e:
                return jsonify({
                    "success": False,
                    "message": f"Invalid cart item data: {str(e)}"
                }), 400
        
        # Calculate discount: use discount_amount if provided, otherwise calculate from percentage
        if discount_amount > 0:
            discount = float(discount_amount)
        else:
            discount = subtotal * (float(discount_percentage) / 100)
        
        total = subtotal - discount + float(delivery_fee)
        
        # Insert customer with error handling
        try:
            customer_response = supabase.table('customers').insert({
                'full_name': customer_data.get('full_name'),
                'email': customer_data.get('email'),
                'phone_number': customer_data.get('phone_number'),
                'district': customer_data.get('district'),
                'thana': customer_data.get('thana'),
                'full_address': customer_data.get('full_address')
            }).execute()
            
            if not customer_response.data:
                return jsonify({
                    "success": False,
                    "message": "Failed to create customer record"
                }), 500
                
            customer_id = customer_response.data[0]['id']
        except Exception as e:
            error_msg = str(e)
            # Check if it's a unique constraint violation (duplicate email)
            if 'duplicate' in error_msg.lower() or 'unique' in error_msg.lower():
                # Try to get existing customer by email
                existing_customer = supabase.table('customers')\
                    .select('id')\
                    .eq('email', customer_data.get('email'))\
                    .execute()
                if existing_customer.data:
                    customer_id = existing_customer.data[0]['id']
                else:
                    return jsonify({
                        "success": False,
                        "message": f"Customer creation failed: {error_msg}"
                    }), 400
            else:
                return jsonify({
                    "success": False,
                    "message": f"Customer creation failed: {error_msg}"
                }), 400
        user_id = data.get('user_id')
        
        order_data = {
            'customer_id': customer_id,
            'session_id': session_id,
            'subtotal': round(float(subtotal), 2),
            'discount': round(float(discount), 2),
            'delivery_fee': round(float(delivery_fee), 2),
            'total': round(float(total), 2),
            'status': 'pending',
            'payment_method': 'Cash on Delivery'
        }
        if user_id:
            order_data['user_id'] = user_id
        
        # Insert order with error handling
        try:
            order_response = supabase.table('orders').insert(order_data).execute()
            if not order_response.data:
                return jsonify({
                    "success": False,
                    "message": "Failed to create order"
                }), 500
            order_id = order_response.data[0]['id']
        except Exception as e:
            return jsonify({
                "success": False,
                "message": f"Order creation failed: {str(e)}"
            }), 400
        
        order_items = []
        for item in cart_response.data:
            product_info = item.get('products', {})
            # product_name is REQUIRED (NOT NULL) in database
            product_name = product_info.get('name') if product_info else 'Unknown Product'
            if not product_name or product_name.strip() == '':
                product_name = 'Unknown Product'
            
            product_image = None
            if product_info:
                image_urls = product_info.get('image_urls')
                if image_urls and isinstance(image_urls, list) and len(image_urls) > 0:
                    product_image = image_urls[0]
                else:
                    product_image = product_info.get('image_url')
            
            # Validate required fields before adding
            if not item.get('product_id'):
                return jsonify({
                    "success": False,
                    "message": f"Cart item missing product_id"
                }), 400
            
            if not item.get('quantity') or int(item.get('quantity', 0)) <= 0:
                return jsonify({
                    "success": False,
                    "message": f"Invalid quantity for cart item"
                }), 400
            
            if not item.get('price'):
                return jsonify({
                    "success": False,
                    "message": f"Cart item missing price"
                }), 400
            
            order_items.append({
                'order_id': order_id,
                'product_id': item['product_id'],
                'product_name': product_name,
                'product_image': product_image,
                'size': item.get('size') if item.get('size') else None,
                'quantity': int(item['quantity']),
                'price': round(float(item['price']), 2)
            })
        
        # Insert order items with error handling and update stock
        if order_items:
            try:
                items_response = supabase.table('order_items').insert(order_items).execute()
                if not items_response.data:
                    # Order created but items failed - this is a problem
                    # We should probably delete the order or handle this better
                    pass
                else:
                    # Decrease stock for each product
                    for item in cart_response.data:
                        product_id = item.get('product_id')
                        quantity = int(item.get('quantity', 0))
                        size = item.get('size')
                        
                        if product_id and quantity > 0:
                            try:
                                # Check if product has size chart (uses product_size_stock)
                                product = supabase.table('products').select('size_chart_template_id').eq('id', product_id).execute()
                                
                                if product.data and product.data[0].get('size_chart_template_id'):
                                    # Product uses size-based stock
                                    if size:
                                        # Find product_size by size_row_id (matching size_label)
                                        size_row = supabase.table('size_chart_rows')\
                                            .select('id')\
                                            .eq('size_label', size)\
                                            .eq('template_id', product.data[0]['size_chart_template_id'])\
                                            .execute()
                                        
                                        if size_row.data:
                                            row_id = size_row.data[0]['id']
                                            product_size = supabase.table('product_sizes')\
                                                .select('id')\
                                                .eq('product_id', product_id)\
                                                .eq('size_row_id', row_id)\
                                                .execute()
                                            
                                            if product_size.data:
                                                product_size_id = product_size.data[0]['id']
                                                # Get current stock
                                                stock_record = supabase.table('product_size_stock')\
                                                    .select('stock_quantity')\
                                                    .eq('product_size_id', product_size_id)\
                                                    .execute()
                                                
                                                if stock_record.data:
                                                    current_stock = stock_record.data[0].get('stock_quantity', 0)
                                                    new_stock = max(0, current_stock - quantity)
                                                    
                                                    # Update stock
                                                    supabase.table('product_size_stock')\
                                                        .update({'stock_quantity': new_stock})\
                                                        .eq('product_size_id', product_size_id)\
                                                        .execute()
                                    
                                    # Also update total product stock
                                    product_stock = supabase.table('products').select('stock').eq('id', product_id).execute()
                                    if product_stock.data:
                                        current_total_stock = product_stock.data[0].get('stock', 0)
                                        new_total_stock = max(0, current_total_stock - quantity)
                                        supabase.table('products')\
                                            .update({'stock': new_total_stock})\
                                            .eq('id', product_id)\
                                            .execute()
                                else:
                                    # Product uses simple stock (no size chart)
                                    product_stock = supabase.table('products').select('stock').eq('id', product_id).execute()
                                    if product_stock.data:
                                        current_stock = product_stock.data[0].get('stock', 0)
                                        new_stock = max(0, current_stock - quantity)
                                        supabase.table('products')\
                                            .update({'stock': new_stock})\
                                            .eq('id', product_id)\
                                            .execute()
                            except Exception as stock_error:
                                # Log stock update error but don't fail the order
                                print(f"Warning: Failed to update stock for product {product_id}: {str(stock_error)}")
            except Exception as e:
                return jsonify({
                    "success": False,
                    "message": f"Failed to create order items: {str(e)}"
                }), 400
        
        # Clear cart
        try:
            supabase.table('cart_items').delete().eq('session_id', session_id).execute()
        except Exception as e:
            # Cart clearing failed but order is created - log but don't fail
            print(f"Warning: Failed to clear cart: {str(e)}")
        
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
        import traceback
        error_trace = traceback.format_exc()
        print(f"Order creation error: {error_trace}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"An error occurred while creating the order: {str(e)}"
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

