"""Product-related routes."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from utils.supabase_client import get_supabase

bp = Blueprint('products', __name__, url_prefix='/api/products')
supabase = get_supabase()


@bp.route('/filter', methods=['GET'])
def get_products_filtered():
    """
    Get products with filters and sorting (Category Page API)
    Returns: Name, Rating (average), Image[2] (first 2 images), Price, Color
    """
    try:
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        tag = request.args.get('tag')
        search_query = request.args.get('q') or request.args.get('search')
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 9, type=int)
        sort = request.args.get('sort', 'newest')
        
        offset = (page - 1) * limit
        
        query = supabase.table('products').select('id, name, price, image_urls, color, category, tags', count='exact')
        query = query.eq('status', 'active')
        
        if search_query:
            query = query.ilike('name', f'%{search_query}%')
        if category:
            query = query.eq('category', category)
        if min_price is not None:
            query = query.gte('price', min_price)
        if max_price is not None:
            # If max_price is 99999, don't apply upper limit (show all products above min_price)
            if max_price != 99999:
                query = query.lte('price', max_price)
        
        tag_filter_applied = tag is not None
        
        count_query = supabase.table('products').select('id', count='exact')
        count_query = count_query.eq('status', 'active')
        if search_query:
            count_query = count_query.ilike('name', f'%{search_query}%')
        if category:
            count_query = count_query.eq('category', category)
        if min_price is not None:
            count_query = count_query.gte('price', min_price)
        if max_price is not None:
            # If max_price is 99999, don't apply upper limit
            if max_price != 99999:
                count_query = count_query.lte('price', max_price)
        total_count = count_query.execute().count
        
        if sort == 'price_high_low':
            query = query.order('price', desc=True)
        elif sort == 'price_low_high':
            query = query.order('price', desc=False)
        elif sort == 'newest':
            query = query.order('created_at', desc=True)
        elif sort == 'oldest':
            query = query.order('created_at', desc=False)
        else:
            query = query.order('created_at', desc=True)
        
        fetch_limit = limit * 3 if tag_filter_applied else limit
        response = query.range(offset, offset + fetch_limit).execute()
        
        products_list = []
        for product in response.data:
            if tag_filter_applied:
                product_tags = product.get('tags', [])
                if isinstance(product_tags, list):
                    if tag.lower() not in [t.lower() if isinstance(t, str) else str(t).lower() for t in product_tags]:
                        continue
                elif isinstance(product_tags, str):
                    if product_tags.lower() != tag.lower():
                        continue
                else:
                    continue
            
            product_id = product['id']
            
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
            
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            color_data = product.get('color', [])
            if isinstance(color_data, str):
                color_list = [color_data] if color_data else []
            elif isinstance(color_data, list):
                color_list = color_data
            else:
                color_list = []
            
            products_list.append({
                'id': product_id,
                'name': product['name'],
                'rating': average_rating,
                'image': images,
                'price': float(product['price']),
                'color': color_list
            })
            
            if len(products_list) >= limit:
                break
        
        if sort == 'rating_high_low':
            products_with_ratings = []
            for p in products_list:
                products_with_ratings.append((p['rating'], p))
            products_with_ratings.sort(key=lambda x: x[0], reverse=True)
            products_list = [p[1] for p in products_with_ratings]
        
        if tag_filter_applied:
            all_products = supabase.table('products').select('id, tags').execute()
            filtered_count = 0
            for p in all_products.data:
                if tag_filter_applied:
                    p_tags = p.get('tags', [])
                    tag_match = False
                    if isinstance(p_tags, list):
                        if tag.lower() in [t.lower() if isinstance(t, str) else str(t).lower() for t in p_tags]:
                            tag_match = True
                    elif isinstance(p_tags, str) and p_tags.lower() == tag.lower():
                        tag_match = True
                    if not tag_match:
                        continue
                
                filtered_count += 1
            total_count = filtered_count
        else:
            total_count = count_query.execute().count
        
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        
        return jsonify({
            "success": True,
            "data": products_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
                "showing": f"{offset + 1:02d}-{min(offset + len(products_list), total_count):02d} of {total_count} Products"
            },
            "filters_applied": {
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "color": color,
                "tag": tag,
                "sort": sort
            },
            "count": len(products_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get product details by ID"""
    try:
        response = supabase.table('products').select('*').eq('id', product_id).eq('status', 'active').execute()
        
        if response.data and len(response.data) > 0:
            product_data = response.data[0]
            
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
            
            return jsonify({
                "success": True,
                "data": product_data
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>/size-chart', methods=['GET'])
def get_product_size_chart(product_id):
    """Get size chart for a product (public endpoint)"""
    try:
        product_response = supabase.table('products').select('size_chart_template_id').eq('id', product_id).eq('status', 'active').execute()
        
        if not product_response.data or len(product_response.data) == 0:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        template_id = product_response.data[0].get('size_chart_template_id')
        if not template_id:
            return jsonify({
                "success": False,
                "message": "Product does not have a size chart"
            }), 404
        
        template_response = supabase.table('size_chart_templates').select('*').eq('id', template_id).execute()
        if not template_response.data:
            return jsonify({
                "success": False,
                "message": "Size chart template not found"
            }), 404
        
        template = template_response.data[0]
        rows_response = supabase.table('size_chart_rows').select('*').eq('template_id', template_id).order('sort_order').execute()
        columns_response = supabase.table('size_chart_columns').select('*').eq('template_id', template_id).order('sort_order').execute()
        
        rows = rows_response.data or []
        columns = columns_response.data or []
        row_ids = [r['id'] for r in rows]
        
        values_grid = {}
        if row_ids:
            values_response = supabase.table('size_chart_values').select('*').in_('row_id', row_ids).execute()
            row_map = {r['id']: r['size_label'] for r in rows}
            col_map = {c['id']: c['column_key'] for c in columns}
            for val in (values_response.data or []):
                row_label = row_map.get(val['row_id'])
                col_key = col_map.get(val['column_id'])
                if row_label and col_key:
                    if row_label not in values_grid:
                        values_grid[row_label] = {}
                    values_grid[row_label][col_key] = val['value']
        
        size_stocks = {}
        if row_ids:
            product_sizes = supabase.table('product_sizes')\
                .select('size_row_id, size_chart_rows(size_label), product_size_stock(stock_quantity)')\
                .eq('product_id', product_id)\
                .execute()
            
            if product_sizes.data:
                for ps in product_sizes.data:
                    row = ps.get('size_chart_rows')
                    stock_data = ps.get('product_size_stock')
                    
                    if isinstance(row, list) and len(row) > 0:
                        row = row[0]
                    elif not isinstance(row, dict):
                        continue
                    
                    if row:
                        size_label = row.get('size_label', '')
                        stock_value = 0
                        if stock_data:
                            if isinstance(stock_data, list) and len(stock_data) > 0:
                                stock_value = stock_data[0].get('stock_quantity', 0)
                            elif isinstance(stock_data, dict):
                                stock_value = stock_data.get('stock_quantity', 0)
                        size_stocks[size_label] = stock_value
        
        result = {
            'template_name': template.get('name', ''),
            'rows': rows,
            'columns': columns,
            'values_grid': values_grid,
            'size_stocks': size_stocks
        }
        
        return jsonify({
            "success": True,
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    """Get all reviews for a product"""
    try:
        response = supabase.table('reviews')\
            .select('*')\
            .eq('product_id', product_id)\
            .order('posted_date', desc=True)\
            .order('created_at', desc=True)\
            .execute()
        
        return jsonify({
            "success": True,
            "data": response.data,
            "count": len(response.data)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>/reviews', methods=['POST'])
def add_product_review(product_id):
    """Add a new review for a product"""
    try:
        data = request.json
        user_name = data.get('user_name')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not user_name or not rating:
            return jsonify({
                "success": False,
                "message": "user_name and rating are required"
            }), 400
        
        if rating < 1 or rating > 5:
            return jsonify({
                "success": False,
                "message": "Rating must be between 1 and 5"
            }), 400
        
        review_data = {
            'product_id': product_id,
            'user_name': user_name,
            'rating': rating,
            'comment': comment,
            'posted_date': datetime.now().date().isoformat()
        }
        
        response = supabase.table('reviews').insert(review_data).execute()
        
        return jsonify({
            "success": True,
            "message": "Review added successfully",
            "review_id": response.data[0]['id'] if response.data else None
        }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>/related', methods=['GET'])
def get_related_products(product_id):
    """Get related products (same category, excluding current product)"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        product_response = supabase.table('products').select('category').eq('id', product_id).execute()
        
        if product_response.data and product_response.data[0].get('category'):
            category = product_response.data[0]['category']
            response = supabase.table('products')\
                .select('id, name, description, price, original_price, image_url, image_urls, category')\
                .eq('category', category)\
                .eq('status', 'active')\
                .neq('id', product_id)\
                .limit(limit)\
                .execute()
        else:
            response = supabase.table('products')\
                .select('id, name, description, price, original_price, image_url, image_urls, category')\
                .neq('id', product_id)\
                .limit(limit)\
                .execute()
        
        formatted_products = []
        for product in response.data:
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product['id'])\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2] if len(image_urls) > 0 else []
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
            
            formatted_products.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'price': float(product.get('price', 0)),
                'rating': average_rating,
                'image': images
            })
        
        return jsonify({
            "success": True,
            "data": formatted_products,
            "count": len(formatted_products)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/new-arrivals', methods=['GET'])
def get_new_arrivals():
    """Get 4 most recently added products"""
    try:
        limit = request.args.get('limit', 4, type=int)
        
        # Get the most recently created products, ordered by created_at DESC
        response = supabase.table('products')\
            .select('id, name, price, image_urls, color, tags, created_at')\
            .eq('status', 'active')\
            .order('created_at', desc=True)\
            .limit(limit)\
            .execute()
        
        selected_products = response.data or []
        
        products_list = []
        for product in selected_products:
            product_id = product['id']
            
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': images,
                'image_url': images[0] if images else None,
                'price': float(product.get('price', 0))
            })
        
        return jsonify({
            "success": True,
            "data": products_list,
            "count": len(products_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/best-selling', methods=['GET'])
def get_best_selling_products():
    """Get top 4 best selling products by sales (only active products)"""
    try:
        limit = request.args.get('limit', 4, type=int)
        from collections import defaultdict
        
        # Get all order items with their quantities
        items_response = supabase.table('order_items').select('product_id, quantity').execute()
        
        # Count total sales per product
        sales_count = defaultdict(int)
        for item in (items_response.data or []):
            product_id = item.get('product_id')
            quantity = item.get('quantity', 1)
            if product_id:
                sales_count[product_id] += quantity
        
        # If no sales data, return empty (don't show random products)
        if not sales_count:
            return jsonify({
                "success": True,
                "data": [],
                "count": 0
            }), 200
        
        # Sort by sales count descending
        sorted_sales = sorted(sales_count.items(), key=lambda x: x[1], reverse=True)
        
        # Fetch more product IDs than needed (limit * 3) to account for inactive products
        fetch_limit = max(limit * 3, 20)  # Fetch at least 3x the limit or 20, whichever is larger
        candidate_product_ids = [pid for pid, _ in sorted_sales[:fetch_limit]]
        
        if not candidate_product_ids:
            return jsonify({
                "success": True,
                "data": [],
                "count": 0
            }), 200
        
        # Fetch product details for candidate products, filtering for active status
        products_response = supabase.table('products')\
            .select('id, name, price, image_urls, color, tags')\
            .eq('status', 'active')\
            .in_('id', candidate_product_ids)\
            .execute()
        
        # Create a map for quick lookup
        products_map = {p['id']: p for p in (products_response.data or [])}
        
        # Build products list, maintaining sales order, but only including active products
        products_list = []
        for product_id, sales_qty in sorted_sales:
            if len(products_list) >= limit:
                break
                
            product = products_map.get(product_id)
            if not product:
                continue  # Skip inactive or missing products
            
            # Get average rating from reviews
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in (reviews_response.data or []) if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            # Handle image URLs
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': images,
                'image_url': images[0] if images else None,
                'price': float(product.get('price', 0)),
                'sales': sales_qty
            })
        
        return jsonify({
            "success": True,
            "data": products_list,
            "count": len(products_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Get 4 random Featured Product products"""
    try:
        import random
        
        response = supabase.table('products').select('id, name, price, image_urls, color, tags').eq('status', 'active').execute()
        
        featured_products = []
        for product in response.data:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, list):
                if any('featured product' in str(t).lower() for t in product_tags):
                    featured_products.append(product)
            elif isinstance(product_tags, str) and 'featured product' in product_tags.lower():
                featured_products.append(product)
        
        if len(featured_products) > 4:
            selected_products = random.sample(featured_products, 4)
        else:
            selected_products = featured_products
        
        products_list = []
        for product in selected_products:
            product_id = product['id']
            
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image': images,
                'price': float(product.get('price', 0))
            })
        
        return jsonify({
            "success": True,
            "data": products_list,
            "count": len(products_list)
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/categories', methods=['GET'])
def get_product_categories():
    """Get all categories from categories table (preferred) or fallback to distinct from products"""
    try:
        # Try to get from categories table first
        try:
            categories_response = supabase.table('categories')\
                .select('name')\
                .order('name')\
                .execute()
            
            if categories_response.data:
                categories_list = [cat['name'] for cat in categories_response.data]
                return jsonify({
                    "success": True,
                    "data": categories_list
                }), 200
        except:
            pass  # Fallback to old method
        
        # Fallback: Get distinct categories from active products
        response = supabase.table('products')\
            .select('category')\
            .eq('status', 'active')\
            .execute()
        
        categories = set()
        for product in (response.data or []):
            category = product.get('category')
            if category:
                categories.add(category)
        
        categories_list = sorted(list(categories))
        
        return jsonify({
            "success": True,
            "data": categories_list
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('', methods=['GET'])
def get_all_products():
    """Get products with filters and pagination"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 9, type=int)
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        tag = request.args.get('tag')
        
        offset = (page - 1) * limit
        
        query = supabase.table('products').select('id, name, price, image_urls, category, color, tags', count='exact')
        query = query.eq('status', 'active')
        
        if category:
            query = query.eq('category', category)
        if min_price is not None:
            query = query.gte('price', min_price)
        if max_price is not None:
            # If max_price is 99999, don't apply upper limit (show all products above min_price)
            if max_price != 99999:
                query = query.lte('price', max_price)
        
        tag_filter_applied = tag is not None
        
        count_query = supabase.table('products').select('id', count='exact')
        count_query = count_query.eq('status', 'active')
        if category:
            count_query = count_query.eq('category', category)
        if min_price is not None:
            count_query = count_query.gte('price', min_price)
        if max_price is not None:
            # If max_price is 99999, don't apply upper limit
            if max_price != 99999:
                count_query = count_query.lte('price', max_price)
        
        sort_param = request.args.get('sort', 'newest')
        
        # For best_selling, we need to fetch all products first, then sort by sales
        if sort_param == 'best_selling':
            # Get sales data first
            items_response = supabase.table('order_items').select('product_id, quantity').execute()
            from collections import defaultdict
            sales_count = defaultdict(int)
            for item in (items_response.data or []):
                product_id = item.get('product_id')
                quantity = item.get('quantity', 1)
                if product_id:
                    sales_count[product_id] += quantity
            
            # Fetch all products matching filters (without ordering, we'll sort by sales later)
            # Use a large limit to get all products, then we'll paginate after sorting
            fetch_limit = 1000  # Fetch up to 1000 products for best_selling sort
            response = query.order('created_at', desc=True).range(0, fetch_limit - 1).execute()
        else:
            # For other sorts, use normal pagination
            if sort_param == 'price_high_low':
                query = query.order('price', desc=True)
            elif sort_param == 'price_low_high':
                query = query.order('price', desc=False)
            elif sort_param == 'newest':
                query = query.order('created_at', desc=True)
            elif sort_param == 'oldest':
                query = query.order('created_at', desc=False)
            else:
                query = query.order('created_at', desc=True)
            
            # Fetch more products to account for potential filtering
            fetch_limit = limit * 3 if tag_filter_applied else limit * 2
            response = query.range(offset, offset + fetch_limit - 1).execute()
        
        products_list = []
        for product in response.data:
            if tag_filter_applied:
                product_tags = product.get('tags', [])
                if isinstance(product_tags, list):
                    if tag.lower() not in [t.lower() if isinstance(t, str) else str(t).lower() for t in product_tags]:
                        continue
                elif isinstance(product_tags, str):
                    if product_tags.lower() != tag.lower():
                        continue
                else:
                    continue
            
            product_id = product['id']
            
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]
            else:
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
            
            product_data = {
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': images,
                'image_url': images[0] if images else None,
                'image': images,  # Keep for backward compatibility
                'price': float(product.get('price', 0))
            }
            
            if sort_param == 'best_selling':
                product_data['_sales_count'] = sales_count.get(product.get('id'), 0)
            
            products_list.append(product_data)
            
            # For non-best_selling sorts, break when we have enough products
            if sort_param != 'best_selling' and len(products_list) >= limit:
                break
        
        # Sort by sales count for best_selling, then apply pagination
        if sort_param == 'best_selling':
            products_list.sort(key=lambda x: x.get('_sales_count', 0), reverse=True)
            # Remove sales count from response
            for p in products_list:
                p.pop('_sales_count', None)
            # Apply pagination after sorting
            start_idx = offset
            end_idx = offset + limit
            products_list = products_list[start_idx:end_idx]
        
        if tag_filter_applied:
            all_products = supabase.table('products').select('id, tags, price, category').eq('status', 'active').execute()
            filtered_count = 0
            for p in all_products.data:
                if category and p.get('category') != category:
                    continue
                
                product_price = float(p.get('price', 0))
                if min_price is not None and product_price < min_price:
                    continue
                if max_price is not None and max_price != 99999 and product_price > max_price:
                    continue
                
                if tag_filter_applied:
                    p_tags = p.get('tags', [])
                    if isinstance(p_tags, list):
                        if tag.lower() not in [t.lower() if isinstance(t, str) else str(t).lower() for t in p_tags]:
                            continue
                    elif isinstance(p_tags, str):
                        if p_tags.lower() != tag.lower():
                            continue
                    else:
                        continue
                
                filtered_count += 1
            total_count = filtered_count
        else:
            count_result = count_query.execute()
            if hasattr(count_result, 'count') and count_result.count is not None:
                total_count = count_result.count
            else:
                total_count = len(count_result.data) if count_result.data else 0
        
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        
        return jsonify({
            "success": True,
            "data": products_list,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            },
            "count": len(products_list),
            "filters_applied": {
                "category": category,
                "min_price": min_price,
                "max_price": max_price,
                "tag": tag
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/search', methods=['GET'])
def search_products():
    """Search products by name with real-time suggestions"""
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not query:
            return jsonify({
                "success": True,
                "data": []
            }), 200
        
        response = supabase.table('products')\
            .select('id, name, price, image_urls, image_url, category')\
            .eq('status', 'active')\
            .ilike('name', f'%{query}%')\
            .limit(limit)\
            .execute()
        
        products = []
        for product in response.data or []:
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list) and len(image_urls) > 0:
                image = image_urls[0]
            else:
                image = product.get('image_url') or '/placeholder.svg'
            
            products.append({
                'id': product['id'],
                'name': product['name'],
                'price': float(product.get('price', 0)),
                'image': image,
                'category': product.get('category', '')
            })
        
        return jsonify({
            "success": True,
            "data": products
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('', methods=['POST'])
def create_product():
    """Add new product"""
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        category = data.get('category')
        brand = data.get('brand')
        price = data.get('price')
        original_price = data.get('original_price')
        stock = data.get('stock', 0)
        status = data.get('status', 'active')
        image_urls = data.get('image_urls', [])
        color = data.get('color', [])
        tags = data.get('tags', [])
        
        if not name or not price:
            return jsonify({
                "success": False,
                "message": "name and price are required"
            }), 400
        
        if isinstance(color, str):
            color_array = [color] if color else []
        elif isinstance(color, list):
            color_array = color
        else:
            color_array = []
        
        if isinstance(tags, str):
            tags_array = [tags] if tags else []
        elif isinstance(tags, list):
            tags_array = tags
        else:
            tags_array = []
        
        product_data = {
            'name': name,
            'description': description,
            'category': category,
            'brand': brand,
            'price': float(price),
            'original_price': float(original_price) if original_price else None,
            'stock': int(stock) if stock else 0,
            'status': status,
            'image_urls': image_urls if isinstance(image_urls, list) else [],
            'color': color_array,
            'tags': tags_array
        }
        
        if image_urls and len(image_urls) > 0:
            product_data['image_url'] = image_urls[0]
        
        response = supabase.table('products').insert(product_data).execute()
        
        if response.data:
            return jsonify({
                "success": True,
                "message": "Product created successfully",
                "data": response.data[0]
            }), 201
        else:
            return jsonify({
                "success": False,
                "message": "Failed to create product"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@bp.route('/<product_id>', methods=['PUT'])
def update_product(product_id):
    """Edit/Update product"""
    try:
        data = request.json
        
        existing = supabase.table('products').select('id').eq('id', product_id).execute()
        if not existing.data:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'description' in data:
            update_data['description'] = data['description']
        if 'category' in data:
            update_data['category'] = data['category']
        if 'brand' in data:
            update_data['brand'] = data['brand']
        if 'price' in data:
            update_data['price'] = float(data['price'])
        if 'original_price' in data:
            update_data['original_price'] = float(data['original_price']) if data['original_price'] else None
        if 'stock' in data:
            update_data['stock'] = int(data['stock'])
        if 'status' in data:
            update_data['status'] = data['status']
        if 'image_urls' in data:
            image_urls = data['image_urls']
            update_data['image_urls'] = image_urls if isinstance(image_urls, list) else []
            if image_urls and len(image_urls) > 0:
                update_data['image_url'] = image_urls[0]
        if 'color' in data:
            color = data['color']
            if isinstance(color, str):
                update_data['color'] = [color] if color else []
            elif isinstance(color, list):
                update_data['color'] = color
            else:
                update_data['color'] = []
        if 'tags' in data:
            tags = data['tags']
            if isinstance(tags, str):
                update_data['tags'] = [tags] if tags else []
            elif isinstance(tags, list):
                update_data['tags'] = tags
            else:
                update_data['tags'] = []
        
        update_data['updated_at'] = datetime.now().isoformat()
        
        response = supabase.table('products').update(update_data).eq('id', product_id).execute()
        
        if response.data:
            return jsonify({
                "success": True,
                "message": "Product updated successfully",
                "data": response.data[0]
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Failed to update product"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

