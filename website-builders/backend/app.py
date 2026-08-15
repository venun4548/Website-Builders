
import os
import json
import logging
import requests
from datetime import datetime, timedelta
from functools import wraps

from flask import (Flask, render_template, request, redirect, url_for,
                   flash, jsonify, session, send_from_directory)
from flask_login import (LoginManager, login_user, logout_user,
                         login_required, current_user)
from flask_cors import CORS
from flask_bcrypt import Bcrypt

from config import Config
from models import SheetsUser, ist_now, format_ist

# ─── App Init ─────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../', static_url_path='')
app.config.from_object(Config)

CORS(app, supports_credentials=True, origins=[
    'http://127.0.0.1:5000', 'http://localhost:5000',
    os.environ.get('FRONTEND_URL', '*')
])

if os.environ.get('RENDER') or os.environ.get('VERCEL'):
    app.config['SESSION_COOKIE_SECURE']   = True
    app.config['REMEMBER_COOKIE_SECURE']  = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['REMEMBER_COOKIE_SAMESITE']= 'None'

bcrypt = Bcrypt(app)

login_manager = LoginManager(app)
login_manager.login_view = 'login'

# ─── GAS Proxy Helpers ────────────────────────────────────────
GAS_URL    = Config.GAS_URL
GAS_SECRET = Config.GAS_SECRET

def call_gas(action: str, data: dict = None, timeout: int = 20) -> dict:
    """POST to Google Apps Script and return parsed JSON."""
    if not GAS_URL:
        return {'status': 'error', 'message': 'GAS_WEB_APP_URL not configured.'}
    try:
        payload = {
            'token' : GAS_SECRET,
            'action': action,
            'data'  : json.dumps(data or {})
        }
        resp = requests.post(GAS_URL, data=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        logger.error('GAS timeout: %s', action)
        return {'status': 'error', 'message': 'Request timed out. Please retry.'}
    except Exception as e:
        logger.error('GAS error (%s): %s', action, str(e))
        return {'status': 'error', 'message': str(e)}


def gas_get(action: str, params: dict = None, timeout: int = 20) -> dict:
    """GET from Google Apps Script and return parsed JSON."""
    if not GAS_URL:
        return {'status': 'error', 'message': 'GAS_WEB_APP_URL not configured.'}
    try:
        p = {'token': GAS_SECRET, 'action': action}
        if params:
            p.update(params)
        resp = requests.get(GAS_URL, params=p, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        logger.error('GAS GET timeout: %s', action)
        return {'status': 'error', 'message': 'Request timed out. Please retry.'}
    except Exception as e:
        logger.error('GAS GET error (%s): %s', action, str(e))
        return {'status': 'error', 'message': str(e)}


# ─── Flask-Login User Loader ──────────────────────────────────
@login_manager.user_loader
def load_user(user_id):
    # Use session-cached user data to avoid GAS call on every request
    cached = session.get('_user_cache')
    if cached and str(cached.get('id') or cached.get('user_id')) == str(user_id):
        return SheetsUser(cached)
    # Fallback: fetch from GAS (slower path, e.g. after session expiry)
    result = gas_get('getUser', {'user_id': user_id})
    if result.get('status') == 'success' and result.get('data'):
        ud = result['data']
        session['_user_cache'] = ud
        return SheetsUser(ud)
    return None

@login_manager.unauthorized_handler
def unauthorized():
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'Authentication required.'}), 401
    return redirect(url_for('login'))

# ─── Rate Limiting (in-memory) ────────────────────────────────
RATE_LIMIT_TRACKER: dict = {}
PIN_RATE_LIMIT_TRACKER: dict = {}

def check_login_rate_limit(ip):
    now = datetime.utcnow()
    ts  = [t for t in RATE_LIMIT_TRACKER.get(ip, []) if now - t < timedelta(seconds=60)]
    RATE_LIMIT_TRACKER[ip] = ts
    if len(ts) >= 10:
        return False
    RATE_LIMIT_TRACKER[ip].append(now)
    return True

def check_pin_rate_limit(ip):
    now = datetime.utcnow()
    ts  = [t for t in PIN_RATE_LIMIT_TRACKER.get(ip, []) if now - t < timedelta(minutes=15)]
    PIN_RATE_LIMIT_TRACKER[ip] = ts
    return len(ts) < 5

def record_pin_attempt(ip):
    PIN_RATE_LIMIT_TRACKER.setdefault(ip, []).append(datetime.utcnow())

# ─── Role Decorators ─────────────────────────────────────────
def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @login_required
        def decorated(*args, **kwargs):
            if current_user.role not in roles:
                if request.path.startswith('/api/'):
                    return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
                flash('Access denied.', 'error')
                return redirect(url_for('login'))
            return f(*args, **kwargs)
        return decorated
    return decorator

def super_admin_required(f):
    return role_required('Super Admin')(f)

def admin_required(f):
    return role_required('Super Admin', 'Admin')(f)

def staff_required(f):
    return role_required('Super Admin', 'Admin', 'Staff')(f)

# ─── Static / Asset Routes ───────────────────────────────────
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('../css', filename)

@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('../js', filename)

@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory('../images', filename)

@app.route('/webfonts/<path:filename>')
def serve_webfonts(filename):
    return send_from_directory('../webfonts', filename)

# ─── Public Pages ─────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('../', 'index.html')

@app.route('/services.html')
def services():
    return send_from_directory('../', 'services.html')

@app.route('/contact.html')
def contact():
    return send_from_directory('../', 'contact.html')

# ─── Contact Form (proxies to GAS) ───────────────────────────
@app.route('/api/contact', methods=['POST'])
@app.route('/api/enquiry', methods=['POST'])
def contact_form():
    data = request.get_json(silent=True) or request.form.to_dict()
    result = call_gas('createEnquiry', {
        'customer_name': data.get('name', ''),
        'email'        : data.get('email', ''),
        'mobile'       : data.get('mobile', ''),
        'address'      : data.get('address', ''),
        'message'      : data.get('message', ''),
        'source_page'  : data.get('sourcePage', 'Contact Page')
    })
    if result.get('status') == 'success':
        return jsonify({
            'status': 'success',
            'success': True, 
            'submission_id': result['data'].get('id', '')
        })
    return jsonify({
        'status': 'error',
        'success': False, 
        'error': result.get('message', 'Submission failed.'),
        'message': result.get('message', 'Submission failed.')
    }), 400

# ─── Login Redirect ──────────────────────────────────────────
@app.route('/login')
def login():
    return redirect('/user/login')

@app.route('/logout')
@login_required
def logout():
    _do_logout()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    role = current_user.role.lower()
    if 'super' in role:
        return redirect(url_for('super_admin_dashboard'))
    elif 'admin' in role:
        return redirect(url_for('admin_dashboard'))
    elif 'staff' in role:
        return redirect(url_for('staff_dashboard'))
    else:
        return redirect(url_for('customer_dashboard'))

# Stubs for missing profile endpoints referenced in templates
@app.route('/profile/edit', methods=['POST'])
@login_required
def edit_profile():
    flash('Profile update not implemented in proxy version yet.', 'info')
    return redirect(url_for('profile'))

@app.route('/profile/password', methods=['POST'])
@login_required
def change_password():
    flash('Password change not implemented in proxy version yet.', 'info')
    return redirect(url_for('profile'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    flash('Forgot password not implemented in proxy version yet.', 'info')
    return redirect(url_for('login'))

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    flash('Reset password not implemented in proxy version yet.', 'info')
    return redirect(url_for('login'))

# ─── User (Client) Login ─────────────────────────────────────
@app.route('/user/login', methods=['GET', 'POST'])
def user_login():
    if current_user.is_authenticated:
        return redirect(url_for('customer_dashboard'))

    if request.method == 'POST':
        ip = request.remote_addr or '0.0.0.0'
        email = (request.form.get('email') or '').strip().lower()
        pwd = request.form.get('password', '')
        if not check_login_rate_limit(ip):
            flash('Too many login attempts. Please try again later.', 'error')
            return render_template('user_login.html')

        result = call_gas('loginUser', {'email': email, 'password': pwd})
        if result.get('status') == 'success':
            ud = result['data']
            role = ud.get('role', '')
            if role not in ('User', 'Client', 'CLIENT'):
                flash('This portal is for clients only.', 'error')
                return render_template('user_login.html')
            user = SheetsUser(ud)
            session['_user_cache'] = ud
            login_user(user, remember=True)
            return redirect(url_for('customer_dashboard'))
        flash(result.get('message', 'Invalid credentials.'), 'error')
    return render_template('user_login.html')

# ─── User (Client) Registration ──────────────────────────────
@app.route('/user/register', methods=['GET', 'POST'])
def user_register():
    if current_user.is_authenticated:
        return redirect(url_for('customer_dashboard'))
        
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip().lower()
        mobile = request.form.get('mobile', '').strip()
        password = request.form.get('password', '')
        
        result = call_gas('createUser', {
            'full_name': full_name,
            'email': email,
            'mobile': mobile,
            'password': password,
            'role': 'User'
        })
        
        if result.get('status') == 'success':
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('user_login'))
        else:
            flash(result.get('message', 'Registration failed.'), 'error')
            
    return render_template('user_register.html')

# ─── Admin/Staff Registration ────────────────────────────────
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip().lower()
        mobile = request.form.get('mobile', '').strip()
        password = request.form.get('password', '')
        role = request.form.get('role', 'Staff')
        
        result = call_gas('createUser', {
            'full_name': full_name,
            'email': email,
            'mobile': mobile,
            'password': password,
            'role': role
        })
        
        if result.get('status') == 'success':
            flash(f'{role} account created successfully! Please log in.', 'success')
            return redirect(url_for('admin_login'))
        else:
            flash(result.get('message', 'Registration failed.'), 'error')
            
    return render_template('register.html')

@app.route('/user/logout')
@login_required
def user_logout():
    _do_logout()
    return redirect(url_for('user_login'))

# ─── Admin Portal Access (PIN Gate) ──────────────────────────
@app.route('/admin/access', methods=['GET', 'POST'])
def admin_access():
    if request.method == 'POST':
        ip  = request.remote_addr or '0.0.0.0'
        pin = request.form.get('pin', '').strip()
        if not check_pin_rate_limit(ip):
            flash('Too many incorrect PIN attempts. Try again in 15 minutes.', 'error')
            return render_template('admin_access_verify.html')
        record_pin_attempt(ip)
        if pin == app.config['ADMIN_PORTAL_ACCESS_PIN']:
            session['admin_pin_verified'] = True
            session['admin_pin_time']     = datetime.utcnow().isoformat()
            return redirect(url_for('admin_login'))
        flash('Incorrect PIN.', 'error')
    return render_template('admin_access_verify.html')

def pin_verified():
    if not session.get('admin_pin_verified'):
        return False
    ts_str = session.get('admin_pin_time', '')
    if not ts_str:
        return False
    ts = datetime.fromisoformat(ts_str)
    limit = app.config.get('ADMIN_PIN_SESSION_MINUTES', 15)
    return datetime.utcnow() - ts < timedelta(minutes=limit)

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if not pin_verified():
        return redirect(url_for('admin_access'))
    if current_user.is_authenticated and current_user.role in ('Admin', 'Super Admin'):
        return redirect(url_for('admin_dashboard'))
    if request.method == 'POST':
        ip    = request.remote_addr or '0.0.0.0'
        email = (request.form.get('email') or '').strip().lower()
        pwd   = request.form.get('password', '')
        if not check_login_rate_limit(ip):
            flash('Too many login attempts.', 'error')
            return render_template('admin_login.html')
        result = call_gas('loginUser', {'email': email, 'password': pwd})
        if result.get('status') == 'success':
            ud   = result['data']
            role = ud.get('role', '')
            if role not in ('Admin', 'Super Admin'):
                flash('This portal is for Admins only.', 'error')
                return render_template('admin_login.html')
            user = SheetsUser(ud)
            session['_user_cache'] = ud
            login_user(user, remember=True)
            if role == 'Super Admin':
                return redirect(url_for('super_admin_dashboard'))
            return redirect(url_for('admin_dashboard'))
        flash(result.get('message', 'Invalid credentials.'), 'error')
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    _do_logout()
    return redirect(url_for('admin_access'))

# ─── Staff Login ─────────────────────────────────────────────
@app.route('/staff/login', methods=['GET', 'POST'])
def staff_login():
    if current_user.is_authenticated and current_user.is_staff():
        return redirect(url_for('staff_dashboard'))
    if request.method == 'POST':
        ip    = request.remote_addr or '0.0.0.0'
        email = (request.form.get('email') or '').strip().lower()
        pwd   = request.form.get('password', '')
        if not check_login_rate_limit(ip):
            flash('Too many login attempts.', 'error')
            return render_template('staff_login.html')
        result = call_gas('loginUser', {'email': email, 'password': pwd})
        if result.get('status') == 'success':
            ud   = result['data']
            role = ud.get('role', '')
            if role != 'Staff':
                flash('This portal is for Staff only.', 'error')
                return render_template('staff_login.html')
            user = SheetsUser(ud)
            session['_user_cache'] = ud
            login_user(user, remember=True)
            return redirect(url_for('staff_dashboard'))
        flash(result.get('message', 'Invalid credentials.'), 'error')
    return render_template('staff_login.html')

@app.route('/staff/logout')
@login_required
def staff_logout():
    _do_logout()
    return redirect(url_for('staff_login'))

# ─── Dashboard Pages ─────────────────────────────────────────
@app.route('/super-admin/dashboard')
@login_required
def super_admin_dashboard():
    if current_user.role != 'Super Admin':
        return redirect(url_for('login'))
    return render_template('super_admin_dashboard.html', user=current_user)

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    if current_user.role not in ('Admin', 'Super Admin'):
        return redirect(url_for('login'))
    if current_user.role == 'Super Admin':
        return redirect(url_for('super_admin_dashboard'))
    return render_template('admin_dashboard.html', user=current_user)

@app.route('/staff/dashboard')
@login_required
def staff_dashboard():
    if current_user.role not in ('Staff', 'Admin', 'Super Admin'):
        return redirect(url_for('login'))
    return render_template('staff_dashboard.html', user=current_user)

@app.route('/user/dashboard')
@app.route('/customer/dashboard')
@login_required
def customer_dashboard():
    return render_template('customer_dashboard.html', user=current_user)

@app.route('/profile')
@login_required
def profile():
    role = current_user.role.lower()
    if 'super' in role:
        return render_template('super_admin_profile.html', user=current_user)
    elif 'admin' in role:
        return render_template('admin_profile.html', user=current_user)
    elif 'staff' in role:
        return render_template('staff_profile.html', user=current_user)
    else:
        return render_template('customer_profile.html', user=current_user)

# ─── API: Current User ────────────────────────────────────────
@app.route('/api/me')
@login_required
def api_me():
    return jsonify({'success': True, 'user': current_user.to_dict()})

@app.route('/api/profile', methods=['GET', 'PUT', 'PATCH'])
@login_required
def api_profile():
    if request.method == 'GET':
        return jsonify({'success': True, 'data': current_user.to_dict()})
    data = request.get_json(silent=True) or {}
    data['user_id'] = current_user.id
    result = call_gas('updateUser', data)
    if result.get('status') == 'success':
        # Refresh session cache
        cache = session.get('_user_cache', {})
        if data.get('full_name'): cache['full_name'] = data['full_name']
        if data.get('mobile'):    cache['mobile']    = data['mobile']
        session['_user_cache'] = cache
        return jsonify({'success': True, 'message': 'Profile updated.'})
    return jsonify({'success': False, 'error': result.get('message', 'Update failed.')}), 400

# ─── API: Users ───────────────────────────────────────────────
@app.route('/api/users', methods=['GET'])
@login_required
def api_get_users():
    params = {k: v for k, v in request.args.items()}
    params['requester_role'] = current_user.role
    result = gas_get('getUsers', params)
    if result.get('status') == 'success':
        users = result.get('data', [])
        # Never expose password hashes
        for u in users:
            u.pop('password_hash', None)
            u.pop('pass', None)
        return jsonify({'success': True, 'data': users})
    return jsonify({'success': False, 'error': result.get('message', 'Failed.')}), 400

@app.route('/api/users', methods=['POST'])
@login_required
def api_create_user():
    if current_user.role not in ('Super Admin', 'Admin'):
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    data = request.get_json(silent=True) or {}
    data['created_by'] = current_user.id
    result = call_gas('createUser', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/users/<user_id>', methods=['GET'])
@login_required
def api_get_user(user_id):
    result = gas_get('getUser', {'user_id': user_id})
    if result.get('status') == 'success':
        u = result['data']
        u.pop('password_hash', None)
        return jsonify({'success': True, 'data': u})
    return jsonify({'success': False, 'error': result.get('message')}), 404

@app.route('/api/users/<user_id>', methods=['PUT', 'PATCH'])
@login_required
def api_update_user(user_id):
    if current_user.role not in ('Super Admin', 'Admin') and current_user.id != user_id:
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    data = request.get_json(silent=True) or {}
    data['user_id'] = user_id
    result = call_gas('updateUser', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/users/<user_id>', methods=['DELETE'])
@login_required
def api_delete_user(user_id):
    if current_user.role != 'Super Admin':
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    result = call_gas('deleteUser', {'user_id': user_id})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/users/<user_id>/activate', methods=['POST'])
@login_required
def api_activate_user(user_id):
    if current_user.role not in ('Super Admin', 'Admin'):
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    result = call_gas('activateUser', {'user_id': user_id})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/users/<user_id>/deactivate', methods=['POST'])
@login_required
def api_deactivate_user(user_id):
    if current_user.role not in ('Super Admin', 'Admin'):
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    result = call_gas('deactivateUser', {'user_id': user_id})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/users/<user_id>/reset-password', methods=['POST'])
@login_required
def api_reset_password(user_id):
    if current_user.role not in ('Super Admin', 'Admin') and current_user.id != user_id:
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    data = request.get_json(silent=True) or {}
    result = call_gas('resetPassword', {'user_id': user_id, 'new_password': data.get('new_password', '')})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

# ─── API: Stats ───────────────────────────────────────────────
@app.route('/api/stats')
@login_required
def api_stats():
    result = gas_get('getStats', {'user_id': current_user.id, 'role': current_user.role})
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result['data']})
    return jsonify({'success': False, 'error': result.get('message')}), 400

# ─── API: Enquiries ───────────────────────────────────────────
@app.route('/api/enquiries', methods=['GET'])
@login_required
def api_get_enquiries():
    params = dict(request.args)
    if current_user.is_user():
        params['customer_id'] = current_user.id
    result = gas_get('getEnquiries', params)
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/enquiries', methods=['POST'])
def api_create_enquiry():
    data = request.get_json(silent=True) or {}
    if current_user.is_authenticated:
        data['customer_id'] = current_user.id
    result = call_gas('createEnquiry', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/enquiries/<enquiry_id>', methods=['PUT', 'PATCH'])
@login_required
def api_update_enquiry(enquiry_id):
    data = request.get_json(silent=True) or {}
    data['enquiry_id'] = enquiry_id
    result = call_gas('updateEnquiry', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

# ─── API: Projects ────────────────────────────────────────────
@app.route('/api/projects', methods=['GET'])
@login_required
def api_get_projects():
    params = dict(request.args)
    if current_user.is_user():
        params['customer_id'] = current_user.id
    elif current_user.is_staff():
        params.setdefault('staff_id', current_user.id)
    result = gas_get('getProjects', params)
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/projects', methods=['POST'])
@login_required
def api_create_project():
    if current_user.role not in ('Super Admin', 'Admin'):
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    data = request.get_json(silent=True) or {}
    data['created_by'] = current_user.id
    result = call_gas('createProject', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/projects/<project_id>', methods=['PUT', 'PATCH'])
@login_required
def api_update_project(project_id):
    data = request.get_json(silent=True) or {}
    data['project_id'] = project_id
    result = call_gas('updateProject', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/projects/<project_id>/updates', methods=['GET'])
@login_required
def api_get_project_updates(project_id):
    result = gas_get('getProjectUpdates', {'project_id': project_id})
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/projects/<project_id>/updates', methods=['POST'])
@login_required
def api_add_project_update(project_id):
    data = request.get_json(silent=True) or {}
    data['project_id'] = project_id
    data['staff_id']   = data.get('staff_id') or current_user.id
    data['staff_name'] = data.get('staff_name') or current_user.full_name
    result = call_gas('addProjectUpdate', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/projects/<project_id>/assign', methods=['POST'])
@login_required
def api_assign_staff(project_id):
    if current_user.role not in ('Super Admin', 'Admin'):
        return jsonify({'success': False, 'error': 'Insufficient permissions.'}), 403
    data = request.get_json(silent=True) or {}
    data['project_id']  = project_id
    data['assigned_by'] = current_user.id
    action = 'reassignStaff' if data.get('reassign') else 'assignStaff'
    if action == 'reassignStaff':
        data['new_staff_id']   = data.get('staff_id')
        data['new_staff_name'] = data.get('staff_name')
    result = call_gas(action, data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/projects/<project_id>/assignments', methods=['GET'])
@login_required
def api_get_assignments(project_id):
    result = gas_get('getAssignments', {'project_id': project_id})
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

# ─── API: Messages ────────────────────────────────────────────
@app.route('/api/messages', methods=['GET'])
@login_required
def api_get_messages():
    params = dict(request.args)
    params['user_id'] = str(current_user.id)
    params['role']    = current_user.role
    result = gas_get('getMessages', params)
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/messages', methods=['POST'])
@login_required
def api_send_message():
    data = request.get_json(silent=True) or {}
    data.setdefault('sender_id',   str(current_user.id))
    data.setdefault('sender_name', current_user.full_name)
    data.setdefault('sender_role', current_user.role)
    result = call_gas('sendMessage', data)
    ok = result.get('status') == 'success'
    return jsonify({'success': ok, 'data': result.get('data'), 'error': result.get('message')}), (200 if ok else 400)

@app.route('/api/messages/conversations', methods=['GET'])
@login_required
def api_get_conversations():
    result = gas_get('getConversations', {
        'user_id': str(current_user.id),
        'role'   : current_user.role
    })
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/messages/conversations/<conversation_id>', methods=['GET'])
@login_required
def api_get_conversation_thread(conversation_id):
    result = gas_get('getConversationThread', {
        'conversation_id': conversation_id,
        'user_id'        : str(current_user.id),
        'role'           : current_user.role
    })
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message', 'Failed.')}), 400

@app.route('/api/messages/conversations/with/<other_user_id>', methods=['GET'])
@login_required
def api_get_conv_with_user(other_user_id):
    result = gas_get('getConvWithUser', {
        'user_id'      : str(current_user.id),
        'other_user_id': str(other_user_id)
    })
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', {})})
    return jsonify({'success': False, 'error': result.get('message')}), 400

@app.route('/api/messages/<message_id>/read', methods=['POST'])
@login_required
def api_mark_read(message_id):
    result = call_gas('markMessageRead', {'message_id': message_id})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok}), (200 if ok else 400)

@app.route('/api/messages/conversation/<conversation_id>/read', methods=['POST'])
@login_required
def api_mark_conversation_read(conversation_id):
    result = call_gas('markMessageRead', {'conversation_id': conversation_id})
    ok = result.get('status') == 'success'
    return jsonify({'success': ok}), (200 if ok else 400)

@app.route('/api/messages/recipients', methods=['GET'])
@login_required
def api_get_recipients():
    result = gas_get('getRecipients', {
        'user_id': str(current_user.id),
        'role'   : current_user.role
    })
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

# ─── API: Activity Logs ───────────────────────────────────────
@app.route('/api/activity', methods=['GET'])
@login_required
def api_get_activity():
    params = dict(request.args)
    if current_user.role not in ('Super Admin', 'Admin'):
        params['user_id'] = str(current_user.id)
    result = gas_get('getActivityLogs', params)
    if result.get('status') == 'success':
        return jsonify({'success': True, 'data': result.get('data', [])})
    return jsonify({'success': False, 'error': result.get('message')}), 400

# ─── Legacy GAS Sync (kept for backwards compat) ──────────────
@app.route('/api/sync/gas', methods=['POST'])
@login_required
def api_sync_gas():
    """Legacy route — now a no-op since GAS IS the primary store."""
    return jsonify({'success': True, 'message': 'GAS is now the primary storage. No sync needed.'})

# ─── Logout Helper ────────────────────────────────────────────
def _do_logout():
    uid   = current_user.id if current_user.is_authenticated else ''
    uname = current_user.full_name if current_user.is_authenticated else ''
    role  = current_user.role if current_user.is_authenticated else ''
    logout_user()
    session.pop('_user_cache', None)
    session.pop('admin_pin_verified', None)
    session.pop('admin_pin_time', None)
    if uid:
        call_gas('logActivity', {
            'userId': uid, 'userName': uname, 'role': role,
            'action': 'LOGOUT', 'relatedId': uid,
            'description': 'User logged out', 'status': 'SUCCESS'
        })

# ─── Error Handlers ───────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found.'}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error('500 error: %s', str(e))
    return jsonify({'error': 'Internal server error.'}), 500

# ─── Entrypoint ───────────────────────────────────────────────
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
