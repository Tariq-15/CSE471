"""Virtual try-on routes."""
from flask import Blueprint, request, jsonify, send_file
import uuid
import base64
from io import BytesIO
from google import genai
from config import GEMINI_API_KEY, GEMINI_MODEL
from utils.supabase_client import get_supabase
from utils.image_utils import load_image_from_file, load_image_from_url, validate_person_image

bp = Blueprint('virtual_try_on', __name__, url_prefix='/api/virtual-try-on')
supabase = get_supabase()


@bp.route('', methods=['POST'])
def virtual_try_on():
    """Virtual Try-On API - Generate an image of a person wearing a product"""
    try:
        if not GEMINI_API_KEY:
            return jsonify({
                "success": False, 
                "error": "Gemini API key not configured"
            }), 500
        
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
        
        product_image_url = request.form.get('product_image_url')
        product_file = request.files.get('product_image')
        
        if not product_image_url and not product_file:
            return jsonify({
                "success": False, 
                "error": "Product image is required"
            }), 400
        
        try:
            person_part = load_image_from_file(person_file)
            print(f"[Virtual Try-On] Person image loaded successfully, MIME: {person_part.mime_type if hasattr(person_part, 'mime_type') else 'N/A'}")
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to process person image: {str(e)}"
            }), 400
        
        # Validate if the person image is appropriate for virtual try-on
        print("[Virtual Try-On] Validating person image...")
        is_valid, validation_message = validate_person_image(person_part)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": validation_message or "Please provide an appropriate image with a clear person visible for virtual try-on"
            }), 400
        print(f"[Virtual Try-On] Image validation passed: {validation_message}")
        
        try:
            if product_image_url:
                product_part = load_image_from_url(product_image_url)
                print(f"[Virtual Try-On] Product image loaded from URL: {product_image_url}")
            else:
                product_part = load_image_from_file(product_file)
                print(f"[Virtual Try-On] Product image loaded from file")
            print(f"[Virtual Try-On] Product image loaded successfully, MIME: {product_part.mime_type if hasattr(product_part, 'mime_type') else 'N/A'}")
        except Exception as e:
            return jsonify({
                "success": False,
                "error": f"Failed to process product image: {str(e)}"
            }), 400
        
        prompt = (
            """Take the T-shirt pattern/design from the second image and composite it onto the person in the first image, 
as if the person is realistically wearing that T-shirt. Ensure correct texture, folds, and lighting. 
The final image should only show the person wearing the new shirt.

CRITICAL: The FIRST image is the PERSON - keep their face, body, pose, and background EXACTLY as they are. 
Only replace the clothing they are wearing with the T-shirt design from the SECOND image. 
Do NOT recreate or modify the person's image - use the exact person from the first image."""
        )
        
        contents = [
            person_part,
            product_part,
            prompt
        ]
        
        print(f"[Virtual Try-On] Images loaded successfully")
        print(f"[Virtual Try-On] Sending request to {GEMINI_MODEL}...")
        
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=contents,
        )
        
        image_part = None
        if (response.candidates and
                response.candidates[0].content.parts):
            for part in response.candidates[0].content.parts:
                if part.inline_data:
                    image_part = part.inline_data
                    break
        
        if not image_part:
            print("\n[Virtual Try-On] FAILURE: Image generation failed or no image data was found.")
            text_response = ""
            if response.text:
                text_response = response.text
                print(f"[Virtual Try-On] Model response text (check for safety filter): {text_response[:200]}")
            return jsonify({
                "success": False, 
                "error": "Failed to generate try-on image. The AI model could not process the images.",
                "details": text_response[:500] if text_response else "No additional details"
            }), 500
        
        image_bytes = image_part.data
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = getattr(image_part, 'mime_type', 'image/png') or 'image/png'
        
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


@bp.route('/download', methods=['POST'])
def download_try_on_image():
    """Download the generated try-on image"""
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({"success": False, "error": "No image data provided"}), 400
        
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
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

