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
                # Support both category name (legacy) and category_id
                try:
                    category_id = int(category)
                    query = query.eq('category_id', category_id)
                except ValueError:
                    # If not a number, treat as category name
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
            category_name = data.get('category')
            category_id = data.get('category_id')
            
            # Handle category: if category_id is provided, use it; otherwise look up by name
            if category_id:
                # Verify category exists
                cat_check = supabase.table('categories').select('id, name').eq('id', category_id).execute()
                if not cat_check.data:
                    return jsonify({"success": False, "error": f"Category with ID {category_id} not found"}), 400
                category_id = cat_check.data[0]['id']
                category_name = cat_check.data[0]['name']
            elif category_name:
                # Look up category by name
                cat_check = supabase.table('categories').select('id, name').eq('name', category_name).execute()
                if cat_check.data:
                    category_id = cat_check.data[0]['id']
                    category_name = cat_check.data[0]['name']
                else:
                    # Category doesn't exist, create it
                    new_cat = supabase.table('categories').insert({'name': category_name}).execute()
                    if new_cat.data:
                        category_id = new_cat.data[0]['id']
                        category_name = new_cat.data[0]['name']
            
            product_data = {
                'name': data.get('name'),
                'description': data.get('description', ''),
                'category': category_name,  # Keep for backward compatibility
                'category_id': category_id,
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
            update_data = {k: v for k, v in data.items() if k not in ['size_stocks', 'size_chart_template_id', 'category', 'category_id'] and v is not None}
            
            # Handle category update: support both category_id and category name
            if 'category_id' in data and data['category_id']:
                category_id = data['category_id']
                # Verify category exists and get name
                cat_check = supabase.table('categories').select('id, name').eq('id', category_id).execute()
                if cat_check.data:
                    update_data['category_id'] = cat_check.data[0]['id']
                    update_data['category'] = cat_check.data[0]['name']  # Keep for backward compatibility
                else:
                    return jsonify({"success": False, "error": f"Category with ID {category_id} not found"}), 400
            elif 'category' in data and data['category']:
                category_name = data['category']
                # Look up category by name
                cat_check = supabase.table('categories').select('id, name').eq('name', category_name).execute()
                if cat_check.data:
                    update_data['category_id'] = cat_check.data[0]['id']
                    update_data['category'] = cat_check.data[0]['name']
                else:
                    # Category doesn't exist, create it
                    new_cat = supabase.table('categories').insert({'name': category_name}).execute()
                    if new_cat.data:
                        update_data['category_id'] = new_cat.data[0]['id']
                        update_data['category'] = new_cat.data[0]['name']
            
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
        offset = (page - 1) * limit
        
        query = supabase.table('customers').select('*', count='exact')
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
        
        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        customers = []
        for c in response.data or []:
            # Get order statistics for each customer
            orders_response = supabase.table('orders')\
                .select('id, total')\
                .eq('customer_id', c['id'])\
                .execute()
            
            orders_count = len(orders_response.data) if orders_response.data else 0
            total_spent = sum(float(order.get('total', 0)) for order in (orders_response.data or []))
            
            c['orders_count'] = orders_count
            c['total_spent'] = round(total_spent, 2)
            c['name'] = c.get('full_name', 'Unknown')
            c['joinDate'] = c.get('created_at', '')
            
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
        from datetime import datetime
        current_month = datetime.now().strftime('%Y-%m')
        
        response = supabase.table('customers').select('id, created_at, user_id', count='exact').execute()
        customers = response.data or []
        
        new_this_month = sum(1 for c in customers if c.get('created_at', '').startswith(current_month))
        registered_count = len([c for c in customers if c.get('user_id')])
        
        # Calculate total revenue from all orders
        orders_response = supabase.table('orders').select('total').execute()
        total_revenue = sum(float(order.get('total', 0)) for order in (orders_response.data or []))
        
        return jsonify({
            "success": True,
            "data": {
                "total": response.count or len(customers),
                "active": registered_count,  # Registered customers
                "registered": registered_count,
                "unregistered": len(customers) - registered_count,
                "new_this_month": new_this_month,
                "total_revenue": round(total_revenue, 2)
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Users Routes
@bp.route('/users', methods=['GET'])
def admin_users():
    """Get all users including Google authenticated users"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 100, type=int)  # Increased default limit to show all users
        search = request.args.get('search', '')
        offset = (page - 1) * limit
        
        # Collect all unique user_ids from multiple sources
        user_ids_set = set()
        users_dict = {}
        
        # 1. Get users from user_profiles table (all 7 users)
        profiles_response = supabase.table('user_profiles').select('user_id, first_name, last_name, phone_number, created_at').execute()
        for profile in (profiles_response.data or []):
            user_id = profile.get('user_id')
            if user_id:
                user_ids_set.add(user_id)
                users_dict[user_id] = {
                    'id': user_id,
                    'email': None,
                    'full_name': f"{profile.get('first_name', '')} {profile.get('last_name', '')}".strip() or None,
                    'phone_number': profile.get('phone_number'),
                    'created_at': profile.get('created_at'),
                    'auth_provider': 'email',
                    'source': 'user_profiles'
                }
        
        # 2. Get users from customers table who have user_id (registered users, including Google)
        customers_response = supabase.table('customers')\
            .select('user_id, email, full_name, created_at')\
            .execute()
        
        for customer in (customers_response.data or []):
            user_id = customer.get('user_id')
            if user_id:
                user_ids_set.add(user_id)
                if user_id not in users_dict:
                    # New user from customers (likely Google authenticated)
                    users_dict[user_id] = {
                        'id': user_id,
                        'email': customer.get('email'),
                        'full_name': customer.get('full_name'),
                        'phone_number': None,
                        'created_at': customer.get('created_at'),
                        'auth_provider': 'google',
                        'source': 'customers'
                    }
                else:
                    # Update existing user with customer data
                    if not users_dict[user_id].get('email'):
                        users_dict[user_id]['email'] = customer.get('email')
                    if not users_dict[user_id].get('full_name'):
                        users_dict[user_id]['full_name'] = customer.get('full_name')
                    if not users_dict[user_id].get('created_at'):
                        users_dict[user_id]['created_at'] = customer.get('created_at')
        
        # 3. Get users from orders table (users who placed orders)
        orders_response = supabase.table('orders')\
            .select('user_id, created_at')\
            .execute()
        
        for order in (orders_response.data or []):
            user_id = order.get('user_id')
            if user_id:
                user_ids_set.add(user_id)
                if user_id not in users_dict:
                    # User found only in orders (might be Google authenticated)
                    users_dict[user_id] = {
                        'id': user_id,
                        'email': None,
                        'full_name': None,
                        'phone_number': None,
                        'created_at': order.get('created_at'),
                        'auth_provider': 'google',
                        'source': 'orders'
                    }
        
        # Convert dict to list
        users = list(users_dict.values())
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            users = [u for u in users if 
                    (u.get('email', '') and search_lower in u.get('email', '').lower()) or
                    (u.get('full_name', '') and search_lower in u.get('full_name', '').lower())]
        
        # Sort by created_at (most recent first)
        users.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        
        # Apply pagination
        total_count = len(users)
        paginated_users = users[offset:offset + limit]
        
        # Enrich with additional data
        enriched_users = []
        for user in paginated_users:
            user_id = user.get('id')
            
            # Get order count and total spent
            orders_response = supabase.table('orders')\
                .select('id, total')\
                .eq('user_id', user_id)\
                .execute()
            
            orders_count = len(orders_response.data) if orders_response.data else 0
            total_spent = sum(float(o.get('total', 0)) for o in (orders_response.data or []))
            
            # Try to get email from customers if not set
            if not user.get('email'):
                customer_response = supabase.table('customers')\
                    .select('email')\
                    .eq('user_id', user_id)\
                    .limit(1)\
                    .execute()
                if customer_response.data:
                    user['email'] = customer_response.data[0].get('email')
            
            enriched_users.append({
                'id': user_id,
                'email': user.get('email') or 'N/A',
                'full_name': user.get('full_name') or 'Unknown',
                'phone_number': user.get('phone_number'),
                'created_at': user.get('created_at'),
                'auth_provider': user.get('auth_provider', 'email'),
                'orders_count': orders_count,
                'total_spent': round(total_spent, 2),
                'has_profile': user.get('source') == 'user_profiles'
            })
        
        return jsonify({
            "success": True,
            "data": enriched_users,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": (total_count + limit - 1) // limit if total_count > 0 else 0
            }
        }), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Admin users error: {error_trace}")
        return jsonify({"success": False, "error": str(e)}), 500


# Admin Categories Routes
@bp.route('/categories', methods=['GET', 'POST'])
def admin_categories():
    """Get all categories or create a new category"""
    try:
        if request.method == 'GET':
            response = supabase.table('categories').select('*', count='exact').order('name').execute()
            
            categories = []
            for cat in (response.data or []):
                # Get product count for each category using category_id
                products_response = supabase.table('products')\
                    .select('id', count='exact')\
                    .eq('category_id', cat['id'])\
                    .execute()
                
                cat['products_count'] = products_response.count or 0
                categories.append(cat)
            
            return jsonify({
                "success": True,
                "data": categories
            }), 200
        
        elif request.method == 'POST':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({"success": False, "error": "Category name is required"}), 400
            
            # Check if category already exists
            existing = supabase.table('categories').select('id').eq('name', data['name']).execute()
            if existing.data:
                return jsonify({"success": False, "error": f"Category '{data['name']}' already exists"}), 400
            
            category_data = {
                'name': data['name'],
                'description': data.get('description', '')
            }
            
            response = supabase.table('categories').insert(category_data).execute()
            
            if response.data:
                return jsonify({
                    "success": True,
                    "data": response.data[0],
                    "message": "Category created successfully"
                }), 201
            else:
                return jsonify({"success": False, "error": "Failed to create category"}), 500
                
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in admin_categories: {error_trace}")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/categories/<int:category_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_category_detail(category_id):
    """Get, update or delete a category"""
    try:
        if request.method == 'GET':
            response = supabase.table('categories').select('*').eq('id', category_id).execute()
            if not response.data:
                return jsonify({"success": False, "message": "Category not found"}), 404
            
            category = response.data[0]
            # Get product count using category_id
            products_response = supabase.table('products')\
                .select('id', count='exact')\
                .eq('category_id', category['id'])\
                .execute()
            
            category['products_count'] = products_response.count or 0
            
            return jsonify({"success": True, "data": category}), 200
        
        elif request.method == 'PUT':
            data = request.json
            if not data or not data.get('name'):
                return jsonify({"success": False, "error": "Category name is required"}), 400
            
            # Check if another category with the same name exists
            existing = supabase.table('categories').select('id').eq('name', data['name']).neq('id', category_id).execute()
            if existing.data:
                return jsonify({"success": False, "error": f"Category '{data['name']}' already exists"}), 400
            
            update_data = {
                'name': data['name'],
                'description': data.get('description', '')
            }
            
            response = supabase.table('categories').update(update_data).eq('id', category_id).execute()
            
            if response.data:
                return jsonify({"success": True, "data": response.data[0]}), 200
            else:
                return jsonify({"success": False, "error": "Failed to update category"}), 500
        
        elif request.method == 'DELETE':
            # Check if category is used by any products using category_id
            products_response = supabase.table('products')\
                .select('id', count='exact')\
                .eq('category_id', category_id)\
                .execute()
            
            if products_response.count and products_response.count > 0:
                return jsonify({
                    "success": False,
                    "error": f"Cannot delete category. It is used by {products_response.count} product(s)"
                }), 400
            
            supabase.table('categories').delete().eq('id', category_id).execute()
            return jsonify({"success": True, "message": "Category deleted"}), 200
            
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in admin_category_detail: {error_trace}")
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
        # Get only active products
        products_response = supabase.table('products')\
            .select('id, name, stock')\
            .eq('status', 'active')\
            .execute()
        products = {p['id']: p for p in (products_response.data or [])}
        
        # Get sales count from order_items
        items_response = supabase.table('order_items').select('product_id, quantity').execute()
        sales_count = defaultdict(int)
        for item in (items_response.data or []):
            product_id = item.get('product_id')
            if product_id and product_id in products:  # Only count active products
                sales_count[product_id] += item.get('quantity', 1)
        
        # Sort by sales count and get top products
        best_selling = []
        for product_id, sales in sorted(sales_count.items(), key=lambda x: x[1], reverse=True)[:limit]:
            product = products.get(product_id, {})
            best_selling.append({
                "id": str(product_id),
                "name": product.get('name', 'Unknown'),
                "sales": sales,
                "stock": product.get('stock', 0)
            })
        
        # If we don't have enough products with sales, fill with products that have stock
        if len(best_selling) < limit:
            remaining = limit - len(best_selling)
            for product in products.values():
                if str(product['id']) not in [p['id'] for p in best_selling]:
                    best_selling.append({
                        "id": str(product['id']),
                        "name": product.get('name', 'Unknown'),
                        "sales": 0,
                        "stock": product.get('stock', 0)
                    })
                    remaining -= 1
                    if remaining <= 0:
                        break
        
        return jsonify({"success": True, "data": best_selling}), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Best selling error: {error_trace}")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/dashboard/low-stock', methods=['GET'])
def admin_dashboard_low_stock():
    """Get low stock items (stock <= 10 and > 0, only active products)"""
    try:
        limit = request.args.get('limit', 10, type=int)
        response = supabase.table('products')\
            .select('id, name, stock, category')\
            .eq('status', 'active')\
            .lte('stock', 10)\
            .gt('stock', 0)\
            .order('stock')\
            .limit(limit)\
            .execute()
        
        low_stock_items = []
        for item in (response.data or []):
            low_stock_items.append({
                "id": str(item.get('id', '')),
                "name": item.get('name', 'Unknown'),
                "stock": item.get('stock', 0),
                "category": item.get('category', 'N/A')
            })
        
        return jsonify({"success": True, "data": low_stock_items}), 200
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Low stock error: {error_trace}")
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

