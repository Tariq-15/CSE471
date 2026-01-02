"""Test routes."""
from flask import Blueprint, request, jsonify

bp = Blueprint('test', __name__, url_prefix='/api')


@bp.route('/test', methods=['GET', 'POST'])
def test():
    """Test endpoint"""
    if request.method == 'GET':
        return jsonify({"response": "Get Request Called"})
    elif request.method == "POST":
        req_json = request.json
        name = req_json.get('name', 'Guest')
        return jsonify({"response": f"Hi {name}"})

