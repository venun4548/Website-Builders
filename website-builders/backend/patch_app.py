import os

file_path = 'app.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_routes = """
# ─── NEW API ENDPOINTS ───────────────────────────────────────

@app.route('/api/stage-history', methods=['GET', 'POST'])
@login_required
def api_stage_history():
    if request.method == 'GET':
        project_id = request.args.get('project_id')
        res = gas_get('getStageHistory', {'project_id': project_id})
        return jsonify(res)
    else:
        data = request.get_json(silent=True) or {}
        if not data.get('changed_by'):
            data['changed_by'] = current_user.full_name
        res = call_gas('createStageHistory', data)
        return jsonify(res)

@app.route('/api/leads', methods=['GET', 'POST', 'PUT'])
@login_required
def api_leads():
    if request.method == 'GET':
        status = request.args.get('status')
        res = gas_get('getLeads', {'status': status})
        return jsonify(res)
    elif request.method == 'POST':
        data = request.get_json(silent=True) or {}
        res = call_gas('createLead', data)
        return jsonify(res)
    else: # PUT
        data = request.get_json(silent=True) or {}
        res = call_gas('updateLead', data)
        return jsonify(res)

@app.route('/api/lead-notes', methods=['GET', 'POST'])
@login_required
def api_lead_notes():
    if request.method == 'GET':
        lead_id = request.args.get('lead_id')
        res = gas_get('getLeadNotes', {'lead_id': lead_id})
        return jsonify(res)
    else:
        data = request.get_json(silent=True) or {}
        if not data.get('user_id'):
            data['user_id'] = current_user.id
        res = call_gas('createLeadNote', data)
        return jsonify(res)

@app.route('/api/portfolio', methods=['GET', 'POST', 'PUT'])
def api_portfolio():
    if request.method == 'GET':
        res = gas_get('getPortfolio')
        return jsonify(res)
    elif request.method == 'POST':
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        data = request.get_json(silent=True) or {}
        res = call_gas('createPortfolio', data)
        return jsonify(res)
    else: # PUT
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        data = request.get_json(silent=True) or {}
        res = call_gas('updatePortfolio', data)
        return jsonify(res)

@app.route('/api/pricing', methods=['GET', 'POST', 'PUT'])
def api_pricing():
    if request.method == 'GET':
        res = gas_get('getPricing')
        return jsonify(res)
    elif request.method == 'POST':
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        data = request.get_json(silent=True) or {}
        res = call_gas('createPricing', data)
        return jsonify(res)
    else: # PUT
        if not current_user.is_authenticated or not current_user.is_admin():
            return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403
        data = request.get_json(silent=True) or {}
        res = call_gas('updatePricing', data)
        return jsonify(res)

@app.route('/api/notifications', methods=['GET', 'POST', 'PUT'])
@login_required
def api_notifications():
    if request.method == 'GET':
        user_id = request.args.get('user_id') or current_user.id
        res = gas_get('getNotifications', {'user_id': user_id})
        return jsonify(res)
    elif request.method == 'POST':
        data = request.get_json(silent=True) or {}
        res = call_gas('createNotification', data)
        return jsonify(res)
    else: # PUT / mark as read
        data = request.get_json(silent=True) or {}
        res = call_gas('markNotificationRead', data)
        return jsonify(res)

@app.route('/api/password-resets', methods=['POST', 'PUT'])
def api_password_resets():
    data = request.get_json(silent=True) or {}
    if request.method == 'POST':
        res = call_gas('createPasswordReset', data)
        return jsonify(res)
    else: # PUT
        res = call_gas('usePasswordReset', data)
        return jsonify(res)

@app.route('/api/email-verifications', methods=['POST', 'PUT'])
def api_email_verifications():
    data = request.get_json(silent=True) or {}
    if request.method == 'POST':
        res = call_gas('createEmailVerification', data)
        return jsonify(res)
    else: # PUT
        res = call_gas('useEmailVerification', data)
        return jsonify(res)

"""

if "# ─── NEW API ENDPOINTS" not in content:
    # Append right before the if __name__ == '__main__': block if it exists, or just append to end
    if "if __name__ == '__main__':" in content:
        content = content.replace("if __name__ == '__main__':", new_routes + "\nif __name__ == '__main__':")
    else:
        content += "\n" + new_routes

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched app.py successfully!")
