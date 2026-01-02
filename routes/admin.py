"""Admin-related routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from collections import defaultdict, Counter
from utils.supabase_client import get_supabase

bp = Blueprint('admin', __name__, url_prefix='/api/admin')
supabase = get_supabase()


# Admin Products Routes
@bp.route('/products', methods=['GET', 'POST'])
def admin_products():
    """Get all products or create a new product"""
    try:
        if request.method == 'GET':
            page = request.args.get('page', 1, type=int)
            limit = request.args.get('limit', 20, type=int)
            search = request.args.get('search', '')
            category = request.args.get('category', '')
            offset = (page - 1) * limit
            
            query = supabase.table('products').select('*', count='exact')
            
            if search:
                query = query.ilike('name', f'%{search}%')
            if category:
                query = query.eq('category', category)
            
            response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            
            return jsonify({
                "success": True,
                "data": response.data or [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": response.count or 0,
                    "total_pages": ((response.count or 0) + limit - 1) // limit
                }
            }), 200
        
        elif request.method == 'POST':
            data = request.json
            product_data = {
                'name': data.get('name'),
                'description': data.get('description', ''),
                'category': data.get('category'),
                'price': data.get('price'),
                'original_price': data.get('original_price'),
                'image_url': data.get('image_url'),
                'image_urls': data.get('image_urls', []),
                'color': data.get('color', []),
                'size': data.get('size', []),
                'tags': data.get('tags', []),
                'stock': data.get('stock', 0),
                'status': data.get('status', 'active')
            }
            response = supabase.table('products').insert(product_data).execute()
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Product created successfully"
            }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_product_detail(product_id):
    """Get, update or delete a product"""
    try:
        if request.method == 'GET':
            response = supabase.table('products').select('*').eq('id', product_id).execute()
            if not response.data:
                return jsonify({"success": False, "message": "Product not found"}), 404
            
            product_data = response.data[0]
            
            # Calculate total sold and revenue from order_items
            try:
                order_items_response = supabase.table('order_items')\
                    .select('quantity, price')\
                    .eq('product_id', product_id)\
                    .execute()
                
                total_sold = 0
                total_revenue = 0.0
                
                if order_items_response.data:
                    for item in order_items_response.data:
                        quantity = item.get('quantity', 0)
                        price = float(item.get('price', 0))
                        total_sold += quantity
                        total_revenue += price * quantity
                
                product_data['sold'] = total_sold
                product_data['total_revenue'] = round(total_revenue, 2)
            except Exception as e:
                print(f"Warning: Could not calculate sold/revenue: {e}")
                product_data['sold'] = 0
                product_data['total_revenue'] = 0.0
            
            if product_data.get('size_chart_template_id'):
                try:
                    product_sizes_response = supabase.table('product_sizes')\
                        .select('id, size_row_id')\
                        .eq('product_id', product_id)\
                        .execute()
                    
                    size_stocks = []
                    if product_sizes_response.data:
                        for ps in product_sizes_response.data:
                            product_size_id = ps['id']
                            row_id = ps['size_row_id']
                            
                            row_response = supabase.table('size_chart_rows')\
                                .select('size_label')\
                                .eq('id', row_id)\
                                .execute()
                            
                            size_label = ''
                            if row_response.data and len(row_response.data) > 0:
                                size_label = row_response.data[0].get('size_label', '')
                            
                            stock_response = supabase.table('product_size_stock')\
                                .select('stock_quantity')\
                                .eq('product_size_id', product_size_id)\
                                .execute()
                            
                            stock_value = 0
                            if stock_response.data and len(stock_response.data) > 0:
                                stock_value = stock_response.data[0].get('stock_quantity', 0)
                            
                            if size_label:
                                size_stocks.append({
                                    'row_id': row_id,
                                    'size_label': size_label,
                                    'stock': stock_value
                                })
                    
                    product_data['size_stocks'] = size_stocks
                except Exception as e:
                    print(f"Warning: Could not fetch size stocks: {e}")
                    import traceback
                    traceback.print_exc()
                    product_data['size_stocks'] = []
            else:
                product_data['size_stocks'] = []
            
            return jsonify({"success": True, "data": product_data}), 200
        
        elif request.method == 'PUT':
            data = request.json
            update_data = {k: v for k, v in data.items() if k not in ['size_stocks', 'size_chart_template_id'] and v is not None}
            
            if 'size_chart_template_id' in data:
                template_id = data['size_chart_template_id']
                update_data['size_chart_template_id'] = template_id
                
                if template_id:
                    try:
                        template_rows = supabase.table('size_chart_rows').select('id, size_label').eq('template_id', template_id).execute()
                        
                        if template_rows.data:
                            existing_sizes = supabase.table('product_sizes').select('id, size_row_id').eq('product_id', product_id).execute()
                            existing_row_ids = {s['size_row_id'] for s in (existing_sizes.data or []) if s.get('size_row_id')}
                            
                            for row in template_rows.data:
                                if row['id'] not in existing_row_ids:
                                    supabase.table('product_sizes').insert({
                                        'product_id': product_id,
                                        'size_row_id': row['id'],
                                        'size_label': row.get('size_label', ''),
                                        'is_active': True
                                    }).execute()
                    except Exception as e:
                        print(f"Warning: Could not auto-create product_sizes: {e}")
            
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            
            if 'size_stocks' in data and data['size_stocks']:
                try:
                    size_stocks = data['size_stocks']
                    
                    for stock_item in size_stocks:
                        row_id = stock_item.get('row_id')
                        stock = stock_item.get('stock', 0)
                        
                        if row_id:
                            # Find or create product_size record
                            product_size = supabase.table('product_sizes').select('id').eq('product_id', product_id).eq('size_row_id', row_id).execute()
                            
                            product_size_id = None
                            if product_size.data and len(product_size.data) > 0:
                                product_size_id = product_size.data[0]['id']
                            else:
                                # Create product_size if it doesn't exist
                                row_info = supabase.table('size_chart_rows').select('size_label').eq('id', row_id).execute()
                                size_label = row_info.data[0]['size_label'] if row_info.data else ''
                                
                                new_size = supabase.table('product_sizes').insert({
                                    'product_id': product_id,
                                    'size_row_id': row_id,
                                    'size_label': size_label,
                                    'is_active': True
                                }).execute()
                                
                                if new_size.data:
                                    product_size_id = new_size.data[0]['id']
                            
                            if product_size_id:
                                existing_stock = supabase.table('product_size_stock').select('id').eq('product_size_id', product_size_id).execute()
                                
                                if existing_stock.data and len(existing_stock.data) > 0:
                                    # Update existing stock
                                    supabase.table('product_size_stock').update({
                                        'stock_quantity': stock,
                                        'reserved_quantity': 0  # Ensure reserved_quantity is set
                                    }).eq('product_size_id', product_size_id).execute()
                                else:
                                    # Insert new stock record
                                    supabase.table('product_size_stock').insert({
                                        'product_size_id': product_size_id,
                                        'stock_quantity': stock,
                                        'reserved_quantity': 0  # Required field
                                    }).execute()
                except Exception as e:
                    print(f"Warning: Could not update size stock: {e}")
            
            return jsonify({"success": True, "data": response.data[0] if response.data else None}), 200
        
        elif request.method == 'DELETE':
            supabase.table('products').delete().eq('id', product_id).execute()
            return jsonify({"success": True, "message": "Product deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Orders Routes
@bp.route('/orders', methods=['GET'])
def admin_orders():
    """Get all orders"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status', '')
        search = request.args.get('search', '')
        offset = (page - 1) * limit
        
        query = supabase.table('orders').select('*, customers(full_name, email, phone_number, district, thana, full_address)', count='exact')
        if status and status != 'all':
            query = query.eq('status', status)
        
        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        # Format orders for admin panel
        orders_list = []
        for order in (response.data or []):
            customer = order.get('customers', {})
            if isinstance(customer, list) and len(customer) > 0:
                customer = customer[0]
            elif not customer:
                customer = {}
            
            # Get order items count
            items_response = supabase.table('order_items')\
                .select('id', count='exact')\
                .eq('order_id', order['id'])\
                .execute()
            items_count = items_response.count if hasattr(items_response, 'count') else len(items_response.data or [])
            
            order_data = {
                'id': order.get('id'),
                'order_number': f"ORD-{order.get('id', '')[:8].upper()}" if order.get('id') else 'N/A',
                'customer': customer.get('full_name', 'Unknown Customer'),
                'email': customer.get('email', ''),
                'date': order.get('created_at', ''),
                'created_at': order.get('created_at', ''),
                'status': order.get('status', 'pending'),
                'total': float(order.get('total', 0)),
                'subtotal': float(order.get('subtotal', 0)),
                'discount': float(order.get('discount', 0)),
                'delivery_fee': float(order.get('delivery_fee', 0)),
                'items_count': items_count,
                'customer_id': order.get('customer_id'),
                'user_id': order.get('user_id'),
                'session_id': order.get('session_id')
            }
            orders_list.append(order_data)
        
        return jsonify({
            "success": True,
            "data": orders_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": response.count or 0,
                "total_pages": ((response.count or 0) + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/orders/stats', methods=['GET'])
def admin_orders_stats():
    """Get order statistics"""
    try:
        response = supabase.table('orders').select('status').execute()
        orders = response.data or []
        status_counts = Counter(o.get('status') for o in orders)
        return jsonify({
            "success": True,
            "data": {
                "pending": status_counts.get('pending', 0),
                "processing": status_counts.get('processing', 0),
                "completed": status_counts.get('completed', 0) + status_counts.get('delivered', 0),
                "failed": status_counts.get('failed', 0),
                "returned": status_counts.get('returned', 0)
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/orders/<order_id>', methods=['GET'])
def admin_order_detail(order_id):
    """Get order details"""
    try:
        response = supabase.table('orders').select('*, customers(*), order_items(*)').eq('id', order_id).execute()
        if not response.data:
            return jsonify({"success": False, "message": "Order not found"}), 404
        return jsonify({"success": True, "data": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/orders/<order_id>/status', methods=['PUT'])
def admin_order_status(order_id):
    """Update order status"""
    try:
        data = request.json
        status = data.get('status')
        response = supabase.table('orders').update({'status': status}).eq('id', order_id).execute()
        return jsonify({
            "success": True,
            "data": response.data[0] if response.data else None,
            "message": "Order status updated"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Customers Routes
@bp.route('/customers', methods=['GET'])
def admin_customers():
    """Get all customers"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        search = request.args.get('search', '')
        customer_type = request.args.get('customer_type', 'all')
        offset = (page - 1) * limit
        
        query = supabase.table('customers').select('*', count='exact')
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
        
        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        customers = []
        for c in response.data or []:
            c['customer_type'] = 'verified' if c.get('user_id') else 'cold'
            if customer_type == 'all' or c['customer_type'] == customer_type:
                customers.append(c)
        
        return jsonify({
            "success": True,
            "data": customers,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": response.count or 0,
                "total_pages": ((response.count or 0) + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/customers/stats', methods=['GET'])
def admin_customers_stats():
    """Get customer statistics"""
    try:
        response = supabase.table('customers').select('id, created_at, user_id', count='exact').execute()
        customers = response.data or []
        
        current_month = datetime.now().strftime('%Y-%m')
        new_this_month = sum(1 for c in customers if c.get('created_at', '').startswith(current_month))
        
        return jsonify({
            "success": True,
            "data": {
                "total": len(customers),
                "active": len(customers),
                "new_this_month": new_this_month,
                "total_revenue": 0
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Dashboard Routes
@bp.route('/dashboard/stats', methods=['GET'])
def admin_dashboard_stats():
    """Get dashboard statistics"""
    try:
        products_response = supabase.table('products').select('id, stock, price', count='exact').execute()
        products = products_response.data or []
        total_products = products_response.count or len(products)
        low_stock_count = sum(1 for p in products if 0 < (p.get('stock') or 0) <= 10)
        
        orders_response = supabase.table('orders').select('id, status, total', count='exact').execute()
        orders = orders_response.data or []
        total_orders = orders_response.count or len(orders)
        total_revenue = sum(float(o.get('total', 0)) for o in orders if o.get('status') not in ['cancelled', 'failed'])
        pending_orders = sum(1 for o in orders if o.get('status') == 'pending')
        completed_orders = sum(1 for o in orders if o.get('status') in ['completed', 'delivered'])
        failed_orders = sum(1 for o in orders if o.get('status') == 'failed')
        returned_orders = sum(1 for o in orders if o.get('status') == 'returned')
        
        customers_response = supabase.table('customers').select('id', count='exact').execute()
        new_customers = customers_response.count or 0
        
        return jsonify({
            "success": True,
            "data": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": total_orders,
                "new_customers": new_customers,
                "total_products": total_products,
                "low_stock_count": low_stock_count,
                "pending_orders": pending_orders,
                "completed_orders": completed_orders,
                "failed_orders": failed_orders,
                "returned_orders": returned_orders
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/dashboard/sales', methods=['GET'])
def admin_dashboard_sales():
    """Get sales data for charts"""
    try:
        orders_response = supabase.table('orders').select('total, created_at, status').execute()
        orders = orders_response.data or []
        
        sales_by_period = defaultdict(float)
        
        for order in orders:
            if order.get('status') in ['cancelled', 'failed']:
                continue
            try:
                created_at = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
                key = created_at.strftime('%b')
                sales_by_period[key] += float(order.get('total', 0))
            except:
                pass
        
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        sales_data = [{"name": m, "revenue": round(sales_by_period.get(m, 0), 2)} for m in months]
        
        return jsonify({"success": True, "data": sales_data}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/dashboard/best-selling', methods=['GET'])
def admin_dashboard_best_selling():
    """Get best selling products"""
    try:
        limit = request.args.get('limit', 5, type=int)
        products_response = supabase.table('products').select('id, name, stock').execute()
        products = {p['id']: p for p in (products_response.data or [])}
        
        items_response = supabase.table('order_items').select('product_id, quantity').execute()
        sales_count = defaultdict(int)
        for item in (items_response.data or []):
            sales_count[item['product_id']] += item.get('quantity', 1)
        
        best_selling = []
        for product_id, sales in sorted(sales_count.items(), key=lambda x: x[1], reverse=True)[:limit]:
            product = products.get(product_id, {})
            best_selling.append({
                "id": product_id,
                "name": product.get('name', 'Unknown'),
                "sales": sales,
                "stock": product.get('stock', 0)
            })
        
        return jsonify({"success": True, "data": best_selling}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/dashboard/low-stock', methods=['GET'])
def admin_dashboard_low_stock():
    """Get low stock items"""
    try:
        limit = request.args.get('limit', 10, type=int)
        response = supabase.table('products').select('id, name, stock, category').lte('stock', 10).gt('stock', 0).order('stock').limit(limit).execute()
        return jsonify({"success": True, "data": response.data or []}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Discounts Routes
@bp.route('/discounts', methods=['GET', 'POST'])
def admin_discounts():
    """Get all discounts or create a new discount"""
    try:
        if request.method == 'GET':
            page = request.args.get('page', 1, type=int)
            limit = request.args.get('limit', 20, type=int)
            search = request.args.get('search', '')
            offset = (page - 1) * limit
            
            query = supabase.table('discounts').select('*', count='exact')
            if search:
                query = query.ilike('code', f'%{search}%')
            
            response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            
            return jsonify({
                "success": True,
                "data": response.data or [],
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": response.count or 0,
                    "total_pages": ((response.count or 0) + limit - 1) // limit
                }
            }), 200
        
        elif request.method == 'POST':
            data = request.json
            discount_data = {
                'code': data.get('code'),
                'discount': data.get('discount'),
                'type': data.get('type', 'percentage'),
                'expiration_date': data.get('expiration_date'),
                'status': 'active',
                'usage_limit': data.get('usage_limit', 100),
                'usage_count': 0,
                'min_order_value': data.get('min_order_value', 0)
            }
            response = supabase.table('discounts').insert(discount_data).execute()
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Discount created successfully"
            }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/discounts/stats', methods=['GET'])
def admin_discounts_stats():
    """Get discount statistics"""
    try:
        response = supabase.table('discounts').select('*').execute()
        discounts = response.data or []
        
        active = sum(1 for d in discounts if d.get('status') == 'active')
        expired = sum(1 for d in discounts if d.get('status') == 'expired')
        total_uses = sum(d.get('usage_count', 0) for d in discounts)
        discount_value_given = sum(d.get('usage_count', 0) * d.get('discount', 0) for d in discounts)
        
        return jsonify({
            "success": True,
            "data": {
                "active": active,
                "total_uses": total_uses,
                "discount_value_given": round(discount_value_given, 2),
                "expired": expired
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/discounts/<discount_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_discount_detail(discount_id):
    """Get, update or delete a discount"""
    try:
        if request.method == 'GET':
            response = supabase.table('discounts').select('*').eq('id', discount_id).execute()
            if not response.data:
                return jsonify({"success": False, "message": "Discount not found"}), 404
            return jsonify({"success": True, "data": response.data[0]}), 200
        
        elif request.method == 'PUT':
            data = request.json
            update_data = {k: v for k, v in data.items() if v is not None}
            response = supabase.table('discounts').update(update_data).eq('id', discount_id).execute()
            return jsonify({"success": True, "data": response.data[0] if response.data else None}), 200
        
        elif request.method == 'DELETE':
            supabase.table('discounts').delete().eq('id', discount_id).execute()
            return jsonify({"success": True, "message": "Discount deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/discounts/validate', methods=['POST'])
def validate_discount_code():
    """Validate a discount/promo code"""
    try:
        data = request.json
        code = data.get('code')
        
        if not code:
            return jsonify({
                "success": False,
                "message": "Promo code is required"
            }), 400
        
        # Find the discount code (case-insensitive)
        code_upper = code.upper().strip()
        # Get all discounts and find matching one (case-insensitive)
        all_discounts = supabase.table('discounts').select('*').execute()
        matching_discount = None
        for discount in (all_discounts.data or []):
            discount_code = discount.get('code', '').upper().strip()
            if discount_code == code_upper:
                matching_discount = discount
                break
        
        if not matching_discount:
            return jsonify({
                "success": False,
                "message": "Invalid promo code"
            }), 400
        
        discount = matching_discount
        
        # Check if code is active
        if discount.get('status') != 'active':
            return jsonify({
                "success": False,
                "message": "This promo code is not active"
            }), 400
        
        # Check expiration date
        expiration_date = discount.get('expiration_date')
        if expiration_date:
            from datetime import datetime
            try:
                exp_date = datetime.strptime(expiration_date, '%Y-%m-%d').date()
                if datetime.now().date() > exp_date:
                    return jsonify({
                        "success": False,
                        "message": "This promo code has expired"
                    }), 400
            except:
                pass  # If date parsing fails, skip expiration check
        
        # Check usage limit
        usage_count = discount.get('usage_count', 0)
        usage_limit = discount.get('usage_limit', 100)
        if usage_count >= usage_limit:
            return jsonify({
                "success": False,
                "message": "This promo code has reached its usage limit"
            }), 400
        
        # Return discount details
        return jsonify({
            "success": True,
            "data": {
                "id": discount.get('id'),
                "code": discount.get('code'),
                "discount": float(discount.get('discount', 0)),
                "type": discount.get('type', 'percentage'),
                "expiration_date": discount.get('expiration_date'),
                "status": discount.get('status'),
                "usage_count": discount.get('usage_count', 0),
                "usage_limit": discount.get('usage_limit', 100),
                "min_order_value": float(discount.get('min_order_value', 0))
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "message": f"An error occurred while validating the promo code: {str(e)}"
        }), 500

