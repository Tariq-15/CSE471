"""Image processing utilities for virtual try-on."""
from io import BytesIO
from typing import Tuple
from PIL import Image
import requests
from google import genai
from config import GEMINI_API_KEY

def load_image_from_file(file) -> genai.types.Part:
    """Loads an uploaded file and converts it into a GenAI Part object."""
    try:
        # Open the image using PIL
        img = Image.open(file)
        
        # Determine the correct MIME type
        img_format = img.format if img.format else 'PNG'
        mime_type = Image.MIME.get(img_format.upper()) or 'image/png'
        
        # Handle WebP conversion (PIL may not support saving WebP)
        if img_format == 'WEBP':
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGBA')
                img_format = 'PNG'
                mime_type = 'image/png'
            else:
                img = img.convert('RGB')
                img_format = 'JPEG'
                mime_type = 'image/jpeg'
        
        # Save the image data into a BytesIO buffer
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format=img_format)
        
        # Create the Part object for the API request
        return genai.types.Part.from_bytes(
            data=img_byte_arr.getvalue(),
            mime_type=mime_type
        )
    except Exception as e:
        raise Exception(f"Error loading image: {e}")


def load_image_from_url(image_url: str) -> genai.types.Part:
    """Loads an image from URL and converts it into a GenAI Part object."""
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Open the image using PIL
        img = Image.open(BytesIO(response.content))
        
        # Determine the correct MIME type
        img_format = img.format if img.format else 'PNG'
        mime_type = Image.MIME.get(img_format.upper()) or 'image/png'
        
        # Handle WebP conversion (PIL may not support saving WebP)
        if img_format == 'WEBP':
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGBA')
                img_format = 'PNG'
                mime_type = 'image/png'
            else:
                img = img.convert('RGB')
                img_format = 'JPEG'
                mime_type = 'image/jpeg'
        
        # Save the image data into a BytesIO buffer
        img_byte_arr = BytesIO()
        img.save(img_byte_arr, format=img_format)
        
        # Create the Part object for the API request
        return genai.types.Part.from_bytes(
            data=img_byte_arr.getvalue(),
            mime_type=mime_type
        )
    except Exception as e:
        raise Exception(f"Error loading image from URL: {e}")


def validate_person_image(image_part) -> Tuple[bool, str]:
    """
    Validate if the uploaded person image is appropriate for virtual try-on.
    Returns: (is_valid, message)
    """
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        
        validation_prompt = (
            "Analyze this image and determine if it's appropriate for virtual clothing try-on. "
            "The image should contain a clear, visible person (full body or upper body) in a suitable pose for trying on clothing. "
            "Check if:\n"
            "1. The image contains a person (not an object, animal, or inappropriate content)\n"
            "2. The person is clearly visible and in a suitable pose\n"
            "3. The image is appropriate and safe for clothing visualization\n\n"
            "Respond with ONLY 'VALID' if the image is appropriate, or 'INVALID: [reason]' if it's not suitable. "
            "Be specific about why it's invalid (e.g., 'INVALID: No person visible', 'INVALID: Inappropriate content', 'INVALID: Person not clearly visible')."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=[image_part, validation_prompt],
        )
        
        if response.text:
            result = response.text.strip().upper()
            if result.startswith("VALID"):
                return True, "Image is appropriate for virtual try-on"
            elif result.startswith("INVALID"):
                reason = response.text.strip()
                if ":" in reason:
                    reason = reason.split(":", 1)[1].strip()
                else:
                    reason = "Image is not suitable for virtual try-on"
                return False, reason
            else:
                # If response is unclear, check for safety filters
                if "safety" in result.lower() or "inappropriate" in result.lower():
                    return False, "Please provide an appropriate image with a clear person visible for virtual try-on"
                return False, "Please provide an appropriate image with a clear person visible for virtual try-on"
        
        # If no text response, assume invalid
        return False, "Please provide an appropriate image with a clear person visible for virtual try-on"
        
    except Exception as e:
        # If validation fails, we'll still allow the request but log the error
        print(f"[Image Validation] Error during validation: {str(e)}")
        # Return True to allow the request to proceed (fail-open approach)
        # Or return False if you want strict validation
        return True, "Validation check completed"

