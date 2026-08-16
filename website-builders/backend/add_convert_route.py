with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()
    
    # Add the convert route after the PUT/PATCH route
    new_route = '''
@app.route('/api/enquiries/<enquiry_id>/convert', methods=['POST'])
@login_required
def api_convert_enquiry(enquiry_id):
    try:
        data = request.json
        data['enquiry_id'] = enquiry_id
        data['converted_by'] = current_user.id
        result = gas_post('convertEnquiry', data)
        if result.get('status') == 'success':
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
'''
    
    content = content.replace("@app.route('/api/enquiries/<enquiry_id>', methods=['PUT', 'PATCH'])", new_route + "\n@app.route('/api/enquiries/<enquiry_id>', methods=['PUT', 'PATCH'])")
    
    with open('app.py', 'w', encoding='utf-8') as f:
        f.write(content)
