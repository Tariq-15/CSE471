"""Image upload routes."""
from flask import Blueprint, request, jsonify
import uuid
from utils.supabase_client import get_supabase

bp = Blueprint('upload', __name__, url_prefix='/api/admin/upload')
supabase = get_supabase()


@bp.route('/image', methods=['POST'])
def admin_upload_image():
    """Upload image to Supabase Storage"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
        
        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return jsonify({"success": False, "error": "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"}), 400
        
        ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
        unique_filename = f"products/{uuid.uuid4()}.{ext}"
        
        file_content = file.read()
        
        response = supabase.storage.from_('product-images').upload(
            unique_filename,
            file_content,
            {"content-type": file.content_type}
        )
        
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


@bp.route('/images', methods=['POST'])
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
            
            allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if file.content_type not in allowed_types:
                errors.append(f"{file.filename}: Invalid file type")
                continue
            
            try:
                ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
                unique_filename = f"products/{uuid.uuid4()}.{ext}"
                
                file_content = file.read()
                
                supabase.storage.from_('product-images').upload(
                    unique_filename,
                    file_content,
                    {"content-type": file.content_type}
                )
                
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


@bp.route('/delete', methods=['DELETE'])
def admin_delete_image():
    """Delete image from Supabase Storage"""
    try:
        data = request.json
        path = data.get('path')
        
        if not path:
            return jsonify({"success": False, "error": "No path provided"}), 400
        
        supabase.storage.from_('product-images').remove([path])
        
        return jsonify({"success": True, "message": "Image deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

