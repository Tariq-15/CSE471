from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime
from google import genai
import json
from io import BytesIO
from PIL import Image
import base64
import requests

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
        
        # Build query - only show active products for users
        query = supabase.table('products').select('id, name, price, image_urls, color, category, tags', count='exact')
        query = query.eq('status', 'active')  # Only show active products
        
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
        count_query = count_query.eq('status', 'active')  # Only count active products
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
        response = supabase.table('products').select('*').eq('id', product_id).eq('status', 'active').execute()
        
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
                .eq('status', 'active')\
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
        
        # Get all active products with "New Arrival" tag
        response = supabase.table('products').select('id, name, price, image_urls, color, tags').eq('status', 'active').execute()
        
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

@app.route('/api/products/featured', methods=['GET'])
def get_featured_products():
    """
    Get 4 random Featured Product products
    Returns: Name, Rating (average), Image[2] (first 2 images), Price
    Note: Color field is NOT included in the response
    """
    try:
        import random
        
        # Get all active products with "Featured Product" tag
        response = supabase.table('products').select('id, name, price, image_urls, color, tags').eq('status', 'active').execute()
        
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
        
        # Calculate offset
        offset = (page - 1) * limit
        
        # Build query - only show active products for users
        query = supabase.table('products').select('id, name, price, image_urls, category, color, tags', count='exact')
        query = query.eq('status', 'active')  # Only show active products
        
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
        count_query = count_query.eq('status', 'active')  # Only count active products
        if category:
            count_query = count_query.eq('category', category)
        if min_price is not None:
            count_query = count_query.gte('price', min_price)
        if max_price is not None:
            count_query = count_query.lte('price', max_price)
        if color:
            count_query = count_query.eq('color', color)
        
        # Get paginated data (fetch more if tag filter is applied)
        fetch_limit = limit * 3 if tag_filter_applied else limit
        response = query.range(offset, offset + fetch_limit).order('created_at', desc=True).execute()
        
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
                'id': product.get('id'),  # Include product ID
                'name': product.get('name', ''),
                'rating': average_rating,
                'image': images,  # Array of max 2 images
                'price': float(product.get('price', 0))
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
        
        # Search products by name (case-insensitive) - only active products
        response = supabase.table('products')\
            .select('id, name, price, image_urls, image_url, category')\
            .eq('status', 'active')\
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
# ADMIN PRODUCTS APIs
# ============================================

@app.route('/api/admin/products', methods=['GET', 'POST'])
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


@app.route('/api/admin/products/<product_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_product_detail(product_id):
    """Get, update or delete a product"""
    try:
        if request.method == 'GET':
            response = supabase.table('products').select('*').eq('id', product_id).execute()
            if not response.data:
                return jsonify({"success": False, "message": "Product not found"}), 404
            
            product_data = response.data[0]
            
            # Fetch product size stock if product has size_chart_template_id
            if product_data.get('size_chart_template_id'):
                try:
                    # Get product_sizes with stock
                    product_sizes = supabase.table('product_sizes')\
                        .select('id, size_chart_row_id, size_chart_rows(size_label), product_size_stock(stock_quantity)')\
                        .eq('product_id', product_id)\
                        .execute()
                    
                    # Format size stock data
                    size_stocks = []
                    if product_sizes.data:
                        for ps in product_sizes.data:
                            row = ps.get('size_chart_rows')
                            stock_data = ps.get('product_size_stock')
                            
                            # Handle nested structure (could be dict or list)
                            if isinstance(row, list) and len(row) > 0:
                                row = row[0]
                            elif isinstance(row, dict):
                                pass  # Already a dict
                            else:
                                continue
                            
                            if row:
                                # Get stock value (column is stock_quantity, not stock)
                                stock_value = 0
                                if stock_data:
                                    if isinstance(stock_data, list) and len(stock_data) > 0:
                                        stock_value = stock_data[0].get('stock_quantity', 0)
                                    elif isinstance(stock_data, dict):
                                        stock_value = stock_data.get('stock_quantity', 0)
                                
                                size_stocks.append({
                                    'row_id': ps['size_chart_row_id'],
                                    'size_label': row.get('size_label', '') if isinstance(row, dict) else '',
                                    'stock': stock_value
                                })
                    
                    product_data['size_stocks'] = size_stocks
                except Exception as e:
                    print(f"Warning: Could not fetch size stocks: {e}")
                    product_data['size_stocks'] = []
            
            return jsonify({"success": True, "data": product_data}), 200
        
        elif request.method == 'PUT':
            data = request.json
            update_data = {k: v for k, v in data.items() if k not in ['size_stocks', 'size_chart_template_id'] and v is not None}
            
            # Handle size_chart_template_id
            if 'size_chart_template_id' in data:
                template_id = data['size_chart_template_id']
                update_data['size_chart_template_id'] = template_id
                
                # Auto-create product_sizes if template is assigned
                if template_id:
                    try:
                        # Get template rows
                        template_rows = supabase.table('size_chart_rows').select('id, size_label').eq('template_id', template_id).execute()
                        
                        if template_rows.data:
                            # Get existing product_sizes
                            existing_sizes = supabase.table('product_sizes').select('id, size_chart_row_id').eq('product_id', product_id).execute()
                            existing_row_ids = {s['size_chart_row_id'] for s in (existing_sizes.data or [])}
                            
                            # Create missing product_sizes
                            for row in template_rows.data:
                                if row['id'] not in existing_row_ids:
                                    supabase.table('product_sizes').insert({
                                        'product_id': product_id,
                                        'size_chart_row_id': row['id']
                                    }).execute()
                    except Exception as e:
                        print(f"Warning: Could not auto-create product_sizes: {e}")
            
            # Update product
            response = supabase.table('products').update(update_data).eq('id', product_id).execute()
            
            # Handle size stock updates
            if 'size_stocks' in data and data['size_stocks']:
                try:
                    size_stocks = data['size_stocks']  # Array of {row_id, stock}
                    
                    for stock_item in size_stocks:
                        row_id = stock_item.get('row_id')
                        stock = stock_item.get('stock', 0)
                        
                        if row_id:
                            # Find product_size_id
                            product_size = supabase.table('product_sizes').select('id').eq('product_id', product_id).eq('size_chart_row_id', row_id).execute()
                            
                            if product_size.data:
                                product_size_id = product_size.data[0]['id']
                                
                                # Update or insert stock (column is stock_quantity, not stock)
                                existing_stock = supabase.table('product_size_stock').select('id').eq('product_size_id', product_size_id).execute()
                                
                                if existing_stock.data:
                                    supabase.table('product_size_stock').update({'stock_quantity': stock}).eq('product_size_id', product_size_id).execute()
                                else:
                                    supabase.table('product_size_stock').insert({
                                        'product_size_id': product_size_id,
                                        'stock_quantity': stock
                                    }).execute()
                except Exception as e:
                    print(f"Warning: Could not update size stock: {e}")
            
            return jsonify({"success": True, "data": response.data[0] if response.data else None}), 200
        
        elif request.method == 'DELETE':
            supabase.table('products').delete().eq('id', product_id).execute()
            return jsonify({"success": True, "message": "Product deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================
# ADMIN ORDERS APIs
# ============================================

@app.route('/api/admin/orders', methods=['GET'])
def admin_orders():
    """Get all orders"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)
        status = request.args.get('status', '')
        offset = (page - 1) * limit
        
        query = supabase.table('orders').select('*, customers(*)', count='exact')
        if status:
            query = query.eq('status', status)
        
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
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/orders/stats', methods=['GET'])
def admin_orders_stats():
    """Get order statistics"""
    try:
        response = supabase.table('orders').select('status').execute()
        orders = response.data or []
        from collections import Counter
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


@app.route('/api/admin/orders/<order_id>', methods=['GET'])
def admin_order_detail(order_id):
    """Get order details"""
    try:
        response = supabase.table('orders').select('*, customers(*), order_items(*)').eq('id', order_id).execute()
        if not response.data:
            return jsonify({"success": False, "message": "Order not found"}), 404
        return jsonify({"success": True, "data": response.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/orders/<order_id>/status', methods=['PUT'])
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


# ============================================
# ADMIN CUSTOMERS APIs
# ============================================

@app.route('/api/admin/customers', methods=['GET'])
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
        
        # Add customer_type based on user_id presence
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


@app.route('/api/admin/customers/stats', methods=['GET'])
def admin_customers_stats():
    """Get customer statistics"""
    try:
        response = supabase.table('customers').select('id, created_at, user_id', count='exact').execute()
        customers = response.data or []
        
        from datetime import datetime
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


# ============================================
# ADMIN DASHBOARD APIs
# ============================================

@app.route('/api/admin/dashboard/stats', methods=['GET'])
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


@app.route('/api/admin/dashboard/sales', methods=['GET'])
def admin_dashboard_sales():
    """Get sales data for charts"""
    try:
        orders_response = supabase.table('orders').select('total, created_at, status').execute()
        orders = orders_response.data or []
        
        from datetime import datetime
        from collections import defaultdict
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


@app.route('/api/admin/dashboard/best-selling', methods=['GET'])
def admin_dashboard_best_selling():
    """Get best selling products"""
    try:
        limit = request.args.get('limit', 5, type=int)
        products_response = supabase.table('products').select('id, name, stock').execute()
        products = {p['id']: p for p in (products_response.data or [])}
        
        items_response = supabase.table('order_items').select('product_id, quantity').execute()
        from collections import defaultdict
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


@app.route('/api/admin/dashboard/low-stock', methods=['GET'])
def admin_dashboard_low_stock():
    """Get low stock items"""
    try:
        limit = request.args.get('limit', 10, type=int)
        response = supabase.table('products').select('id, name, stock, category').lte('stock', 10).gt('stock', 0).order('stock').limit(limit).execute()
        return jsonify({"success": True, "data": response.data or []}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================
# ADMIN DISCOUNTS APIs
# ============================================

@app.route('/api/admin/discounts', methods=['GET', 'POST'])
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


@app.route('/api/admin/discounts/stats', methods=['GET'])
def admin_discounts_stats():
    """Get discount statistics"""
    try:
        response = supabase.table('discounts').select('*').execute()
        discounts = response.data or []
        
        from datetime import datetime
        now = datetime.now()
        
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


@app.route('/api/admin/discounts/<discount_id>', methods=['GET', 'PUT', 'DELETE'])
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


# ============================================
# SIZE CHART MANAGEMENT APIs
# ============================================

@app.route('/api/admin/size-charts/templates', methods=['GET', 'POST'])
def admin_size_chart_templates():
    """List or create size chart templates"""
    try:
        if request.method == 'GET':
            response = supabase.table('size_chart_templates').select('*').order('created_at', desc=True).execute()
            return jsonify({"success": True, "data": response.data or []}), 200
        
        elif request.method == 'POST':
            data = request.json
            response = supabase.table('size_chart_templates').insert({
                'name': data.get('name'),
                'description': data.get('description', '')
            }).execute()
            return jsonify({
                "success": True,
                "data": response.data[0] if response.data else None,
                "message": "Template created successfully"
            }), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>', methods=['GET', 'PUT', 'DELETE'])
def admin_size_chart_template(template_id):
    """Get, update or delete a size chart template"""
    try:
        if request.method == 'GET':
            template_response = supabase.table('size_chart_templates').select('*').eq('id', template_id).execute()
            if not template_response.data:
                return jsonify({"success": False, "message": "Template not found"}), 404
            
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
            
            template['rows'] = rows
            template['columns'] = columns
            template['values_grid'] = values_grid
            
            return jsonify({"success": True, "data": template}), 200
        
        elif request.method == 'PUT':
            data = request.json
            update_data = {}
            if 'name' in data: update_data['name'] = data['name']
            if 'description' in data: update_data['description'] = data['description']
            response = supabase.table('size_chart_templates').update(update_data).eq('id', template_id).execute()
            return jsonify({"success": True, "data": response.data[0] if response.data else None}), 200
        
        elif request.method == 'DELETE':
            rows_response = supabase.table('size_chart_rows').select('id').eq('template_id', template_id).execute()
            row_ids = [r['id'] for r in rows_response.data or []]
            if row_ids:
                supabase.table('size_chart_values').delete().in_('row_id', row_ids).execute()
            supabase.table('size_chart_rows').delete().eq('template_id', template_id).execute()
            supabase.table('size_chart_columns').delete().eq('template_id', template_id).execute()
            supabase.table('size_chart_templates').delete().eq('id', template_id).execute()
            return jsonify({"success": True, "message": "Template deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>/rows', methods=['POST'])
def admin_size_chart_add_row(template_id):
    """Add a row to size chart"""
    try:
        data = request.json
        response = supabase.table('size_chart_rows').insert({
            'template_id': template_id,
            'size_label': data.get('size_label'),
            'sort_order': data.get('sort_order', 0)
        }).execute()
        return jsonify({"success": True, "data": response.data[0] if response.data else None}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>/rows/<int:row_id>', methods=['DELETE'])
def admin_size_chart_delete_row(template_id, row_id):
    """Delete a row from size chart"""
    try:
        supabase.table('size_chart_values').delete().eq('row_id', row_id).execute()
        supabase.table('size_chart_rows').delete().eq('id', row_id).execute()
        return jsonify({"success": True, "message": "Row deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>/columns', methods=['POST'])
def admin_size_chart_add_column(template_id):
    """Add a column to size chart"""
    try:
        data = request.json
        response = supabase.table('size_chart_columns').insert({
            'template_id': template_id,
            'column_key': data.get('column_key'),
            'display_name': data.get('display_name'),
            'unit': data.get('unit', 'cm'),
            'sort_order': data.get('sort_order', 0)
        }).execute()
        return jsonify({"success": True, "data": response.data[0] if response.data else None}), 201
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>/columns/<int:column_id>', methods=['DELETE'])
def admin_size_chart_delete_column(template_id, column_id):
    """Delete a column from size chart"""
    try:
        supabase.table('size_chart_values').delete().eq('column_id', column_id).execute()
        supabase.table('size_chart_columns').delete().eq('id', column_id).execute()
        return jsonify({"success": True, "message": "Column deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/size-charts/templates/<int:template_id>/values', methods=['PUT'])
def admin_size_chart_update_values(template_id):
    """Update size chart values"""
    try:
        data = request.json
        values = data.get('values', [])
        
        for val in values:
            row_id = val.get('row_id')
            column_id = val.get('column_id')
            value = val.get('value', '')
            
            if row_id and column_id:
                existing = supabase.table('size_chart_values').select('id').eq('row_id', row_id).eq('column_id', column_id).execute()
                if existing.data:
                    supabase.table('size_chart_values').update({'value': value}).eq('id', existing.data[0]['id']).execute()
                else:
                    supabase.table('size_chart_values').insert({
                        'row_id': row_id,
                        'column_id': column_id,
                        'value': value
                    }).execute()
        
        return jsonify({"success": True, "message": "Values updated"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================
# IMAGE UPLOAD APIs
# ============================================

@app.route('/api/admin/upload/image', methods=['POST'])
def admin_upload_image():
    """Upload image to Supabase Storage"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        # Check file type
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return jsonify({"success": False, "error": "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"}), 400
        
        # Generate unique filename
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
        unique_filename = f"products/{uuid.uuid4()}.{ext}"
        
        # Read file content
        file_content = file.read()
        
        # Upload to Supabase Storage
        response = supabase.storage.from_('product-images').upload(
            unique_filename,
            file_content,
            {"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('product-images').get_public_url(unique_filename)
        
        return jsonify({
            "success": True,
            "data": {
                "url": public_url,
                "path": unique_filename
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/upload/images', methods=['POST'])
def admin_upload_multiple_images():
    """Upload multiple images to Supabase Storage"""
    try:
        if 'files' not in request.files:
            return jsonify({"success": False, "error": "No files provided"}), 400
        
        files = request.files.getlist('files')
        if not files:
            return jsonify({"success": False, "error": "No files selected"}), 400
        
        uploaded = []
        errors = []
        
        for file in files:
            if file.filename == '':
                continue
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if file.content_type not in allowed_types:
                errors.append(f"{file.filename}: Invalid file type")
                continue
            
            try:
                # Generate unique filename
                ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
                unique_filename = f"products/{uuid.uuid4()}.{ext}"
                
                # Read file content
                file_content = file.read()
                
                # Upload to Supabase Storage
                supabase.storage.from_('product-images').upload(
                    unique_filename,
                    file_content,
                    {"content-type": file.content_type}
                )
                
                # Get public URL
                public_url = supabase.storage.from_('product-images').get_public_url(unique_filename)
                
                uploaded.append({
                    "url": public_url,
                    "path": unique_filename,
                    "original_name": file.filename
                })
            except Exception as e:
                errors.append(f"{file.filename}: {str(e)}")
        
        return jsonify({
            "success": True,
            "data": {
                "uploaded": uploaded,
                "errors": errors
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/admin/upload/delete', methods=['DELETE'])
def admin_delete_image():
    """Delete image from Supabase Storage"""
    try:
        data = request.json
        path = data.get('path')
        
        if not path:
            return jsonify({"success": False, "error": "No path provided"}), 400
        
        # Delete from Supabase Storage
        supabase.storage.from_('product-images').remove([path])
        
        return jsonify({"success": True, "message": "Image deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================
# VIRTUAL TRY-ON (TRIAL ROOM) API
# ============================================

# Gemini API Configuration
GEMINI_API_KEY = os.getenv('GEMINI_IMAGE_API', 'AIzaSyD0kTCHESelVNPQFQg7gyYJca9_cZdOMQo')
GEMINI_MODEL = "gemini-2.0-flash-exp"  # Image generation model


def load_image_from_file(file) -> genai.types.Part:
    """Loads an uploaded file and converts it into a GenAI Part object."""
    try:
        img = Image.open(file)
        img_format = img.format if img.format else 'PNG'
        mime_type = Image.MIME.get(img_format.upper()) or 'image/png'
        
        img_byte_arr = BytesIO()
        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            img_format = 'JPEG'
            mime_type = 'image/jpeg'
        img.save(img_byte_arr, format=img_format)
        
        return genai.types.Part.from_bytes(
            data=img_byte_arr.getvalue(),
            mime_type=mime_type
        )
    except Exception as e:
        raise Exception(f"Error processing image: {e}")


def load_image_from_url(image_url: str) -> genai.types.Part:
    """Loads an image from URL and converts it into a GenAI Part object."""
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        img = Image.open(BytesIO(response.content))
        img_format = img.format if img.format else 'PNG'
        mime_type = Image.MIME.get(img_format.upper()) or 'image/png'
        
        img_byte_arr = BytesIO()
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
            img_format = 'JPEG'
            mime_type = 'image/jpeg'
        img.save(img_byte_arr, format=img_format)
        
        return genai.types.Part.from_bytes(
            data=img_byte_arr.getvalue(),
            mime_type=mime_type
        )
    except Exception as e:
        raise Exception(f"Error loading image from URL: {e}")


@app.route('/api/virtual-try-on', methods=['POST'])
def virtual_try_on():
    """
    Virtual Try-On API - Generate an image of a person wearing a product
    
    Accepts:
    - person_image: File upload of the person's photo
    - product_image_url: URL of the product image (from database)
    OR
    - person_image: File upload
    - product_image: File upload
    
    Returns:
    - Base64 encoded image of the person wearing the product
    """
    try:
        if not GEMINI_API_KEY:
            return jsonify({
                "success": False, 
                "error": "Gemini API key not configured"
            }), 500
        
        # Get person image (required - uploaded by user)
        if 'person_image' not in request.files:
            return jsonify({
                "success": False, 
                "error": "Please upload your photo"
            }), 400
        
        person_file = request.files['person_image']
        if person_file.filename == '':
            return jsonify({
                "success": False, 
                "error": "No person image selected"
            }), 400
        
        # Get product image (either from URL or file upload)
        product_image_url = request.form.get('product_image_url')
        product_file = request.files.get('product_image')
        
        if not product_image_url and not product_file:
            return jsonify({
                "success": False, 
                "error": "Product image is required"
            }), 400
        
        # Load images as GenAI Parts
        person_part = load_image_from_file(person_file)
        
        if product_image_url:
            product_part = load_image_from_url(product_image_url)
        else:
            product_part = load_image_from_file(product_file)
        
        # Create the prompt for virtual try-on
        # IMPORTANT: First image is the PERSON (keep unchanged), Second image is the CLOTHING (extract design)
        prompt = """Take the T-shirt pattern/design from the second image and composite it onto the person in the first image, 
as if the person is realistically wearing that T-shirt. Ensure correct texture, folds, and lighting. 
The final image should only show the person wearing the new shirt.

CRITICAL: The FIRST image is the PERSON - keep their face, body, pose, and background EXACTLY as they are. 
Only replace the clothing they are wearing with the T-shirt design from the SECOND image. 
Do NOT recreate or modify the person's image - use the exact person from the first image."""
        
        # Build the content list - ORDER IS CRITICAL: Person first, Product second
        contents = [
            person_part,   # Image 1: The person (DO NOT MODIFY)
            product_part,  # Image 2: The clothing item (EXTRACT DESIGN FROM THIS)
            prompt         # The instruction
        ]
        
        # Initialize Gemini client
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        # Generate the image
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
            config=genai.types.GenerateContentConfig(
                response_modalities=['image', 'text']
            )
        )
        
        # Extract the generated image
        image_part = None
        if response.candidates and response.candidates[0].content.parts:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    image_part = part.inline_data
                    break
        
        if not image_part:
            # Check if there's a text response (error message)
            text_response = ""
            if response.text:
                text_response = response.text
            return jsonify({
                "success": False, 
                "error": "Failed to generate try-on image. The AI model could not process the images.",
                "details": text_response[:500] if text_response else "No additional details"
            }), 500
        
        # Convert to base64 for frontend display
        image_bytes = image_part.data
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = image_part.mime_type or 'image/png'
        
        return jsonify({
            "success": True,
            "data": {
                "image": f"data:{mime_type};base64,{base64_image}",
                "mime_type": mime_type
            }
        }), 200
        
    except Exception as e:
        print(f"Virtual try-on error: {str(e)}")
        return jsonify({
            "success": False, 
            "error": f"Virtual try-on failed: {str(e)}"
        }), 500


@app.route('/api/virtual-try-on/download', methods=['POST'])
def download_try_on_image():
    """Download the generated try-on image"""
    try:
        data = request.json
        image_data = data.get('image')  # Base64 data URL
        
        if not image_data:
            return jsonify({"success": False, "error": "No image data provided"}), 400
        
        # Remove the data URL prefix
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decode base64
        image_bytes = base64.b64decode(image_data)
        
        # Create file-like object
        image_buffer = BytesIO(image_bytes)
        image_buffer.seek(0)
        
        return send_file(
            image_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name=f'virtual_try_on_{uuid.uuid4().hex[:8]}.png'
        )
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=1581)
