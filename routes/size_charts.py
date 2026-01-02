"""Size chart management routes."""
from flask import Blueprint, request, jsonify
from utils.supabase_client import get_supabase

bp = Blueprint('size_charts', __name__, url_prefix='/api/admin/size-charts')
supabase = get_supabase()


@bp.route('/templates', methods=['GET', 'POST'])
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


@bp.route('/templates/<int:template_id>', methods=['GET', 'PUT', 'DELETE'])
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


@bp.route('/templates/<int:template_id>/rows', methods=['POST'])
def admin_size_chart_add_row(template_id):
    """Add a row to size chart"""
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "error": "Request body is required"}), 400
        
        size_label = data.get('size_label')
        if not size_label or not size_label.strip():
            return jsonify({"success": False, "error": "size_label is required"}), 400
        
        # Verify template exists
        template_check = supabase.table('size_chart_templates').select('id').eq('id', template_id).execute()
        if not template_check.data:
            return jsonify({"success": False, "error": f"Template with id {template_id} not found"}), 404
        
        # Get max sort_order for this template to append at the end
        sort_order = data.get('sort_order')
        if sort_order is None:
            existing_rows = supabase.table('size_chart_rows').select('sort_order').eq('template_id', template_id).order('sort_order', desc=True).limit(1).execute()
            max_sort_order = existing_rows.data[0]['sort_order'] if existing_rows.data and len(existing_rows.data) > 0 else -1
            sort_order = max_sort_order + 1
        else:
            sort_order = int(sort_order)
        
        response = supabase.table('size_chart_rows').insert({
            'template_id': template_id,
            'size_label': size_label.strip(),
            'sort_order': int(sort_order)
        }).execute()
        
        if not response.data:
            return jsonify({"success": False, "error": "Failed to create row"}), 500
        
        return jsonify({"success": True, "data": response.data[0]}), 201
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error adding size chart row: {error_trace}")
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/templates/<int:template_id>/rows/<int:row_id>', methods=['DELETE'])
def admin_size_chart_delete_row(template_id, row_id):
    """Delete a row from size chart"""
    try:
        supabase.table('size_chart_values').delete().eq('row_id', row_id).execute()
        supabase.table('size_chart_rows').delete().eq('id', row_id).execute()
        return jsonify({"success": True, "message": "Row deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/templates/<int:template_id>/columns', methods=['POST'])
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


@bp.route('/templates/<int:template_id>/columns/<int:column_id>', methods=['DELETE'])
def admin_size_chart_delete_column(template_id, column_id):
    """Delete a column from size chart"""
    try:
        supabase.table('size_chart_values').delete().eq('column_id', column_id).execute()
        supabase.table('size_chart_columns').delete().eq('id', column_id).execute()
        return jsonify({"success": True, "message": "Column deleted"}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@bp.route('/templates/<int:template_id>/values', methods=['PUT'])
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

