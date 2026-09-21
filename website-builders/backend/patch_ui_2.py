
file_path = 'app.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_ui_route = """
@app.route('/stage-history')
@login_required
def stage_history_dashboard():
    if not current_user.is_admin():
        flash('Unauthorized access', 'error')
        return redirect(url_for('dashboard'))
    return render_template('stage_history.html')
"""

if "def stage_history_dashboard" not in content:
    content = content.replace("# ─── NEW API ENDPOINTS", new_ui_route + "\n# ─── NEW API ENDPOINTS")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched UI route successfully!")
