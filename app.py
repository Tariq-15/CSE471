from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
from google import genai
import json
from google import genai
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase Configuration using Anon Key
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://lcwwwlfzpiwovrhhmwib.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxjd3d3bGZ6cGl3b3ZyaGhtd2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTk5MTAsImV4cCI6MjA4MDU5NTkxMH0.ickBC8Rglp6fBM7OULayfywgTxa0e8pUHGwuy9fdfIU')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase():
    """Get Supabase client"""
    return supabase

# ============================================
# FEATURE 1: PRODUCT DETAILS PAGE APIs
# ============================================

@app.route('/api/products/filter', methods=['GET'])
def get_products_filtered():
    """
    Get products with filters and sorting (Category Page API)
    Returns: Name, Rating (average), Image[2] (first 2 images), Price, Color
    Query params:
    - category (optional) - Filter by category (e.g., "T-shirts", "Shorts", "Shirts", "Hoodie", "Jeans")
    - min_price (optional) - Minimum price
    - max_price (optional) - Maximum price
    - color (optional) - Filter by color
    - tag (optional) - Filter by tag (e.g., "Featured Product", "New Arrival")
    - page (optional, default: 1) - Page number
    - limit (optional, default: 9) - Items per page
    - sort (optional) - Sort order: "price_high_low", "price_low_high", "newest", "oldest", "rating_high_low"
    """
    try:
        # Get query parameters
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        color = request.args.get('color')
        tag = request.args.get('tag')  # Filter by tag
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 9, type=int)
        sort = request.args.get('sort', 'newest')  # Default to newest
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query
        query = supabase.table('products').select('id, name, price, image_urls, color, category, tags', count='exact')
        
        # Apply filters
        if category:
            query = query.eq('category', category)
        if min_price is not None:
            query = query.gte('price', min_price)
        if max_price is not None:
            query = query.lte('price', max_price)
        # Color filter: check if color array contains the specified color
        # For JSONB arrays, we'll filter in Python after fetching
        color_filter_applied = color is not None
        tag_filter_applied = tag is not None
        
        # Get total count (without color filter for now, will filter in Python)
        count_query = supabase.table('products').select('id', count='exact')
        if category:
            count_query = count_query.eq('category', category)
        if min_price is not None:
            count_query = count_query.gte('price', min_price)
        if max_price is not None:
            count_query = count_query.lte('price', max_price)
        total_count = count_query.execute().count
        
        # Apply sorting
        if sort == 'price_high_low':
            query = query.order('price', desc=True)
        elif sort == 'price_low_high':
            query = query.order('price', desc=False)
        elif sort == 'newest':
            query = query.order('created_at', desc=True)
        elif sort == 'oldest':
            query = query.order('created_at', desc=False)
        else:
            # Default to newest
            query = query.order('created_at', desc=True)
        
        # Get paginated products (fetch more if filters are applied to filter in Python)
        fetch_limit = limit * 3 if (color_filter_applied or tag_filter_applied) else limit
        response = query.range(offset, offset + fetch_limit).execute()
        
        # Process products to include rating and format images
        products_list = []
        for product in response.data:
            # Apply color filter if specified
            if color_filter_applied:
                product_colors = product.get('color', [])
                if isinstance(product_colors, list):
                    # Check if any color in the array matches
                    if color.lower() not in [c.lower() if isinstance(c, str) else str(c).lower() for c in product_colors]:
                        continue
                elif isinstance(product_colors, str):
                    if product_colors.lower() != color.lower():
                        continue
                else:
                    continue
            
            # Apply tag filter if specified
            if tag_filter_applied:
                product_tags = product.get('tags', [])
                if isinstance(product_tags, list):
                    # Check if any tag in the array matches
                    if tag.lower() not in [t.lower() if isinstance(t, str) else str(t).lower() for t in product_tags]:
                        continue
                elif isinstance(product_tags, str):
                    if product_tags.lower() != tag.lower():
                        continue
                else:
                    continue
            product_id = product['id']
            
            # Get average rating from reviews
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0
            
            # Get first 2 images
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]  # First 2 images
            else:
                # Fallback to single image_url if image_urls is not available
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            # Get color array (handle both JSONB array and string)
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
                'image': images,  # Array of max 2 images
                'price': float(product['price']),
                'color': color_list  # Array of colors
            })
            
            # Stop if we have enough items
            if len(products_list) >= limit:
                break
        
        # Apply sorting after filtering (for rating-based sorting)
        if sort == 'rating_high_low':
            # Need to sort by rating after fetching
            products_with_ratings = []
            for p in products_list:
                products_with_ratings.append((p['rating'], p))
            products_with_ratings.sort(key=lambda x: x[0], reverse=True)
            products_list = [p[1] for p in products_with_ratings]
        
        # For color/tag filters, we need to recalculate total count
        if color_filter_applied or tag_filter_applied:
            all_products = supabase.table('products').select('id, color, tags').execute()
            filtered_count = 0
            for p in all_products.data:
                # Check color filter
                if color_filter_applied:
                    p_colors = p.get('color', [])
                    color_match = False
                    if isinstance(p_colors, list):
                        if color.lower() in [c.lower() if isinstance(c, str) else str(c).lower() for c in p_colors]:
                            color_match = True
                    elif isinstance(p_colors, str) and p_colors.lower() == color.lower():
                        color_match = True
                    if not color_match:
                        continue
                
                # Check tag filter
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
        
        # Calculate total pages
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

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """
    Get product details by ID
    Returns: Product information including name, description, price, images
    """
    try:
        response = supabase.table('products').select('*').eq('id', product_id).execute()
        
        if response.data and len(response.data) > 0:
            return jsonify({
                "success": True,
                "data": response.data[0]
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

@app.route('/api/products/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    """
    Get all reviews for a product
    Returns: List of reviews with user names, ratings, comments, and dates
    """
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

@app.route('/api/products/<product_id>/reviews', methods=['POST'])
def add_product_review(product_id):
    """
    Add a new review for a product
    Body: { "user_name": "John Doe", "rating": 5, "comment": "Great product!" }
    """
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

@app.route('/api/products/<product_id>/related', methods=['GET'])
def get_related_products(product_id):
    """
    Get related products (same category, excluding current product)
    Query params: limit (default: 4)
    """
    try:
        limit = request.args.get('limit', 4, type=int)
        
        # First get the current product's category
        product_response = supabase.table('products').select('category').eq('id', product_id).execute()
        
        if product_response.data and product_response.data[0].get('category'):
            category = product_response.data[0]['category']
            response = supabase.table('products')\
                .select('id, name, description, price, original_price, image_url, image_urls, category')\
                .eq('category', category)\
                .neq('id', product_id)\
                .limit(limit)\
                .execute()
        else:
            # If no category, return random products
            response = supabase.table('products')\
                .select('id, name, description, price, original_price, image_url, image_urls, category')\
                .neq('id', product_id)\
                .limit(limit)\
                .execute()
        
        # Format products for frontend
        formatted_products = []
        for product in response.data:
            # Get average rating
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product['id'])\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            # Format images
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

# ============================================
# FEATURE 2: CHECKOUT PAGE APIs
# ============================================

@app.route('/api/cart', methods=['GET'])
def get_cart():
    """
    Get cart items by session_id
    Query params: session_id (required)
    Returns: List of cart items with product details
    """
    try:
        session_id = request.args.get('session_id')
        if not session_id:
            return jsonify({
                "success": False,
                "message": "session_id is required"
            }), 400
        
        # Get cart items with product details
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
        
        # Calculate subtotal
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

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    """
    Add item to cart
    Body: { "session_id": "xxx", "product_id": "xxx", "size": "L", "color": "Red", "quantity": 1 }
    """
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
        
        # Get product price
        product_response = supabase.table('products').select('price').eq('id', product_id).execute()
        
        if not product_response.data:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        price = product_response.data[0]['price']
        
        # Check if item already exists in cart
        existing_response = supabase.table('cart_items')\
            .select('id, quantity')\
            .eq('session_id', session_id)\
            .eq('product_id', product_id)\
            .eq('size', size)\
            .eq('color', color)\
            .execute()
        
        if existing_response.data:
            # Update quantity
            existing_item = existing_response.data[0]
            new_quantity = existing_item['quantity'] + quantity
            supabase.table('cart_items')\
                .update({'quantity': new_quantity})\
                .eq('id', existing_item['id'])\
                .execute()
            cart_item_id = existing_item['id']
        else:
            # Insert new item
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

@app.route('/api/cart/<cart_item_id>', methods=['PUT'])
def update_cart_item(cart_item_id):
    """
    Update cart item quantity
    Body: { "quantity": 2 }
    """
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

@app.route('/api/cart/<cart_item_id>', methods=['DELETE'])
def remove_from_cart(cart_item_id):
    """
    Remove item from cart
    """
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

@app.route('/api/orders', methods=['POST'])
def create_order():
    """
    Create order from cart
    Body: {
        "session_id": "xxx",
        "customer": {
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone_number": "+1234567890",
            "district": "Dhaka",
            "thana": "Gulshan",
            "full_address": "123 Main St"
        },
        "discount_percentage": 20,
        "delivery_fee": 15
    }
    """
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
        
        # Get cart items with product names and images
        cart_response = supabase.table('cart_items')\
            .select('*, products(name, image_url, image_urls)')\
            .eq('session_id', session_id)\
            .execute()
        
        if not cart_response.data:
            return jsonify({
                "success": False,
                "message": "Cart is empty"
            }), 400
        
        # Calculate subtotal
        subtotal = sum(float(item['price']) * item['quantity'] for item in cart_response.data)
        discount = subtotal * (discount_percentage / 100)
        total = subtotal - discount + delivery_fee
        
        # Create customer
        customer_response = supabase.table('customers').insert({
            'full_name': customer_data.get('full_name'),
            'email': customer_data.get('email'),
            'phone_number': customer_data.get('phone_number'),
            'district': customer_data.get('district'),
            'thana': customer_data.get('thana'),
            'full_address': customer_data.get('full_address')
        }).execute()
        
        customer_id = customer_response.data[0]['id']
        
        # Get user_id from request if available (for authenticated users)
        user_id = data.get('user_id')
        
        # Create order
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
        
        # Create order items with product images
        order_items = []
        for item in cart_response.data:
            product_info = item.get('products', {})
            product_name = product_info.get('name') if product_info else None
            
            # Get product image (prefer first from image_urls, fallback to image_url)
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
        
        # Clear cart
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

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    """
    Get order details by ID with complete information
    Returns: Name, Order Date, Phone, Status, District, Thana, Address, 
             Order items with product images, Subtotal, Shipping, Total
    """
    try:
        # Get order with customer info
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
        
        # Get order items with product details
        items_response = supabase.table('order_items')\
            .select('*')\
            .eq('order_id', order_id)\
            .execute()
        
        # Format order items
        order_items = []
        for item in items_response.data:
            order_items.append({
                'product_image': item.get('product_image'),
                'product_name': item.get('product_name'),
                'price': float(item.get('price', 0)),
                'quantity': item.get('quantity', 0)
            })
        
        # Build response
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

# ============================================
# PRODUCT MANAGEMENT APIs
# ============================================

@app.route('/api/products', methods=['POST'])
def create_product():
    """
    Add new product
    Body: {
        "name": "Product Title",
        "description": "Product description",
        "category": "Category name",
        "brand": "Brand name",
        "price": 100.00,
        "original_price": 120.00,
        "stock": 50,
        "status": "active",
        "image_urls": ["url1", "url2", "url3"],
        "tags": ["Featured Product", "New Arrival"]
    }
    """
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
        color = data.get('color', [])  # Color as array
        tags = data.get('tags', [])  # Tags as array
        
        # Validation
        if not name or not price:
            return jsonify({
                "success": False,
                "message": "name and price are required"
            }), 400
        
        # Prepare color as array
        if isinstance(color, str):
            color_array = [color] if color else []
        elif isinstance(color, list):
            color_array = color
        else:
            color_array = []
        
        # Prepare tags as array
        if isinstance(tags, str):
            tags_array = [tags] if tags else []
        elif isinstance(tags, list):
            tags_array = tags
        else:
            tags_array = []
        
        # Prepare product data
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
            'color': color_array,  # Array of colors
            'tags': tags_array  # Array of tags (e.g., ["Featured Product", "New Arrival"])
        }
        
        # Set first image_url for backward compatibility
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

@app.route('/api/products/<product_id>', methods=['PUT'])
def update_product(product_id):
    """
    Edit/Update product
    Body: {
        "name": "Updated Title",
        "description": "Updated description",
        "category": "Category",
        "brand": "Brand",
        "price": 100.00,
        "original_price": 120.00,
        "stock": 50,
        "status": "active",
        "image_urls": ["url1", "url2", "url3"],
        "tags": ["Featured Product", "New Arrival"]
    }
    """
    try:
        data = request.json
        
        # Check if product exists
        existing = supabase.table('products').select('id').eq('id', product_id).execute()
        if not existing.data:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        # Prepare update data (only include provided fields)
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
            # Update first image_url for backward compatibility
            if image_urls and len(image_urls) > 0:
                update_data['image_url'] = image_urls[0]
        if 'color' in data:
            color = data['color']
            # Handle color as array
            if isinstance(color, str):
                update_data['color'] = [color] if color else []
            elif isinstance(color, list):
                update_data['color'] = color
            else:
                update_data['color'] = []
        if 'tags' in data:
            tags = data['tags']
            # Handle tags as array
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

# ============================================
# ORDER MANAGEMENT APIs
# ============================================

@app.route('/api/orders', methods=['GET'])
def get_all_orders():
    """
    Get all orders with customer info, status, and product images
    Query params: 
    - page (optional, default: 1)
    - limit (optional, default: 10)
    - status (optional) - Filter by order status
    Returns: List of orders with customer name, address, order status, order date, and product images (max 4)
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        status_filter = request.args.get('status')
        
        offset = (page - 1) * limit
        
        # Build query
        query = supabase.table('orders').select('*, customers(full_name, full_address, district, thana, phone_number)', count='exact')
        
        if status_filter:
            query = query.eq('status', status_filter)
        
        # Get total count
        count_query = supabase.table('orders').select('id', count='exact')
        if status_filter:
            count_query = count_query.eq('status', status_filter)
        total_count = count_query.execute().count
        
        # Get paginated orders
        response = query.range(offset, offset + limit).order('created_at', desc=True).execute()
        
        # Process orders to include product images
        orders_list = []
        for order in response.data:
            customer = order.get('customers', {})
            
            # Get order items with product images (max 4)
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
                'product_images': product_images[:4]  # Max 4 images
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

# ============================================
# UTILITY APIs
# ============================================

@app.route('/api/products/new-arrivals', methods=['GET'])
def get_new_arrivals():
    """
    Get 4 random New Arrival products
    Returns: Name, Rating (average), Image[2] (first 2 images), Price
    Note: Color field is NOT included in the response
    """
    try:
        import random
        
        # Get all products with "New Arrival" tag
        response = supabase.table('products').select('id, name, price, image_urls, color, tags').execute()
        
        # Filter products with "New Arrival" tag
        new_arrival_products = []
        for product in response.data:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, list):
                # Check if "New Arrival" tag exists (case-insensitive)
                if any('new arrival' in str(t).lower() for t in product_tags):
                    new_arrival_products.append(product)
            elif isinstance(product_tags, str) and 'new arrival' in product_tags.lower():
                new_arrival_products.append(product)
        
        # Randomly select 4 products (or all if less than 4)
        if len(new_arrival_products) > 4:
            selected_products = random.sample(new_arrival_products, 4)
        else:
            selected_products = new_arrival_products
        
        # Process products to include ratings and format images
        products_list = []
        for product in selected_products:
            product_id = product['id']
            
            # Get average rating from reviews
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            # Get first 2 images
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]  # First 2 images
            else:
                # Fallback to single image_url if image_urls is not available
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': images,  # Array of max 2 images
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

@app.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    """
    Get 4 random Featured Product products
    Returns: Name, Rating (average), Image[2] (first 2 images), Price
    Note: Color field is NOT included in the response
    """
    try:
        import random
        
        # Get all products with "Featured Product" tag
        response = supabase.table('products').select('id, name, price, image_urls, color, tags').execute()
        
        # Filter products with "Featured Product" tag
        featured_products = []
        for product in response.data:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, list):
                # Check if "Featured Product" tag exists (case-insensitive)
                if any('featured product' in str(t).lower() for t in product_tags):
                    featured_products.append(product)
            elif isinstance(product_tags, str) and 'featured product' in product_tags.lower():
                featured_products.append(product)
        
        # Randomly select 4 products (or all if less than 4)
        if len(featured_products) > 4:
            selected_products = random.sample(featured_products, 4)
        else:
            selected_products = featured_products
        
        # Process products to include ratings and format images
        products_list = []
        for product in selected_products:
            product_id = product['id']
            
            # Get average rating from reviews
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            # Get first 2 images
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]  # First 2 images
            else:
                # Fallback to single image_url if image_urls is not available
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
                images = images[:2]
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image': images,  # Array of max 2 images
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

@app.route('/api/products/top-selling', methods=['GET'])
def get_top_selling():
    """
    Get top selling products (based on orders or Best Seller tag)
    Returns: Name, Rating (average), Image, Price
    """
    try:
        import random
        limit = request.args.get('limit', 4, type=int)
        
        # Get products with "Best Seller" tag
        response = supabase.table('products').select('id, name, price, image_urls, image_url, tags').execute()
        
        # Filter products with "Best Seller" tag
        best_seller_products = []
        for product in response.data or []:
            product_tags = product.get('tags', [])
            if isinstance(product_tags, list):
                if any('best seller' in str(t).lower() for t in product_tags):
                    best_seller_products.append(product)
            elif isinstance(product_tags, str) and 'best seller' in product_tags.lower():
                best_seller_products.append(product)
        
        # If not enough best sellers, add random products
        if len(best_seller_products) < limit:
            remaining = limit - len(best_seller_products)
            other_products = [p for p in (response.data or []) if p not in best_seller_products]
            if other_products:
                additional = random.sample(other_products, min(remaining, len(other_products)))
                best_seller_products.extend(additional)
        
        # Randomly select products if more than limit
        if len(best_seller_products) > limit:
            selected_products = random.sample(best_seller_products, limit)
        else:
            selected_products = best_seller_products
        
        # Format products
        products_list = []
        for product in selected_products:
            product_id = product['id']
            
            # Get average rating
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in (reviews_response.data or []) if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 4.5
            
            # Get image
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list) and image_urls:
                image = image_urls[0]
            else:
                image = product.get('image_url', '/placeholder.svg')
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': [image] if image else [],
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

@app.route('/api/products', methods=['GET'])
def get_all_products():
    """
    Get products with filters and pagination
    Returns: Name, Rating (average), Image[2], Price
    
    Query params: 
    - page (optional, default: 1) - Page number
    - limit (optional, default: 9) - Items per page
    - category (optional) - Filter by category
    - min_price (optional) - Minimum price filter
    - max_price (optional) - Maximum price filter
    - color (optional) - Filter by color
    - tag (optional) - Filter by tag (e.g., "Featured Product", "New Arrival")
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 9, type=int)  # Default 9 per page
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        color = request.args.get('color')
        tag = request.args.get('tag')  # Filter by tag
        sort = request.args.get('sort', 'newest')  # Sort parameter
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query
        query = supabase.table('products').select('id, name, price, original_price, image_urls, category, color, tags', count='exact')
        
        # Apply filters (tag filter will be applied in Python)
        if category:
            query = query.eq('category', category)
        if min_price is not None:
            query = query.gte('price', min_price)
        if max_price is not None:
            query = query.lte('price', max_price)
        if color:
            query = query.eq('color', color)
        
        tag_filter_applied = tag is not None
        
        # Get total count with filters (tag filter will be recalculated)
        count_query = supabase.table('products').select('id', count='exact')
        if category:
            count_query = count_query.eq('category', category)
        if min_price is not None:
            count_query = count_query.gte('price', min_price)
        if max_price is not None:
            count_query = count_query.lte('price', max_price)
        if color:
            count_query = count_query.eq('color', color)
        
        # Determine sort order
        if sort == 'price-high':
            order_column = 'price'
            order_desc = True
        elif sort == 'price-low':
            order_column = 'price'
            order_desc = False
        else:  # 'newest' or 'popular'
            order_column = 'created_at'
            order_desc = True
        
        # Get paginated data (fetch more if tag filter is applied)
        fetch_limit = limit * 3 if tag_filter_applied else limit
        response = query.range(offset, offset + fetch_limit).order(order_column, desc=order_desc).execute()
        
        # Process products to include ratings and format images
        products_list = []
        for product in response.data:
            # Apply tag filter if specified
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
            
            # Get average rating from reviews
            reviews_response = supabase.table('reviews')\
                .select('rating')\
                .eq('product_id', product_id)\
                .execute()
            
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            average_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0.0
            
            # Get images (max 2)
            image_urls = product.get('image_urls', [])
            if isinstance(image_urls, list):
                images = image_urls[:2]  # Take first 2 images
            else:
                # Fallback to single image_url if image_urls is not available
                single_image = product.get('image_url')
                images = [single_image] if single_image else []
            
            products_list.append({
                'id': product.get('id'),
                'name': product.get('name', ''),
                'rating': average_rating,
                'image_urls': images,  # Array of max 2 images
                'price': float(product.get('price', 0)),
                'original_price': float(product.get('original_price', 0)) if product.get('original_price') else None,
                'category': product.get('category', ''),
                'tags': product.get('tags', [])
            })
            
            # Stop if we have enough items
            if len(products_list) >= limit:
                break
        
        # Recalculate total count if tag filter is applied
        if tag_filter_applied:
            all_products = supabase.table('products').select('id, tags').execute()
            filtered_count = 0
            for p in all_products.data:
                # Apply all filters except tag
                if category and p.get('category') != category:
                    continue
                # Note: We need to fetch full product data to check price and color filters
                # For now, let's use a simpler approach - get all matching products and filter by tag
                p_tags = p.get('tags', [])
                if isinstance(p_tags, list):
                    if tag.lower() in [t.lower() if isinstance(t, str) else str(t).lower() for t in p_tags]:
                        filtered_count += 1
                elif isinstance(p_tags, str) and p_tags.lower() == tag.lower():
                    filtered_count += 1
            total_count = filtered_count
        else:
            # Get count from the query response
            count_result = count_query.execute()
            # Supabase returns count in the response
            if hasattr(count_result, 'count') and count_result.count is not None:
                total_count = count_result.count
            else:
                # Fallback: count the actual data returned
                total_count = len(count_result.data) if count_result.data else 0
        
        # Calculate total pages
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
                "color": color,
                "tag": tag
            }
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ============================================
# USER PROFILE APIs
# ============================================

@app.route('/api/user/profile', methods=['GET', 'PUT'])
def user_profile():
    """
    Get or update user profile
    GET: Returns user profile data
    PUT: Updates user profile
    Headers: Authorization: Bearer <token> or user_id in query/body
    Body (PUT): {
        "user_id": "xxx",
        "first_name": "John",
        "last_name": "Doe",
        "phone_number": "+1234567890",
        "email_notifications": true,
        "order_updates": true,
        "promotional_emails": false,
        "sms_notifications": false
    }
    """
    try:
        if request.method == 'GET':
            user_id = request.args.get('user_id')
            if not user_id:
                return jsonify({
                    "success": False,
                    "message": "user_id is required"
                }), 400
            
            # Get or create profile
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
                # Return empty profile
                return jsonify({
                    "success": True,
                    "data": {
                        "user_id": user_id,
                        "first_name": None,
                        "last_name": None,
                        "phone_number": None,
                        "email_notifications": True,
                        "order_updates": True,
                        "promotional_emails": False,
                        "sms_notifications": False
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
            
            # Check if profile exists
            existing = supabase.table('user_profiles')\
                .select('id')\
                .eq('user_id', user_id)\
                .execute()
            
            update_data = {
                "first_name": data.get('first_name'),
                "last_name": data.get('last_name'),
                "phone_number": data.get('phone_number'),
                "email_notifications": data.get('email_notifications', True),
                "order_updates": data.get('order_updates', True),
                "promotional_emails": data.get('promotional_emails', False),
                "sms_notifications": data.get('sms_notifications', False)
            }
            
            if existing.data:
                # Update existing
                response = supabase.table('user_profiles')\
                    .update(update_data)\
                    .eq('user_id', user_id)\
                    .execute()
            else:
                # Create new
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

@app.route('/api/user/addresses', methods=['GET', 'POST'])
def user_addresses():
    """
    Get all addresses or create new address for a user
    GET: Returns all addresses for user_id
    POST: Creates a new address
    Query params (GET): user_id
    Body (POST): {
        "user_id": "xxx",
        "label": "Home",
        "full_name": "John Doe",
        "phone_number": "+1234567890",
        "district": "Dhaka",
        "thana": "Gulshan",
        "full_address": "123 Main St",
        "is_default": false
    }
    """
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
            
            # If this is set as default, unset other defaults
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

@app.route('/api/user/addresses/<address_id>', methods=['PUT', 'DELETE'])
def user_address(address_id):
    """
    Update or delete a user address
    PUT: Updates address
    DELETE: Deletes address
    Body (PUT): {
        "label": "Home",
        "full_name": "John Doe",
        "phone_number": "+1234567890",
        "district": "Dhaka",
        "thana": "Gulshan",
        "full_address": "123 Main St",
        "is_default": false
    }
    """
    try:
        if request.method == 'PUT':
            data = request.json
            user_id = data.get('user_id')
            
            # If setting as default, unset other defaults
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

@app.route('/api/user/orders', methods=['GET'])
def user_orders():
    """
    Get order history for a user
    Query params: user_id, page (optional), limit (optional)
    Returns: List of orders with items
    """
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
        
        # Get orders for user
        orders_response = supabase.table('orders')\
            .select('*, customers(full_name, phone_number, district, thana, full_address)')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        # Get order items for each order
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

@app.route('/api/user/wishlist', methods=['GET', 'POST', 'DELETE'])
def user_wishlist():
    """
    Get, add, or remove items from wishlist
    GET: Returns wishlist items with product details
    POST: Adds product to wishlist
    DELETE: Removes product from wishlist
    Query params (GET, DELETE): user_id, product_id (for DELETE)
    Body (POST): {
        "user_id": "xxx",
        "product_id": "xxx"
    }
    """
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
            
            # Format products
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
                        "rating": 4.0,  # Default rating, can be calculated from reviews
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
            
            # Check if already in wishlist
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

# ============================================
# SEARCH APIs
# ============================================

@app.route('/api/products/search', methods=['GET'])
def search_products():
    """
    Search products by name with real-time suggestions
    Query params: q (search query), limit (optional, default: 10)
    Returns: List of matching products with id, name, price, image_urls
    """
    try:
        query = request.args.get('q', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        if not query:
            return jsonify({
                "success": True,
                "data": []
            }), 200
        
        # Search products by name (case-insensitive)
        response = supabase.table('products')\
            .select('id, name, price, image_urls, image_url, category')\
            .ilike('name', f'%{query}%')\
            .limit(limit)\
            .execute()
        
        # Format products
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

# ============================================
# RECOMMENDATION ENGINE APIs
# ============================================

@app.route('/api/recommendations', methods=['POST'])
def get_recommendations():
    """
    Get product recommendations using AI
    Body: {
        "query": "I want comfortable casual wear for summer",
        "limit": 10 (optional)
    }
    Returns: JSON array of recommended products
    """
    try:
        data = request.json
        query = data.get('query', '').strip()
        limit = data.get('limit', 10)
        
        if not query:
            return jsonify({
                "success": False,
                "message": "query is required"
            }), 400
        
        # Initialize Gemini client
        gem = genai.Client(api_key=os.getenv('GOOGLE_AI_API_KEY', 'AIzaSyBtNdhLPPzFJL2_WM3ix7bHCyVvfMmSvaE'))
        
        # Get all products from database
        products_response = supabase.table('products')\
            .select('id, name, price, image_urls, image_url, category, description, color, tags')\
            .limit(100)\
            .execute()
        
        if not products_response.data:
            return jsonify({
                "success": False,
                "message": "No products available"
            }), 404
        
        # Format products for AI
        products_data = []
        for product in products_response.data:
            image_urls = product.get('image_urls', [])
            image = image_urls[0] if isinstance(image_urls, list) and len(image_urls) > 0 else product.get('image_url', '')
            
            products_data.append({
                'id': str(product['id']),
                'name': product.get('name', ''),
                'price': float(product.get('price', 0)),
                'image': image,
                'category': product.get('category', ''),
                'description': product.get('description', ''),
                'color': product.get('color', []),
                'tags': product.get('tags', [])
            })
        
        # Create prompt for Gemini
        prompt = f"""You are a fashion recommendation assistant. Based on the user's request: "{query}"

Here are the available products:
{json.dumps(products_data, indent=2)}

Analyze the user's request and recommend the most relevant products. Consider:
- Product category and type
- Description and features
- Price range
- Tags and colors
- User's intent and preferences

Return ONLY a JSON array of product IDs that best match the user's request. Return maximum {limit} products.
Format: ["product_id_1", "product_id_2", ...]

Do not include any explanation, only the JSON array."""
        
        # Get recommendations from Gemini
        try:
            # Try different model names in order of preference
            model_names = ['gemini-2.0-flash-exp', 'gemini-2.5-flash', 'gemini-1.5-flash']
            model = None
            response = None
            ai_error = None
            
            for model_name in model_names:
                try:
                    model = gem.models.get(model_name)
                    response = model.generate_content(prompt)
                    break
                except Exception as e:
                    ai_error = str(e)
                    print(f"Failed to use model {model_name}: {ai_error}")
                    continue
            
            if not response:
                # If all models fail, use fallback immediately
                raise Exception(f"All Gemini models failed. Last error: {ai_error}")
            
            # Parse AI response
            # Extract JSON from response
            response_text = response.text.strip() if hasattr(response, 'text') else str(response).strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```'):
                parts = response_text.split('```')
                if len(parts) > 1:
                    response_text = parts[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                response_text = response_text.strip()
            
            # Try to extract JSON array from response
            # Look for array pattern
            import re
            array_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if array_match:
                response_text = array_match.group(0)
            
            recommended_ids = json.loads(response_text)
            
            # Get full product details for recommended IDs
            recommended_products = []
            for product_id in recommended_ids[:limit]:
                product = next((p for p in products_data if p['id'] == str(product_id)), None)
                if product:
                    recommended_products.append({
                        'id': product['id'],
                        'name': product['name'],
                        'price': product['price'],
                        'image': product['image'],
                        'category': product['category']
                    })
            
            return jsonify({
                "success": True,
                "data": recommended_products,
                "query": query
            }), 200
            
        except (json.JSONDecodeError, AttributeError, KeyError) as e:
            # Fallback: return products based on keyword matching
            print(f"AI parsing error, using fallback: {str(e)}")
            query_lower = query.lower()
            recommended_products = []
            
            # Split query into keywords
            keywords = query_lower.split()
            
            for product in products_data:
                if len(recommended_products) >= limit:
                    break
                
                # Simple keyword matching with scoring
                name_match = any(kw in product['name'].lower() for kw in keywords)
                category_match = any(kw in product['category'].lower() for kw in keywords)
                desc_match = any(kw in product.get('description', '').lower() for kw in keywords)
                tags_match = any(any(kw in str(tag).lower() for kw in keywords) for tag in product.get('tags', []))
                
                if name_match or category_match or desc_match or tags_match:
                    recommended_products.append({
                        'id': product['id'],
                        'name': product['name'],
                        'price': product['price'],
                        'image': product['image'],
                        'category': product['category']
                    })
            
            return jsonify({
                "success": True,
                "data": recommended_products[:limit],
                "query": query,
                "fallback": True
            }), 200
            
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Recommendation API error: {error_details}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to get recommendations. Please try again."
        }), 500

@app.route('/api/test', methods=['GET', 'POST'])
def test():
    """Test endpoint"""
    if request.method == 'GET':
        return jsonify({"response": "Get Request Called"})
    elif request.method == "POST":
        req_json = request.json
        name = req_json.get('name', 'Guest')
        return jsonify({"response": f"Hi {name}"})

# ============================================
# ADMIN PANEL APIs
# ============================================

# Dashboard APIs
@app.route('/api/admin/dashboard/stats', methods=['GET'])
def admin_dashboard_stats():
    """
    Get dashboard statistics for admin panel
    Returns: Total revenue, orders, customers, products, etc.
    """
    try:
        # Get total orders and revenue
        orders_response = supabase.table('orders').select('id, total, status, created_at').execute()
        orders = orders_response.data or []
        
        total_revenue = sum(float(o.get('total', 0)) for o in orders)
        total_orders = len(orders)
        pending_orders = len([o for o in orders if o.get('status') == 'pending'])
        completed_orders = len([o for o in orders if o.get('status') in ['completed', 'delivered']])
        failed_orders = len([o for o in orders if o.get('status') == 'failed'])
        returned_orders = len([o for o in orders if o.get('status') == 'returned'])
        
        # Get customers count
        customers_response = supabase.table('customers').select('id, created_at').execute()
        customers = customers_response.data or []
        total_customers = len(customers)
        
        # New customers this month
        current_month = datetime.now().strftime('%Y-%m')
        new_customers = len([c for c in customers if c.get('created_at', '').startswith(current_month)])
        
        # Get products count
        products_response = supabase.table('products').select('id, stock').execute()
        products = products_response.data or []
        total_products = len(products)
        low_stock_count = len([p for p in products if (p.get('stock') or 0) < 10 and (p.get('stock') or 0) > 0])
        
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
                "returned_orders": returned_orders,
                "total_customers": total_customers
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/dashboard/sales', methods=['GET'])
def admin_dashboard_sales():
    """
    Get sales data for charts
    Query params: period (week, month, year)
    """
    try:
        period = request.args.get('period', 'month')
        
        # Get orders with dates
        orders_response = supabase.table('orders').select('total, created_at, status').execute()
        orders = orders_response.data or []
        
        # Group by month for simplicity
        from collections import defaultdict
        monthly_revenue = defaultdict(float)
        
        for order in orders:
            if order.get('status') not in ['failed', 'cancelled']:
                created_at = order.get('created_at', '')
                if created_at:
                    month = created_at[:7]  # YYYY-MM
                    monthly_revenue[month] += float(order.get('total', 0))
        
        # Sort and format
        sorted_months = sorted(monthly_revenue.keys())[-7:]  # Last 7 months
        sales_data = []
        
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for month in sorted_months:
            month_num = int(month.split('-')[1])
            sales_data.append({
                'name': month_names[month_num - 1],
                'revenue': round(monthly_revenue[month], 2)
            })
        
        return jsonify({
            "success": True,
            "data": sales_data
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/dashboard/best-selling', methods=['GET'])
def admin_dashboard_best_selling():
    """
    Get best selling products
    Query params: limit (default 5)
    """
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Get order items to count sales
        order_items_response = supabase.table('order_items').select('product_id, quantity').execute()
        order_items = order_items_response.data or []
        
        # Count sales by product
        from collections import defaultdict
        product_sales = defaultdict(int)
        
        for item in order_items:
            product_id = item.get('product_id')
            if product_id:
                product_sales[product_id] += item.get('quantity', 1)
        
        # Get top products
        top_product_ids = sorted(product_sales.keys(), key=lambda x: product_sales[x], reverse=True)[:limit]
        
        # Get product details
        best_selling = []
        for product_id in top_product_ids:
            product_response = supabase.table('products').select('id, name, stock').eq('id', product_id).execute()
            if product_response.data:
                product = product_response.data[0]
                best_selling.append({
                    'id': product['id'],
                    'name': product['name'],
                    'sales': product_sales[product_id],
                    'stock': product.get('stock', 0)
                })
        
        return jsonify({
            "success": True,
            "data": best_selling
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/dashboard/low-stock', methods=['GET'])
def admin_dashboard_low_stock():
    """
    Get low stock items
    Query params: limit (default 10)
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        
        # Get products with low stock
        products_response = supabase.table('products')\
            .select('id, name, stock, category')\
            .lt('stock', 10)\
            .order('stock', desc=False)\
            .limit(limit)\
            .execute()
        
        low_stock_items = []
        for product in products_response.data or []:
            low_stock_items.append({
                'id': product['id'],
                'name': product['name'],
                'stock': product.get('stock', 0),
                'category': product.get('category', 'Uncategorized')
            })
        
        return jsonify({
            "success": True,
            "data": low_stock_items
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Products Admin APIs
@app.route('/api/admin/products', methods=['GET', 'POST'])
def admin_products():
    """
    GET: List all products with pagination and filters
    POST: Create a new product
    """
    try:
        if request.method == 'GET':
            page = request.args.get('page', 1, type=int)
            limit = request.args.get('limit', 10, type=int)
            search = request.args.get('search', '')
            category = request.args.get('category')
            status = request.args.get('status')
            
            offset = (page - 1) * limit
            
            # Build query
            query = supabase.table('products').select('*', count='exact')
            
            if search:
                query = query.ilike('name', f'%{search}%')
            if category:
                query = query.eq('category', category)
            
            # Get total count
            count_response = query.execute()
            total = count_response.count or len(count_response.data or [])
            
            # Get paginated results
            query = supabase.table('products').select('*')
            if search:
                query = query.ilike('name', f'%{search}%')
            if category:
                query = query.eq('category', category)
            
            response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            
            # Format products with stock status
            products = []
            for product in response.data or []:
                stock = product.get('stock', 0)
                if stock == 0:
                    product_status = 'out_of_stock'
                elif stock < 10:
                    product_status = 'low_stock'
                else:
                    product_status = 'active'
                
                # Get average rating
                reviews_response = supabase.table('reviews').select('rating').eq('product_id', product['id']).execute()
                ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
                avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
                
                products.append({
                    'id': product['id'],
                    'name': product.get('name', ''),
                    'description': product.get('description', ''),
                    'category': product.get('category', ''),
                    'price': float(product.get('price', 0)),
                    'original_price': float(product.get('original_price', 0)) if product.get('original_price') else None,
                    'image_url': product.get('image_url'),
                    'image_urls': product.get('image_urls', []),
                    'color': product.get('color', []),
                    'size': product.get('size', []),
                    'tags': product.get('tags', []),
                    'stock': stock,
                    'status': product_status,
                    'rating': avg_rating,
                    'created_at': product.get('created_at'),
                    'updated_at': product.get('updated_at')
                })
            
            return jsonify({
                "success": True,
                "data": products,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": (total + limit - 1) // limit if total > 0 else 0
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
                'stock': data.get('stock', 0)
            }
            
            response = supabase.table('products').insert(product_data).execute()
            
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Product created successfully"
            }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_product_detail(product_id):
    """
    GET: Get product details
    PUT: Update product
    DELETE: Delete product
    """
    try:
        if request.method == 'GET':
            response = supabase.table('products').select('*').eq('id', product_id).execute()
            
            if not response.data:
                return jsonify({
                    "success": False,
                    "message": "Product not found"
                }), 404
            
            product = response.data[0]
            
            # Get reviews
            reviews_response = supabase.table('reviews').select('rating').eq('product_id', product_id).execute()
            ratings = [r['rating'] for r in reviews_response.data if r.get('rating')]
            avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
            
            # Get order items for sales count
            order_items_response = supabase.table('order_items').select('quantity').eq('product_id', product_id).execute()
            total_sold = sum(item.get('quantity', 0) for item in order_items_response.data or [])
            
            product['rating'] = avg_rating
            product['total_sold'] = total_sold
            
            return jsonify({
                "success": True,
                "data": product
            }), 200
            
        elif request.method == 'PUT':
            data = request.json
            
            update_data = {}
            allowed_fields = ['name', 'description', 'category', 'price', 'original_price', 
                            'image_url', 'image_urls', 'color', 'size', 'tags', 'stock']
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if update_data:
                update_data['updated_at'] = datetime.now().isoformat()
                response = supabase.table('products').update(update_data).eq('id', product_id).execute()
                
                return jsonify({
                    "success": True,
                    "data": response.data[0] if response.data else None,
                    "message": "Product updated successfully"
                }), 200
            
            return jsonify({
                "success": False,
                "message": "No fields to update"
            }), 400
            
        elif request.method == 'DELETE':
            response = supabase.table('products').delete().eq('id', product_id).execute()
            
            return jsonify({
                "success": True,
                "message": "Product deleted successfully"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Orders Admin APIs
@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    """
    Get all orders with pagination and filters
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        status = request.args.get('status')
        
        offset = (page - 1) * limit
        
        # Build query
        query = supabase.table('orders').select('*, customers(full_name, email, phone_number)', count='exact')
        
        if status and status != 'all':
            query = query.eq('status', status)
        
        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        # Format orders
        orders = []
        for order in response.data or []:
            customer = order.get('customers', {})
            
            # Get order items
            items_response = supabase.table('order_items').select('*').eq('order_id', order['id']).execute()
            items_count = len(items_response.data or [])
            
            order_id = order['id']
            order_number = f"ORD-{order_id[:8].upper()}" if order_id else 'N/A'
            
            orders.append({
                'id': order['id'],
                'order_number': order_number,
                'customer': customer.get('full_name', 'Unknown'),
                'email': customer.get('email', ''),
                'phone': customer.get('phone_number', ''),
                'date': order.get('created_at', ''),
                'status': order.get('status', 'pending'),
                'total': float(order.get('total', 0)),
                'subtotal': float(order.get('subtotal', 0)),
                'discount': float(order.get('discount', 0)),
                'delivery_fee': float(order.get('delivery_fee', 0)),
                'items_count': items_count,
                'payment_method': order.get('payment_method', 'N/A')
            })
        
        # Apply search filter (on customer name/email)
        if search:
            search_lower = search.lower()
            orders = [o for o in orders if search_lower in o['customer'].lower() or 
                     search_lower in o['email'].lower() or 
                     search_lower in o['order_number'].lower()]
        
        return jsonify({
            "success": True,
            "data": orders,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": response.count or len(orders),
                "total_pages": ((response.count or len(orders)) + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/orders/<order_id>', methods=['GET'])
def admin_order_detail(order_id):
    """
    Get order details with items
    """
    try:
        response = supabase.table('orders').select('*, customers(*)').eq('id', order_id).execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Order not found"
            }), 404
        
        order = response.data[0]
        
        # Get order items with product details
        items_response = supabase.table('order_items')\
            .select('*, products(name, image_url, image_urls)')\
            .eq('order_id', order_id)\
            .execute()
        
        items = []
        for item in items_response.data or []:
            product = item.get('products', {})
            image_urls = product.get('image_urls', [])
            image = image_urls[0] if image_urls else product.get('image_url', '')
            
            items.append({
                'id': item['id'],
                'product_id': item['product_id'],
                'product_name': product.get('name', 'Unknown Product'),
                'size': item.get('size'),
                'color': item.get('color'),
                'quantity': item.get('quantity', 1),
                'price': float(item.get('price', 0)),
                'image_url': image
            })
        
        order['items'] = items
        order['order_number'] = f"ORD-{order['id'][:8].upper()}"
        
        return jsonify({
            "success": True,
            "data": order
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
def admin_update_order_status(order_id):
    """
    Update order status
    """
    try:
        data = request.json
        new_status = data.get('status')
        
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'failed', 'returned']
        if new_status not in valid_statuses:
            return jsonify({
                "success": False,
                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400
        
        response = supabase.table('orders').update({
            'status': new_status,
            'updated_at': datetime.now().isoformat()
        }).eq('id', order_id).execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Order not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": response.data[0],
            "message": f"Order status updated to {new_status}"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/orders/stats', methods=['GET'])
def admin_orders_stats():
    """
    Get order statistics
    """
    try:
        orders_response = supabase.table('orders').select('status').execute()
        orders = orders_response.data or []
        
        stats = {
            'pending': 0,
            'processing': 0,
            'completed': 0,
            'failed': 0,
            'returned': 0
        }
        
        for order in orders:
            status = order.get('status', 'pending')
            if status in ['completed', 'delivered']:
                stats['completed'] += 1
            elif status in stats:
                stats[status] += 1
        
        return jsonify({
            "success": True,
            "data": stats
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Customers Admin APIs
@app.route('/api/admin/customers', methods=['GET'])
def admin_customers():
    """
    Get all customers with pagination
    """
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        
        offset = (page - 1) * limit
        
        # Get customers
        query = supabase.table('customers').select('*', count='exact')
        
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
        
        response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
        
        # Get order stats for each customer
        customers = []
        for customer in response.data or []:
            user_id = customer.get('user_id')
            
            # Get orders count and total spent
            if user_id:
                orders_response = supabase.table('orders').select('total, status').eq('user_id', user_id).execute()
                orders = orders_response.data or []
                orders_count = len(orders)
                total_spent = sum(float(o.get('total', 0)) for o in orders if o.get('status') not in ['cancelled', 'failed'])
            else:
                orders_count = 0
                total_spent = 0
            
            customers.append({
                'id': customer['id'],
                'user_id': customer.get('user_id'),
                'full_name': customer.get('full_name', 'Unknown'),
                'email': customer.get('email', ''),
                'phone_number': customer.get('phone_number', ''),
                'district': customer.get('district', ''),
                'thana': customer.get('thana', ''),
                'full_address': customer.get('full_address', ''),
                'status': 'active',  # Can be determined by last order date
                'created_at': customer.get('created_at'),
                'orders_count': orders_count,
                'total_spent': round(total_spent, 2)
            })
        
        return jsonify({
            "success": True,
            "data": customers,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": response.count or len(customers),
                "total_pages": ((response.count or len(customers)) + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/customers/<customer_id>', methods=['GET'])
def admin_customer_detail(customer_id):
    """
    Get customer details
    """
    try:
        response = supabase.table('customers').select('*').eq('id', customer_id).execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Customer not found"
            }), 404
        
        customer = response.data[0]
        
        # Get orders
        user_id = customer.get('user_id')
        if user_id:
            orders_response = supabase.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            orders = orders_response.data or []
            orders_count = len(orders)
            total_spent = sum(float(o.get('total', 0)) for o in orders if o.get('status') not in ['cancelled', 'failed'])
        else:
            orders = []
            orders_count = 0
            total_spent = 0
        
        customer['orders'] = orders
        customer['orders_count'] = orders_count
        customer['total_spent'] = round(total_spent, 2)
        
        return jsonify({
            "success": True,
            "data": customer
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/customers/<customer_id>/orders', methods=['GET'])
def admin_customer_orders(customer_id):
    """
    Get customer's orders
    """
    try:
        # Get customer to find user_id
        customer_response = supabase.table('customers').select('user_id').eq('id', customer_id).execute()
        
        if not customer_response.data:
            return jsonify({
                "success": False,
                "message": "Customer not found"
            }), 404
        
        user_id = customer_response.data[0].get('user_id')
        
        if not user_id:
            return jsonify({
                "success": True,
                "data": []
            }), 200
        
        # Get orders
        orders_response = supabase.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return jsonify({
            "success": True,
            "data": orders_response.data or []
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/customers/stats', methods=['GET'])
def admin_customers_stats():
    """
    Get customer statistics
    """
    try:
        customers_response = supabase.table('customers').select('id, created_at').execute()
        customers = customers_response.data or []
        
        total = len(customers)
        
        # New this month
        current_month = datetime.now().strftime('%Y-%m')
        new_this_month = len([c for c in customers if c.get('created_at', '').startswith(current_month)])
        
        # Get total revenue
        orders_response = supabase.table('orders').select('total, status').execute()
        orders = orders_response.data or []
        total_revenue = sum(float(o.get('total', 0)) for o in orders if o.get('status') not in ['cancelled', 'failed'])
        
        return jsonify({
            "success": True,
            "data": {
                "total": total,
                "active": total,  # Simplified - all are considered active
                "new_this_month": new_this_month,
                "total_revenue": round(total_revenue, 2)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Discounts Admin APIs
@app.route('/api/admin/discounts', methods=['GET', 'POST'])
def admin_discounts():
    """
    GET: List all discounts
    POST: Create a new discount
    """
    try:
        if request.method == 'GET':
            page = request.args.get('page', 1, type=int)
            limit = request.args.get('limit', 10, type=int)
            search = request.args.get('search', '')
            status = request.args.get('status')
            
            offset = (page - 1) * limit
            
            query = supabase.table('discounts').select('*', count='exact')
            
            if search:
                query = query.ilike('code', f'%{search}%')
            if status and status != 'all':
                query = query.eq('status', status)
            
            response = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            
            # Format discounts
            discounts = []
            for discount in response.data or []:
                exp_date = discount.get('expiration_date', '')
                is_expired = datetime.strptime(exp_date, '%Y-%m-%d').date() < datetime.now().date() if exp_date else False
                
                discounts.append({
                    'id': discount['id'],
                    'code': discount.get('code', ''),
                    'discount': discount.get('discount', 0),
                    'type': discount.get('type', 'percentage'),
                    'expiration_date': exp_date,
                    'status': 'expired' if is_expired else discount.get('status', 'active'),
                    'usage_count': discount.get('usage_count', 0),
                    'usage_limit': discount.get('usage_limit', 100),
                    'min_order_value': discount.get('min_order_value', 0),
                    'created_at': discount.get('created_at')
                })
            
            return jsonify({
                "success": True,
                "data": discounts,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": response.count or len(discounts),
                    "total_pages": ((response.count or len(discounts)) + limit - 1) // limit
                }
            }), 200
            
        elif request.method == 'POST':
            data = request.json
            
            discount_data = {
                'code': data.get('code', '').upper(),
                'discount': data.get('discount', 0),
                'type': data.get('type', 'percentage'),
                'expiration_date': data.get('expiration_date'),
                'status': 'active',
                'usage_count': 0,
                'usage_limit': data.get('usage_limit', 100),
                'min_order_value': data.get('min_order_value', 0)
            }
            
            response = supabase.table('discounts').insert(discount_data).execute()
            
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Discount created successfully"
            }), 201
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/discounts/<discount_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_discount_detail(discount_id):
    """
    GET: Get discount details
    PUT: Update discount
    DELETE: Delete discount
    """
    try:
        if request.method == 'GET':
            response = supabase.table('discounts').select('*').eq('id', discount_id).execute()
            
            if not response.data:
                return jsonify({
                    "success": False,
                    "message": "Discount not found"
                }), 404
            
            return jsonify({
                "success": True,
                "data": response.data[0]
            }), 200
            
        elif request.method == 'PUT':
            data = request.json
            
            update_data = {}
            allowed_fields = ['code', 'discount', 'type', 'expiration_date', 'status', 'usage_limit', 'min_order_value']
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if 'code' in update_data:
                update_data['code'] = update_data['code'].upper()
            
            if update_data:
                response = supabase.table('discounts').update(update_data).eq('id', discount_id).execute()
                
                return jsonify({
                    "success": True,
                    "data": response.data[0] if response.data else None,
                    "message": "Discount updated successfully"
                }), 200
            
            return jsonify({
                "success": False,
                "message": "No fields to update"
            }), 400
            
        elif request.method == 'DELETE':
            response = supabase.table('discounts').delete().eq('id', discount_id).execute()
            
            return jsonify({
                "success": True,
                "message": "Discount deleted successfully"
            }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/discounts/stats', methods=['GET'])
def admin_discounts_stats():
    """
    Get discount statistics
    """
    try:
        discounts_response = supabase.table('discounts').select('*').execute()
        discounts = discounts_response.data or []
        
        active = 0
        expired = 0
        total_uses = 0
        
        for discount in discounts:
            exp_date = discount.get('expiration_date', '')
            is_expired = datetime.strptime(exp_date, '%Y-%m-%d').date() < datetime.now().date() if exp_date else False
            
            if is_expired or discount.get('status') == 'expired':
                expired += 1
            elif discount.get('status') == 'active':
                active += 1
            
            total_uses += discount.get('usage_count', 0)
        
        return jsonify({
            "success": True,
            "data": {
                "active": active,
                "total_uses": total_uses,
                "discount_value_given": 0,  # Would need order data to calculate
                "expired": expired
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Stock Management Admin APIs
@app.route('/api/admin/stock/overview', methods=['GET'])
def admin_stock_overview():
    """
    Get stock overview by category
    """
    try:
        products_response = supabase.table('products').select('id, category, stock, price').execute()
        products = products_response.data or []
        
        from collections import defaultdict
        categories = defaultdict(lambda: {'total_items': 0, 'low_stock': 0, 'out_of_stock': 0, 'value': 0})
        
        for product in products:
            category = product.get('category', 'Uncategorized')
            stock = product.get('stock', 0)
            price = float(product.get('price', 0))
            
            categories[category]['total_items'] += 1
            categories[category]['value'] += price * stock
            
            if stock == 0:
                categories[category]['out_of_stock'] += 1
            elif stock < 10:
                categories[category]['low_stock'] += 1
        
        overview = [
            {
                'category': cat,
                'total_items': data['total_items'],
                'low_stock': data['low_stock'],
                'out_of_stock': data['out_of_stock'],
                'value': round(data['value'], 2)
            }
            for cat, data in categories.items()
        ]
        
        return jsonify({
            "success": True,
            "data": overview
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/stock/low-stock', methods=['GET'])
def admin_low_stock_products():
    """
    Get products with low stock
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        
        response = supabase.table('products')\
            .select('id, name, category, stock')\
            .lt('stock', 10)\
            .gt('stock', 0)\
            .order('stock', desc=False)\
            .limit(limit)\
            .execute()
        
        products = []
        for product in response.data or []:
            products.append({
                'id': product['id'],
                'name': product.get('name', ''),
                'category': product.get('category', ''),
                'current_stock': product.get('stock', 0),
                'minimum_stock': 10  # Default minimum
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

@app.route('/api/admin/stock/out-of-stock', methods=['GET'])
def admin_out_of_stock_products():
    """
    Get out of stock products
    """
    try:
        response = supabase.table('products')\
            .select('id, name, category, updated_at')\
            .eq('stock', 0)\
            .execute()
        
        products = []
        for product in response.data or []:
            products.append({
                'id': product['id'],
                'name': product.get('name', ''),
                'category': product.get('category', ''),
                'last_order_date': product.get('updated_at')
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

@app.route('/api/admin/stock/<product_id>', methods=['PUT'])
def admin_update_stock(product_id):
    """
    Update product stock
    """
    try:
        data = request.json
        stock = data.get('stock')
        
        if stock is None or stock < 0:
            return jsonify({
                "success": False,
                "message": "Valid stock value is required"
            }), 400
        
        response = supabase.table('products').update({
            'stock': stock,
            'updated_at': datetime.now().isoformat()
        }).eq('id', product_id).execute()
        
        if not response.data:
            return jsonify({
                "success": False,
                "message": "Product not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": "Stock updated successfully"
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Analytics Admin APIs
@app.route('/api/admin/analytics/revenue', methods=['GET'])
def admin_analytics_revenue():
    """
    Get revenue analytics
    """
    try:
        period = request.args.get('period', 'month')
        
        orders_response = supabase.table('orders').select('total, created_at, status').execute()
        orders = orders_response.data or []
        
        from collections import defaultdict
        monthly_revenue = defaultdict(float)
        
        for order in orders:
            if order.get('status') not in ['failed', 'cancelled']:
                created_at = order.get('created_at', '')
                if created_at:
                    month = created_at[:7]
                    monthly_revenue[month] += float(order.get('total', 0))
        
        sorted_months = sorted(monthly_revenue.keys())[-6:]
        
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        labels = []
        data = []
        
        for month in sorted_months:
            month_num = int(month.split('-')[1])
            labels.append(month_names[month_num - 1])
            data.append(round(monthly_revenue[month], 2))
        
        total = sum(data)
        growth = ((data[-1] - data[-2]) / data[-2] * 100) if len(data) >= 2 and data[-2] > 0 else 0
        
        return jsonify({
            "success": True,
            "data": {
                "labels": labels,
                "data": data,
                "total": round(total, 2),
                "growth": round(growth, 1)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/analytics/orders', methods=['GET'])
def admin_analytics_orders():
    """
    Get orders analytics
    """
    try:
        orders_response = supabase.table('orders').select('created_at, status').execute()
        orders = orders_response.data or []
        
        from collections import defaultdict
        monthly_orders = defaultdict(int)
        
        for order in orders:
            created_at = order.get('created_at', '')
            if created_at:
                month = created_at[:7]
                monthly_orders[month] += 1
        
        sorted_months = sorted(monthly_orders.keys())[-6:]
        
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        labels = []
        data = []
        
        for month in sorted_months:
            month_num = int(month.split('-')[1])
            labels.append(month_names[month_num - 1])
            data.append(monthly_orders[month])
        
        total = sum(data)
        growth = ((data[-1] - data[-2]) / data[-2] * 100) if len(data) >= 2 and data[-2] > 0 else 0
        
        return jsonify({
            "success": True,
            "data": {
                "labels": labels,
                "data": data,
                "total": total,
                "growth": round(growth, 1)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/analytics/products', methods=['GET'])
def admin_analytics_products():
    """
    Get products analytics
    """
    try:
        products_response = supabase.table('products').select('category, stock').execute()
        products = products_response.data or []
        
        from collections import defaultdict
        by_category = defaultdict(int)
        by_status = {'in_stock': 0, 'low_stock': 0, 'out_of_stock': 0}
        
        for product in products:
            category = product.get('category', 'Uncategorized')
            stock = product.get('stock', 0)
            
            by_category[category] += 1
            
            if stock == 0:
                by_status['out_of_stock'] += 1
            elif stock < 10:
                by_status['low_stock'] += 1
            else:
                by_status['in_stock'] += 1
        
        return jsonify({
            "success": True,
            "data": {
                "by_category": [{'category': cat, 'count': count} for cat, count in by_category.items()],
                "by_status": [{'status': status, 'count': count} for status, count in by_status.items()]
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/analytics/customers', methods=['GET'])
def admin_analytics_customers():
    """
    Get customers analytics
    """
    try:
        customers_response = supabase.table('customers').select('id, created_at').execute()
        customers = customers_response.data or []
        
        current_month = datetime.now().strftime('%Y-%m')
        new_customers = len([c for c in customers if c.get('created_at', '').startswith(current_month)])
        returning_customers = len(customers) - new_customers
        
        return jsonify({
            "success": True,
            "data": {
                "new_customers": new_customers,
                "returning_customers": returning_customers,
                "churn_rate": 0  # Would need more data to calculate
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=1581)
