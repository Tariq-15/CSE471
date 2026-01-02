"""Recommendation engine routes."""
from flask import Blueprint, request, jsonify
import json
import os
from google import genai
from utils.supabase_client import get_supabase

bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')
supabase = get_supabase()


@bp.route('', methods=['POST'])
def get_recommendations():
    """Get product recommendations using AI"""
    try:
        data = request.json
        query = data.get('query', '').strip()
        limit = data.get('limit', 10)
        
        if not query:
            return jsonify({
                "success": False,
                "message": "query is required"
            }), 400
        
        gem = genai.Client(api_key=os.getenv('GOOGLE_AI_API_KEY', 'AIzaSyBtNdhLPPzFJL2_WM3ix7bHCyVvfMmSvaE'))
        
        products_response = supabase.table('products')\
            .select('id, name, price, image_urls, image_url, category, description, color, tags')\
            .limit(100)\
            .execute()
        
        if not products_response.data:
            return jsonify({
                "success": False,
                "message": "No products available"
            }), 404
        
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
        
        try:
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
                raise Exception(f"All Gemini models failed. Last error: {ai_error}")
            
            response_text = response.text.strip() if hasattr(response, 'text') else str(response).strip()
            
            if response_text.startswith('```'):
                parts = response_text.split('```')
                if len(parts) > 1:
                    response_text = parts[1]
                    if response_text.startswith('json'):
                        response_text = response_text[4:]
                response_text = response_text.strip()
            
            import re
            array_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if array_match:
                response_text = array_match.group(0)
            
            recommended_ids = json.loads(response_text)
            
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
            print(f"AI parsing error, using fallback: {str(e)}")
            query_lower = query.lower()
            recommended_products = []
            
            keywords = query_lower.split()
            
            for product in products_data:
                if len(recommended_products) >= limit:
                    break
                
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

