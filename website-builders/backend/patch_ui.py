
file_path = 'app.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_ui_route = """
@app.route('/leads')
@login_required
def leads_dashboard():
    if not current_user.is_admin():
        flash('Unauthorized access', 'error')
        return redirect(url_for('dashboard'))
    return render_template('leads_dashboard.html')
"""

if "def leads_dashboard" not in content:
    content = content.replace("# ─── NEW API ENDPOINTS", new_ui_route + "\n# ─── NEW API ENDPOINTS")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched UI route successfully!")
