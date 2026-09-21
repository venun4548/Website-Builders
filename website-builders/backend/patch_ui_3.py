
file_path = 'app.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_ui_routes = """
@app.route('/portfolio')
@login_required
def portfolio_dashboard():
    if not current_user.is_admin():
        flash('Unauthorized access', 'error')
        return redirect(url_for('dashboard'))
    return render_template('portfolio_dashboard.html')

@app.route('/pricing')
@login_required
def pricing_dashboard():
    if not current_user.is_admin():
        flash('Unauthorized access', 'error')
        return redirect(url_for('dashboard'))
    return render_template('pricing_dashboard.html')
"""

if "def portfolio_dashboard" not in content:
    content = content.replace("# ─── NEW API ENDPOINTS", new_ui_routes + "\n# ─── NEW API ENDPOINTS")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Patched UI routes successfully!")
