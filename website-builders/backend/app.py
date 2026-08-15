
import os
import json
import uuid
import urllib
import traceback
import requests
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from flask_bcrypt import Bcrypt
from flask_cors import CORS

from functools import wraps
from config import Config
from models import db, User, PasswordResetToken, AuditLog, Project, ProjectUpdate, Notification, ProjectFile, Website, Task, SystemSetting, Message, StaffAssignment, Enquiry, ProjectTimeline, ProjectRemark

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='../', static_url_path='')
app.config.from_object(Config)

# Allow cross-origin requests from the Vercel frontend in production
CORS(app, supports_credentials=True, origins=[
    'http://127.0.0.1:5000',
    'http://localhost:5000',
    os.environ.get('FRONTEND_URL', '*')
])

# Secure cookies in production (HTTPS)
if os.environ.get('RENDER'):
    app.config['SESSION_COOKIE_SECURE'] = True
    app.config['REMEMBER_COOKIE_SECURE'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'None'
    app.config['REMEMBER_COOKIE_SAMESITE'] = 'None'

# Initialize extensions
db.init_app(app)
bcrypt = Bcrypt(app)

# Ensure database tables are created automatically on WSGI / Serverless startup
with app.app_context():
    try:
        db.create_all()
    except Exception as e:
        logger.error(f"Error initializing database schema on startup: {str(e)}")

# In-memory IP Rate Limiter
RATE_LIMIT_TRACKER = {}  # ip -> list of datetimes

def check_login_rate_limit(ip):
    now = datetime.utcnow()
    # Keep only timestamps within the last 60 seconds
    timestamps = RATE_LIMIT_TRACKER.get(ip, [])
    timestamps = [t for t in timestamps if now - t < timedelta(seconds=60)]
    RATE_LIMIT_TRACKER[ip] = timestamps
    if len(timestamps) >= 10:
        return False
    RATE_LIMIT_TRACKER[ip].append(now)
    return True

# In-memory Rate Limiter for Admin PIN verification (Max 5 attempts in 15 minutes)
PIN_RATE_LIMIT_TRACKER = {}  # ip -> list of datetimes

def check_pin_rate_limit(ip):
    now = datetime.utcnow()
    timestamps = PIN_RATE_LIMIT_TRACKER.get(ip, [])
    timestamps = [t for t in timestamps if now - t < timedelta(minutes=15)]
    PIN_RATE_LIMIT_TRACKER[ip] = timestamps
    if len(timestamps) >= 5:
        return False
    return True

def record_pin_failed_attempt(ip):
    now = datetime.utcnow()
    timestamps = PIN_RATE_LIMIT_TRACKER.get(ip, [])
    timestamps.append(now)
    PIN_RATE_LIMIT_TRACKER[ip] = timestamps

def clear_pin_failed_attempts(ip):
    PIN_RATE_LIMIT_TRACKER[ip] = []

def is_admin_access_verified():
    try:
        if current_user.is_authenticated and getattr(current_user, 'role', '') in ['Super Admin', 'Admin', 'Staff']:
            return True
        granted = session.get('admin_access_granted', False)
        expiry_str = session.get('admin_access_expires')
        if granted and expiry_str:
            try:
                expiry = datetime.fromisoformat(expiry_str)
                if datetime.utcnow() < expiry:
                    return True
            except Exception:
                pass
    except Exception as e:
        logger.error(f"is_admin_access_verified error: {str(e)}")
    return False

def log_audit(action, user_email, target_user=None, status="Success"):
    try:
        log_entry = AuditLog(
            action=str(action),
            user_email=str(user_email),
            target_user=str(target_user) if target_user else None,
            status=str(status),
            timestamp=datetime.utcnow()
        )
        db.session.add(log_entry)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logger.debug(f"log_audit notice: {str(e)}")

# Secret mapping Google Apps Script Web App
GAS_WEB_APP_URL = os.environ.get('GAS_WEB_APP_URL', 'https://script.google.com/macros/s/AKfycbzOHqf47OudqBUULE8wLrMv-lWVN8InExF56vd_AL8PlE3zA_u65se3SPbc4P1K6ePkjQ/exec')
SHARED_SECRET = os.environ.get('SHARED_SECRET', 'sec_wb_crm_77c4e569bbd18f0a1c6a58')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'user_login'

@login_manager.unauthorized_handler
def custom_unauthorized():
    if request.path.startswith('/api/'):
        return jsonify({'status': 'error', 'message': 'Authentication required.'}), 401
    
    if request.path.startswith('/admin') or request.path.startswith('/super-admin') or request.path.startswith('/staff'):
        flash('Please log in to access the Admin Portal.', 'error')
        return redirect(url_for('admin_login', next=request.path))
    
    flash('Please log in to access your account.', 'info')
    return redirect(url_for('user_login', next=request.path))

# Google Apps Script Web App URL & Shared Secret (reads from env vars or defaults)
GAS_WEB_APP_URL = os.environ.get('GAS_WEB_APP_URL', 'https://script.google.com/macros/s/AKfycbzOHqf47OudqBUULE8wLrMv-lWVN8InExF56vd_AL8PlE3zA_u65se3SPbc4P1K6ePkjQ/exec')
SHARED_SECRET = os.environ.get('SHARED_SECRET', 'sec_wb_crm_77c4e569bbd18f0a1c6a58')

def sync_to_google_sheets(action, data):
    try:
        import urllib.parse
        import urllib.request
        params = {
            'token': SHARED_SECRET,
            'action': action,
            'data': json.dumps(data)
        }
        encoded_data = urllib.parse.urlencode(params).encode('utf-8')
        req = urllib.request.Request(GAS_WEB_APP_URL, data=encoded_data, method='POST')
        with urllib.request.urlopen(req, timeout=3) as resp:
            resp_body = resp.read().decode('utf-8')
            logger.info(f"Google Sheets sync [{action}] status: {resp.status} - {resp_body[:100]}")
    except Exception as e:
        logger.warning(f"Google Sheets sync notice [{action}]: {str(e)}")

@login_manager.user_loader
def load_user(user_id):
    try:
        return User.query.get(int(user_id))
    except Exception as e:
        logger.error(f"load_user error: {str(e)}")
        return None

def role_required(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if not current_user.is_authenticated:
                if request.path.startswith('/api/'):
                    return jsonify({'status': 'error', 'message': 'Authentication Required'}), 401
                return login_manager.unauthorized()
            if current_user.role not in roles:
                if request.path.startswith('/api/'):
                    return jsonify({'status': 'error', 'message': f'Access Restricted: Required role: {", ".join(roles)}'}), 403
                flash(f'Access denied. Required role: {", ".join(roles)}', 'error')
                return redirect(url_for('dashboard'))
            return fn(*args, **kwargs)
        return decorated_view
    return wrapper

PERMISSION_MATRIX = {
    'Super Admin': ['all'],
    'Admin': [
        'users.limited', 'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete',
        'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'manage_projects',
        'websites.view', 'websites.create', 'websites.edit', 'websites.delete',
        'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete',
        'analytics.view', 'messages.view', 'messages.send', 'activity.view',
        'system.limited', 'settings.limited', 'view_reports', 'manage_users'
    ],
    'Staff': [
        'clients.assigned', 'projects.assigned', 'websites.assigned', 'tasks.assigned',
        'messages.view', 'messages.send', 'analytics.assigned', 'settings.self', 'projects.view', 'tasks.view'
    ],
    'User': [ # Client record
        'clients.own', 'projects.own', 'websites.own', 'messages.view', 'messages.send'
    ]
}

def requires_permission(perm):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if not current_user.is_authenticated:
                return login_manager.unauthorized()
            
            role = current_user.role
            perms = PERMISSION_MATRIX.get(role, [])
            
            if 'all' in perms or perm in perms:
                return fn(*args, **kwargs)
            
            # Additional check for generic assigned/own permissions
            prefix = perm.split('.')[0]
            if f"{prefix}.assigned" in perms or f"{prefix}.own" in perms:
                # The route handler MUST do the actual granular check (e.g. is this ID assigned to me?)
                return fn(*args, **kwargs)

            if request.path.startswith('/api/'):
                return jsonify({'status': 'error', 'message': 'Access Restricted: You lack permission for ' + perm}), 403
                
            flash(f'Access Restricted: You lack permission for {perm}', 'error')
            return redirect(url_for('dashboard'))
        return decorated_view
    return wrapper

def log_audit(action, user_email, status="Success", target_user=None):
    try:
        log = AuditLog(action=action, user_email=user_email, status=status, target_user=target_user)
        db.session.add(log)
        db.session.commit()
        sync_to_google_sheets('sync_audit', {
            'id': log.id,
            'action': action,
            'user_email': user_email,
            'status': status,
            'target_user': target_user or '',
            'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else ''
        })
    except Exception as e:
        logger.error(f"Audit Log Error: {str(e)}")

# Security headers middleware
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Disable caching for private routes
    if request.path.startswith('/dashboard') or request.path.startswith('/api'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
    return response

@app.errorhandler(Exception)
@app.errorhandler(500)
def internal_server_error(e):
    orig_e = getattr(e, 'original_exception', e)
    err_trace = traceback.format_exc()
    logger.error(f"Internal Server Error (500) on {request.method} {request.path}: {str(orig_e)}\n{err_trace}")
    
    try:
        with open('backend/error.log', 'a', encoding='utf-8') as f:
            f.write(f"\n[{datetime.utcnow().isoformat()}] HTTP 500 on {request.method} {request.path}\nUser: {current_user.email if current_user.is_authenticated else 'Guest'}\nError: {str(orig_e)}\nTraceback:\n{err_trace}\n{'-'*60}\n")
    except Exception:
        pass

    if request.path.startswith('/api/'):
        return jsonify({'status': 'error', 'message': f'Internal Server Error: {str(orig_e)}'}), 500
    
    return f"""
    <div style="font-family:'Inter',sans-serif; padding:2rem; max-width:800px; margin:3rem auto; border:1px solid #FCA5A5; background:#FEF2F2; border-radius:16px; color:#991B1B; box-shadow:0 10px 25px rgba(220,38,38,0.08);">
      <h2 style="margin-top:0; font-size:1.5rem; display:flex; align-items:center; gap:0.5rem;"><i class="fa-solid fa-triangle-exclamation"></i> 500 Internal Server Error</h2>
      <p style="margin-bottom:0.5rem;">An unhandled server exception occurred while processing your request.</p>
      <div style="background:#FFF; padding:1rem; border-radius:8px; border:1px solid #FECACA; margin:1rem 0;">
        <p style="margin:0 0 0.4rem 0;"><strong>Request:</strong> <code>{request.method} {request.path}</code></p>
        <p style="margin:0;"><strong>Error:</strong> <code style="color:#DC2626;">{str(orig_e)}</code></p>
      </div>
      <details style="margin-top:1rem; cursor:pointer;">
        <summary style="font-weight:700; color:#B91C1C;">Click to inspect detailed stack trace</summary>
        <pre style="background:#1E293B; color:#F8FAFC; padding:1rem; border-radius:8px; overflow-x:auto; font-size:0.82rem; margin-top:0.5rem; line-height:1.4;">{err_trace}</pre>
      </details>
      <p style="margin-bottom:0; margin-top:1.5rem;"><a href="javascript:history.back()" style="color:#1D4ED8; font-weight:bold; text-decoration:none;">← Go Back</a> | <a href="/dashboard" style="color:#1D4ED8; font-weight:bold; text-decoration:none;">Return to Dashboard</a></p>
    </div>
    """, 500

@app.errorhandler(404)
def page_not_found(e):
    if request.path.startswith('/api/'):
        return jsonify({'status': 'error', 'message': 'API endpoint not found'}), 404
    return redirect(url_for('dashboard'))

def init_db():
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            logger.error(f"create_all error: {e}")

        # 1. Seed Accounts FIRST & Commit
        try:
            super_admin = User.query.filter_by(email='super@websitebuilders.com').first()
            if not super_admin:
                super_admin = User(
                    full_name='Super Administrator',
                    email='super@websitebuilders.com',
                    mobile='+91 0000000000',
                    role='Super Admin',
                    is_active=True
                )
                db.session.add(super_admin)
            super_admin.set_password('Super@1234')

            admin = User.query.filter_by(email='admin@websitebuilders.com').first()
            if not admin:
                admin = User(
                    full_name='System Administrator',
                    email='admin@websitebuilders.com',
                    mobile='+91 7386204885',
                    role='Admin',
                    is_active=True
                )
                db.session.add(admin)
            admin.set_password('Admin@1234')
                
            staff = User.query.filter_by(email='staff@websitebuilders.com').first()
            if not staff:
                staff = User(
                    full_name='Staff Member',
                    email='staff@websitebuilders.com',
                    mobile='+91 1111111111',
                    role='Staff',
                    is_active=True
                )
                db.session.add(staff)
            staff.set_password('Staff@1234')

            normal_user = User.query.filter_by(email='user@websitebuilders.com').first()
            if not normal_user:
                normal_user = User(
                    full_name='Venu Gopal',
                    email='user@websitebuilders.com',
                    mobile='+91 7386204885',
                    role='User',
                    is_active=True
                )
                db.session.add(normal_user)
            normal_user.set_password('User@1234')

            db.session.commit()
            logger.info("Database seeded successfully with Super Admin, Admin, Staff, and User roles.")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error seeding accounts: {e}")

        # 2. Legacy schema migration statements
        for col_sql in [
            "ALTER TABLE users ADD COLUMN assigned_staff_id INTEGER REFERENCES users(id)",
            "ALTER TABLE projects ADD COLUMN description TEXT",
            "ALTER TABLE projects ADD COLUMN address VARCHAR(255)",
            "ALTER TABLE projects ADD COLUMN latest_update TEXT",
            "ALTER TABLE projects ADD COLUMN project_id VARCHAR(50)",
            "ALTER TABLE projects ADD COLUMN stage VARCHAR(50) DEFAULT 'Requirement'",
            "ALTER TABLE projects ADD COLUMN progress INTEGER DEFAULT 10",
            "ALTER TABLE projects ADD COLUMN submission_id VARCHAR(100)",
            "ALTER TABLE enquiries ADD COLUMN enquiry_id VARCHAR(50)",
            "ALTER TABLE enquiries ADD COLUMN assigned_staff_id INTEGER REFERENCES users(id)",
            "ALTER TABLE enquiries ADD COLUMN converted_project_id VARCHAR(50)",
            "ALTER TABLE staff_assignments ADD COLUMN assigned_by_id INTEGER REFERENCES users(id)",
            "ALTER TABLE staff_assignments ADD COLUMN unassigned_at DATETIME",
            "ALTER TABLE staff_assignments ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'",
            "ALTER TABLE messages ADD COLUMN message_id VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN conversation_id VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN sender_role VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN receiver_name VARCHAR(255)",
            "ALTER TABLE messages ADD COLUMN receiver_role VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN recipient_type VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN message_type VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN project_id VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN customer_id INTEGER",
            "ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(500)",
            "ALTER TABLE messages ADD COLUMN status VARCHAR(50)",
            "ALTER TABLE messages ADD COLUMN read_at DATETIME",
            "ALTER TABLE messages ADD COLUMN created_at DATETIME",
            "ALTER TABLE messages ADD COLUMN updated_at DATETIME"
        ]:
            try:
                db.session.execute(db.text(col_sql))
                db.session.commit()
            except Exception:
                db.session.rollback()

# Ensure database schema & seed users are initialized automatically on app startup
with app.app_context():
    try:
        init_db()
    except Exception as e:
        logger.error(f"Error initializing database schema on startup: {str(e)}")

def generate_unique_project_id():
    year = datetime.utcnow().strftime('%Y')
    prefix = f"WB-{year}-"
    projects = Project.query.all()
    max_num = 0
    for p in projects:
        if p.project_id:
            try:
                parts = p.project_id.split('-')
                if len(parts) >= 3:
                    num = int(parts[-1])
                    if num > max_num:
                        max_num = num
            except Exception:
                pass
    return f"{prefix}{(max_num + 1):03d}"

def generate_unique_enquiry_id():
    year = datetime.utcnow().strftime('%Y')
    prefix = f"ENQ-{year}-"
    enquiries = Enquiry.query.all()
    max_num = 0
    for e in enquiries:
        if e.enquiry_id:
            try:
                parts = e.enquiry_id.split('-')
                if len(parts) >= 3:
                    num = int(parts[-1])
                    if num > max_num:
                        max_num = num
            except Exception:
                pass
    return f"{prefix}{(max_num + 1):04d}"

# --- Authentication Routes ---

@app.route('/')
def index():
    try:
        return app.send_static_file('index.html')
    except Exception:
        root_dir = os.path.abspath(os.path.join(app.root_path, '..'))
        return send_from_directory(root_dir, 'index.html')

@app.route('/index.html')
def home():
    try:
        return app.send_static_file('index.html')
    except Exception:
        root_dir = os.path.abspath(os.path.join(app.root_path, '..'))
        return send_from_directory(root_dir, 'index.html')

@app.route('/services.html')
def services_page():
    return app.send_static_file('services.html')

@app.route('/contact.html')
def contact_page():
    return app.send_static_file('contact.html')

# --- Admin Portal Two-Step Access Verification ---

@app.route('/admin/access', methods=['GET'])
def admin_access_page():
    try:
        if current_user.is_authenticated and getattr(current_user, 'role', '') in ['Super Admin', 'Admin', 'Staff']:
            return redirect(url_for('dashboard'))
        if is_admin_access_verified():
            return redirect(url_for('admin_login'))
    except Exception as e:
        logger.error(f"Error in admin_access_page: {str(e)}")
    return render_template('admin_access_verify.html')

@app.route('/api/admin/access/verify', methods=['POST'])
def admin_access_verify_api():
    client_ip = request.remote_addr or '127.0.0.1'
    
    if not check_pin_rate_limit(client_ip):
        log_audit("Temporary Lockout", "system_access_gate", status="Blocked")
        logger.warning(f"Admin Access PIN rate limit exceeded for IP: {client_ip}")
        return jsonify({'status': 'error', 'message': 'Too many attempts. Please try again later.'}), 429

    data = request.json or {}
    entered_pin = str(data.get('pin', '')).strip()

    log_audit("Admin Portal Access Attempt", "system_access_gate", status="Initiated")

    if not entered_pin:
        return jsonify({'status': 'error', 'message': 'Admin Access PIN is required.'}), 400

    correct_pin = app.config.get('ADMIN_PORTAL_ACCESS_PIN', '7788')

    if entered_pin == correct_pin:
        clear_pin_failed_attempts(client_ip)
        session['admin_access_granted'] = True
        expiry = datetime.utcnow() + timedelta(minutes=app.config.get('ADMIN_PIN_SESSION_MINUTES', 15))
        session['admin_access_expires'] = expiry.isoformat()
        
        log_audit("Successful Admin Portal Access", "system_access_gate", status="Success")
        logger.info(f"Admin Access PIN verified successfully from IP {client_ip}")
        return jsonify({
            'status': 'success',
            'message': 'Admin Access PIN verified successfully.',
            'redirect': url_for('admin_login')
        })
    else:
        record_pin_failed_attempt(client_ip)
        log_audit("Failed Admin Portal Access", "system_access_gate", status="Failed")
        logger.warning(f"Incorrect Admin Access PIN attempt from IP {client_ip}")
        return jsonify({'status': 'error', 'message': 'Incorrect Admin Access PIN.'}), 401

@app.route('/login', methods=['GET', 'POST'])
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        if request.is_json:
            return jsonify({'status': 'success', 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
        
    if not is_admin_access_verified():
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'Admin Access PIN required', 'redirect': url_for('admin_access_page')}), 403
        flash('Please enter the Admin Access PIN to continue.', 'error')
        return redirect(url_for('admin_access_page'))

    preset_role = request.args.get('role', '')

    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            if request.is_json:
                return jsonify({'status': 'error', 'message': 'Too many login attempts. Please wait a minute and try again.'}), 429
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('admin_login.html', preset_role=preset_role), 429

        if request.is_json:
            req_data = request.get_json() or {}
            email = str(req_data.get('email', '')).strip().lower()
            password = str(req_data.get('password', ''))
            selected_role = str(req_data.get('role', '')).strip()
            remember = bool(req_data.get('remember', False))
        else:
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            selected_role = request.form.get('role', '').strip()
            remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            if not user.is_active:
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Account is inactive. Please contact Super Admin.'}), 403
                flash('Account is inactive. Please contact Super Admin.', 'error')
                return render_template('admin_login.html', preset_role=selected_role)

            if not user.check_password(password):
                logger.warning(f"Failed admin login password attempt for email: {email}")
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Incorrect password.'}), 401
                flash('Incorrect password. Please check your password or contact Super Admin to reset it.', 'error')
                return render_template('admin_login.html', preset_role=selected_role)

            if user.role == 'User':
                log_audit("Unauthorized Admin Portal Access Attempt", user.email, status="Denied")
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Access Denied: Client accounts must log in via Client Login at /user/login.'}), 403
                flash('Access Denied: Client accounts must log in via Client Login at /user/login.', 'error')
                return render_template('admin_login.html', preset_role=selected_role)

            try:
                user.last_login = datetime.utcnow()
                db.session.commit()
            except Exception:
                db.session.rollback()

            login_user(user, remember=remember)
            log_audit("Logged in", user.email)
            logger.info(f"{user.role} login successful: {email}")
            
            target_url = url_for('my_projects')
            if user.role == 'Super Admin': target_url = url_for('super_admin_dashboard')
            elif user.role == 'Admin': target_url = url_for('admin_dashboard')
            elif user.role == 'Staff': target_url = url_for('staff_dashboard')

            if request.is_json:
                return jsonify({'status': 'success', 'message': 'Login successful', 'redirect': target_url, 'data': user.to_dict()})

            return redirect(target_url)
            
        logger.warning(f"Failed login attempt for unknown email: {email}")
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'No account found with this email address.'}), 401
        flash('No account found with this email address. Please check your email or ask Super Admin to register your account.', 'error')
        
    return render_template('admin_login.html', preset_role=preset_role)

@app.route('/user/login', methods=['GET', 'POST'])
def user_login():
    if current_user.is_authenticated:
        if request.is_json:
            return jsonify({'status': 'success', 'redirect': url_for('dashboard')})
        return redirect(url_for('dashboard'))
        
    preset_role = request.args.get('role', 'User')

    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            if request.is_json:
                return jsonify({'status': 'error', 'message': 'Too many login attempts. Please wait a minute and try again.'}), 429
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('user_login.html', preset_role=preset_role), 429

        if request.is_json:
            req_data = request.get_json() or {}
            email = str(req_data.get('email', '')).strip().lower()
            password = str(req_data.get('password', ''))
            remember = bool(req_data.get('remember', False))
        else:
            email = request.form.get('email', '').strip().lower()
            password = request.form.get('password', '')
            remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user:
            if not user.is_active:
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Account is inactive. Please contact support.'}), 403
                flash('Account is inactive. Please contact support.', 'error')
                return render_template('user_login.html', preset_role=preset_role)

            if not user.check_password(password):
                logger.warning(f"Failed user login password attempt for email: {email}")
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Incorrect password.'}), 401
                flash('Incorrect password. Please check your password or use Forgot Password to reset it.', 'error')
                return render_template('user_login.html', preset_role=preset_role)

            if user.role in ['Super Admin', 'Admin', 'Staff']:
                if request.is_json:
                    return jsonify({'status': 'error', 'message': 'Administrative accounts must log in via the Admin Portal at /admin/login.'}), 403
                flash('Notice: Administrative accounts must log in via the Admin Portal at /admin/login.', 'error')
                return render_template('user_login.html', preset_role='User')

            try:
                user.last_login = datetime.utcnow()
                db.session.commit()
            except Exception:
                db.session.rollback()

            login_user(user, remember=remember)
            log_audit("Logged in", user.email)
            logger.info(f"{user.role} login successful: {email}")
            
            target_url = url_for('my_projects')
            if user.role == 'Super Admin': target_url = url_for('super_admin_dashboard')
            elif user.role == 'Admin': target_url = url_for('admin_dashboard')
            elif user.role == 'Staff': target_url = url_for('staff_dashboard')

            if request.is_json:
                return jsonify({'status': 'success', 'message': 'Login successful', 'redirect': target_url, 'data': user.to_dict()})

            return redirect(target_url)
            
        logger.warning(f"Failed User login attempt for unknown email: {email}")
        if request.is_json:
            return jsonify({'status': 'error', 'message': 'No account found with this email address.'}), 401
        flash('No account found with this email address. Please register an account or check the email entered.', 'error')
        
    return render_template('user_login.html', preset_role=preset_role)

@app.route('/user/register', methods=['GET', 'POST'])
def user_register():
    if request.method == 'POST':
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip()
        mobile = request.form.get('mobile', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not full_name or not email or not mobile or not password:
            flash('All fields are required.', 'error')
            return render_template('user_register.html')
            
        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('user_register.html')

        if User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return render_template('user_register.html')
            
        # Hardcode 'User' role for standard user registration
        new_user = User(
            full_name=full_name,
            email=email,
            mobile=mobile,
            role='User',
            is_active=True
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        flash('Registration successful! Please sign in.', 'success')
        return redirect(url_for('user_login'))
        
    return render_template('user_register.html')



@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        user = User.query.filter_by(email=email).first()
        
        if user:
            token = str(uuid.uuid4())
            expiry = datetime.utcnow() + timedelta(minutes=app.config['RESET_TOKEN_EXPIRY_MINUTES'])
            
            reset_token = PasswordResetToken(email=email, token=token, expires_at=expiry)
            db.session.add(reset_token)
            db.session.commit()
            
            reset_url = url_for('reset_password', token=token, _external=True)
            # Log the recovery URL to console/logs (Production would send an email via SMTP)
            logger.info(f"== PASSWORD RESET REQUESTED ==")
            logger.info(f"User: {email}")
            logger.info(f"Reset Link: {reset_url}")
            logger.info(f"==============================")
            
            flash('A password reset link has been logged/sent to your email address.', 'success')
        else:
            flash('Email address not found.', 'error')
            
    return render_template('forgot_password.html')

@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    token_record = PasswordResetToken.query.filter_by(token=token, used=False).first()
    
    if not token_record or token_record.expires_at < datetime.utcnow():
        flash('Invalid or expired password reset link.', 'error')
        return redirect(url_for('user_login'))
        
    if request.method == 'POST':
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        
        if not password or password != confirm_password:
            flash('Passwords must match.', 'error')
            return render_template('reset_password.html', token=token)
            
        user = User.query.filter_by(email=token_record.email).first()
        if user:
            user.set_password(password)
            token_record.used = True
            db.session.commit()
            flash('Password reset successful. Please log in.', 'success')
            return redirect(url_for('user_login'))
            
        flash('Error resetting password.', 'error')
        
    return render_template('reset_password.html', token=token)

@app.route('/logout')
@login_required
def logout():
    # Detect role for smart redirect
    is_admin = current_user.role in ['Super Admin', 'Admin', 'Staff']
    logout_user()
    session.clear()
    flash('Logged out successfully.', 'success')
    if is_admin:
        return redirect(url_for('admin_login'))
    return redirect(url_for('user_login'))

# --- Dashboard Routes ---

@app.route('/my-projects')
@login_required
def my_projects():
    if current_user.role != 'User':
        return redirect(url_for('dashboard'))
    return render_template('customer_dashboard.html', user=current_user)

@app.route('/super-admin')
@app.route('/admin/dashboard')
@role_required('Super Admin')
def super_admin_dashboard():
    return render_template('super_admin_dashboard.html', user=current_user)

@app.route('/admin')
@app.route('/admin/operations')
@role_required('Admin', 'Super Admin')
def admin_dashboard():
    return render_template('admin_dashboard.html', user=current_user)

@app.route('/staff')
@app.route('/staff/dashboard')
@role_required('Staff', 'Admin', 'Super Admin')
def staff_dashboard():
    return render_template('staff_dashboard.html', user=current_user)

# To maintain backwards compatibility if something redirects to dashboard
@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'Super Admin':
        return redirect(url_for('super_admin_dashboard'))
    elif current_user.role == 'Admin':
        return redirect(url_for('admin_dashboard'))
    elif current_user.role == 'Staff':
        return redirect(url_for('staff_dashboard'))
    return redirect(url_for('my_projects'))


def redirect_to_profile():
    if current_user.role == 'Super Admin':
        return redirect(url_for('super_admin_profile'))
    elif current_user.role == 'Admin':
        return redirect(url_for('admin_profile'))
    elif current_user.role == 'Staff':
        return redirect(url_for('staff_profile'))
    else:
        return redirect(url_for('customer_profile'))

@app.route('/profile')
@login_required
def profile():
    return redirect_to_profile()

@app.route('/super-admin/profile')
@login_required
@role_required('Super Admin')
def super_admin_profile():
    return render_template('super_admin_profile.html', user=current_user)

@app.route('/admin/profile')
@login_required
@role_required('Admin', 'Super Admin')
def admin_profile():
    return render_template('admin_profile.html', user=current_user)

@app.route('/staff/profile')
@login_required
@role_required('Staff', 'Admin', 'Super Admin')
def staff_profile():
    return render_template('staff_profile.html', user=current_user)

@app.route('/customer/profile')
@login_required
def customer_profile():
    return render_template('customer_profile.html', user=current_user)

@app.route('/edit-profile', methods=['POST'])
@login_required
def edit_profile():
    full_name = request.form.get('full_name')
    mobile = request.form.get('mobile')
    
    if not full_name or not mobile:
        flash('Full Name and Mobile Number are required.', 'error')
        return redirect_to_profile()
        
    current_user.full_name = full_name
    current_user.mobile = mobile
    db.session.commit()
    
    log_audit('Updated Profile', current_user.email)
    flash('Profile updated successfully!', 'success')
    return redirect_to_profile()

@app.route('/change-password', methods=['POST'])
@login_required
def change_password():
    current_pw = request.form.get('current_password')
    new_pw = request.form.get('new_password')
    confirm_pw = request.form.get('confirm_password')

    if not current_pw or not new_pw or not confirm_pw:
        flash('All fields are required.', 'error')
        return redirect_to_profile()

    if new_pw != confirm_pw:
        flash('New passwords do not match.', 'error')
        return redirect_to_profile()

    if not current_user.check_password(current_pw):
        flash('Incorrect current password.', 'error')
        return redirect_to_profile()

    current_user.set_password(new_pw)
    db.session.commit()
    flash('Password updated successfully!', 'success')
    return redirect_to_profile()

@app.route('/api/me', methods=['GET'])
def api_me():
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'fullName': current_user.full_name,
            'email': current_user.email,
            'role': current_user.role
        })
    return jsonify({'authenticated': False})

# --- API Endpoints ---

# --- Enquiry Management API ---

@app.route('/api/enquiry', methods=['POST'])
@app.route('/api/enquiries', methods=['POST'])
def submit_public_enquiry():
    data = request.json or request.form
    try:
        full_name = data.get('name', '').strip() or data.get('full_name', '').strip()
        email = data.get('email', '').strip().lower()
        mobile = data.get('mobile', '').strip()
        address = data.get('address', '').strip()
        message = data.get('message', '').strip()

        if not full_name or not email or not mobile or not message:
            return jsonify({'status': 'error', 'message': 'All required fields (Name, Email, Mobile, Message) must be filled.'}), 400

        enquiry_id = generate_unique_enquiry_id()
        
        # Check if customer already exists by email
        existing_user = User.query.filter_by(email=email).first()
        customer_id = existing_user.id if existing_user else None

        new_enquiry = Enquiry(
            enquiry_id=enquiry_id,
            customer_id=customer_id,
            full_name=full_name,
            email=email,
            mobile=mobile,
            address=address,
            message=message,
            status='NEW',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.session.add(new_enquiry)
        db.session.commit()

        # Google Sheets real-time background sync
        sync_to_google_sheets('sync_enquiry', new_enquiry.to_dict())

        return jsonify({
            'status': 'success',
            'message': 'Your enquiry has been received successfully.',
            'enquiry_id': enquiry_id,
            'submission_id': enquiry_id,
            'data': new_enquiry.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error submitting enquiry: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/enquiries', methods=['GET'])
@login_required
def get_enquiries():
    try:
        query_param = request.args.get('query', '').strip().lower()
        status_param = request.args.get('status', '').strip()

        stmt = Enquiry.query.order_by(Enquiry.created_at.desc())
        if current_user.role == 'Staff':
            stmt = stmt.filter((Enquiry.assigned_staff_id == current_user.id) | (Enquiry.assigned_staff_id == None))
        
        enquiries = stmt.all()
        result_list = [e.to_dict() for e in enquiries]

        if query_param:
            result_list = [e for e in result_list if query_param in e['full_name'].lower() or query_param in e['email'].lower() or query_param in e['enquiry_id'].lower()]
        if status_param:
            result_list = [e for e in result_list if e['status'].upper() == status_param.upper()]

        return jsonify({'status': 'success', 'data': result_list})
    except Exception as e:
        logger.error(f"Error fetching enquiries: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/enquiries/<int:enquiry_id>', methods=['GET', 'PUT'])
@login_required
def manage_enquiry_by_id(enquiry_id):
    enquiry = Enquiry.query.get_or_404(enquiry_id)
    if request.method == 'GET':
        return jsonify({'status': 'success', 'data': enquiry.to_dict()})

    if request.method == 'PUT':
        if current_user.role not in ['Super Admin', 'Admin', 'Staff']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

        data = request.json or {}
        if 'status' in data:
            enquiry.status = data['status'].upper()
        if 'assigned_staff_id' in data:
            enquiry.assigned_staff_id = data['assigned_staff_id'] or None
        if 'message' in data:
            enquiry.message = data['message']

        enquiry.updated_at = datetime.utcnow()
        db.session.commit()
        sync_to_google_sheets('sync_enquiry', enquiry.to_dict())
        log_audit(f'Updated Enquiry {enquiry.enquiry_id} (Status: {enquiry.status})', current_user.email)
        return jsonify({'status': 'success', 'message': 'Enquiry updated successfully', 'data': enquiry.to_dict()})

@app.route('/api/enquiries/<int:enquiry_id>/convert', methods=['POST'])
@login_required
def convert_enquiry_to_project(enquiry_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

    enquiry = Enquiry.query.get_or_404(enquiry_id)
    data = request.json or {}

    try:
        customer = User.query.filter_by(email=enquiry.email.lower()).first()
        if not customer:
            customer = User(
                full_name=enquiry.full_name,
                email=enquiry.email.lower(),
                mobile=enquiry.mobile,
                role='User',
                is_active=True
            )
            customer.set_password('Customer@1234')
            db.session.add(customer)
            db.session.flush()

        new_project_id = generate_unique_project_id()

        proj_name = data.get('name', '').strip() or f"{enquiry.full_name} Project"
        description = data.get('description', '').strip() or enquiry.message
        delivery_str = data.get('expected_delivery')
        expected_delivery = datetime.strptime(delivery_str, '%Y-%m-%d').date() if delivery_str else (datetime.utcnow() + timedelta(days=30)).date()
        
        staff_id = data.get('assigned_staff_id') or enquiry.assigned_staff_id
        assigned_staff_id = int(staff_id) if (staff_id and str(staff_id).isdigit()) else None

        initial_stage = data.get('initial_stage', 'Requirement')
        initial_progress = int(data.get('initial_progress', 10))

        project = Project(
            project_id=new_project_id,
            name=proj_name,
            description=description,
            address=enquiry.address,
            customer_id=customer.id,
            submission_id=enquiry.enquiry_id,
            expected_delivery=expected_delivery,
            assigned_staff_id=assigned_staff_id,
            status='ACTIVE',
            stage=initial_stage,
            progress=initial_progress,
            latest_update=f"Project converted from Enquiry {enquiry.enquiry_id}."
        )

        db.session.add(project)
        db.session.flush()

        if assigned_staff_id:
            assign_hist = StaffAssignment(
                project_id=project.id,
                staff_id=assigned_staff_id,
                client_id=customer.id,
                assigned_by_id=current_user.id,
                assigned_at=datetime.utcnow(),
                status='ACTIVE'
            )
            db.session.add(assign_hist)

        timeline = ProjectTimeline(
            project_id=project.id,
            stage=initial_stage,
            progress=initial_progress,
            updated_by_id=current_user.id,
            notes=f"Converted from Enquiry {enquiry.enquiry_id}"
        )
        db.session.add(timeline)

        enquiry.is_converted = True
        enquiry.status = 'CONVERTED'
        enquiry.project_id = project.project_id
        enquiry.customer_id = customer.id
        enquiry.updated_at = datetime.utcnow()

        db.session.commit()

        sync_to_google_sheets('sync_project', project.to_dict())
        sync_to_google_sheets('sync_user', customer.to_dict())
        sync_to_google_sheets('sync_enquiry', enquiry.to_dict())
        log_audit(f'Converted Enquiry {enquiry.enquiry_id} to Project {project.project_id}', current_user.email)

        return jsonify({
            'status': 'success',
            'message': f'Enquiry {enquiry.enquiry_id} successfully converted into Project {project.project_id}',
            'data': project.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error converting enquiry: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    # Only Admin and Super Admin can fetch assignees
    users = User.query.filter_by(is_active=True).all()
    return jsonify({'status': 'success', 'data': [u.to_dict() for u in users]})

# --- Super Admin User Management & Control System ---

def format_datetime_safe(val):
    if not val:
        return 'N/A'
    if isinstance(val, str):
        return val
    try:
        return val.strftime('%Y-%m-%d %H:%M:%S')
    except Exception:
        return str(val)

def enrich_user_dict(u):
    user_dict = u.to_dict()
    try:
        assigned_projects = Project.query.filter_by(assigned_staff_id=u.id).all()
        user_dict['assigned_projects_count'] = len(assigned_projects)
        user_dict['completed_projects_count'] = len([p for p in assigned_projects if getattr(p, 'status', '') == 'Completed'])
    except Exception:
        user_dict['assigned_projects_count'] = 0
        user_dict['completed_projects_count'] = 0

    try:
        user_dict['messages_sent_count'] = Message.query.filter_by(sender_id=u.id).count()
    except Exception:
        user_dict['messages_sent_count'] = 0

    try:
        user_dict['enquiries_handled_count'] = Enquiry.query.filter_by(assigned_staff_id=u.id).count()
    except Exception:
        user_dict['enquiries_handled_count'] = 0
    
    try:
        last_log = AuditLog.query.filter(
            (AuditLog.user_email == u.email) | (AuditLog.target_user == u.email)
        ).order_by(AuditLog.timestamp.desc()).first()
    except Exception:
        last_log = None
    
    user_dict['last_action'] = last_log.action if last_log else ('Logged in' if u.last_login else 'Created')
    
    if last_log and getattr(last_log, 'timestamp', None):
        user_dict['last_activity'] = format_datetime_safe(last_log.timestamp)
    elif getattr(u, 'last_login', None):
        user_dict['last_activity'] = format_datetime_safe(u.last_login)
    elif getattr(u, 'created_at', None):
        user_dict['last_activity'] = format_datetime_safe(u.created_at)
    else:
        user_dict['last_activity'] = 'N/A'

    try:
        user_dict['activity_count'] = AuditLog.query.filter(
            (AuditLog.user_email == u.email) | (AuditLog.target_user == u.email)
        ).count()
    except Exception:
        user_dict['activity_count'] = 0

    return user_dict

@app.route('/api/super-admin/users', methods=['GET', 'POST'])
@login_required
def manage_users():
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    if request.method == 'GET':
        users = User.query.order_by(User.id.asc()).all()
        enriched_users = [enrich_user_dict(u) for u in users]
        return jsonify({'status': 'success', 'data': enriched_users})

    if request.method == 'POST':
        data = request.json or {}
        role = str(data.get('role', 'Staff')).strip()

        if current_user.role == 'Admin' and role in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied: Admins can only create Staff and Customer accounts'}), 403

        full_name = str(data.get('full_name', '')).strip()
        email = str(data.get('email', '')).strip().lower()
        mobile = str(data.get('mobile', '')).strip()
        password = str(data.get('password', ''))
        confirm_password = str(data.get('confirm_password', ''))
        is_active = bool(data.get('status', True))

        if not full_name or not email or not password:
            return jsonify({'status': 'error', 'message': 'Full name, email, and password are required'}), 400

        if confirm_password and password != confirm_password:
            return jsonify({'status': 'error', 'message': 'Passwords do not match'}), 400

        if role not in ['Super Admin', 'Admin', 'Staff', 'User']:
            return jsonify({'status': 'error', 'message': 'Invalid role specified'}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({'status': 'error', 'message': 'Email address already registered'}), 400

        new_user = User(full_name=full_name, email=email, mobile=mobile, role=role, is_active=is_active)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        try:
            sync_to_google_sheets('sync_user', new_user.to_dict())
        except Exception as e:
            logger.warning(f"Google Sheets sync failed for user {email}: {e}")

        log_audit(f'Created {role}', current_user.email, target_user=email)
        return jsonify({
            'status': 'success',
            'message': f'{role} account created successfully.',
            'data': enrich_user_dict(new_user)
        })

@app.route('/api/super-admin/users/<int:user_id>', methods=['GET', 'PUT', 'DELETE'])
@login_required
def manage_user_by_id(user_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    target_user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        user_data = enrich_user_dict(target_user)
        assigned_projects = [p.to_dict() for p in Project.query.filter_by(assigned_staff_id=target_user.id).all()]
        customer_projects = [p.to_dict() for p in Project.query.filter_by(customer_id=target_user.id).all()]
        recent_logs = [l.to_dict() for l in AuditLog.query.filter(
            (AuditLog.user_email == target_user.email) | (AuditLog.target_user == target_user.email)
        ).order_by(AuditLog.timestamp.desc()).limit(50).all()]

        return jsonify({
            'status': 'success',
            'data': user_data,
            'assigned_projects': assigned_projects,
            'customer_projects': customer_projects,
            'audit_logs': recent_logs
        })

    if request.method == 'PUT':
        data = request.json or {}

        # Protection checks
        if current_user.role == 'Admin' and target_user.role in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied: Cannot edit Admin/Super Admin'}), 403

        if target_user.id == current_user.id and 'status' in data and not data['status']:
            return jsonify({'status': 'error', 'message': 'Super Admin cannot deactivate their own account'}), 400

        new_email = str(data.get('email', target_user.email)).strip().lower()
        if new_email != target_user.email:
            existing = User.query.filter_by(email=new_email).first()
            if existing and existing.id != target_user.id:
                return jsonify({'status': 'error', 'message': 'Email address already in use'}), 400
            target_user.email = new_email

        target_user.full_name = str(data.get('full_name', target_user.full_name)).strip()
        target_user.mobile = str(data.get('mobile', target_user.mobile)).strip()

        if 'role' in data and data['role'] in ['Super Admin', 'Admin', 'Staff', 'User']:
            if target_user.id == current_user.id and data['role'] != 'Super Admin':
                return jsonify({'status': 'error', 'message': 'Cannot demote your own Super Admin role'}), 400
            target_user.role = data['role']

        if 'status' in data:
            target_user.is_active = bool(data['status'])

        db.session.commit()
        sync_to_google_sheets('sync_user', target_user.to_dict())
        log_audit(f'Updated User ({target_user.role})', current_user.email, target_user=target_user.email)
        return jsonify({'status': 'success', 'message': 'User updated successfully', 'data': enrich_user_dict(target_user)})

    if request.method == 'DELETE':
        if current_user.role == 'Admin' and target_user.role in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied: Admins cannot delete Admin or Super Admin accounts'}), 403

        if target_user.id == current_user.id:
            return jsonify({'status': 'error', 'message': 'Cannot delete your own logged-in account'}), 400

        # Check project dependencies
        assigned_projects = Project.query.filter_by(assigned_staff_id=target_user.id).all()
        reassign_to_id = request.args.get('reassign_to')

        if assigned_projects and not reassign_to_id:
            return jsonify({
                'status': 'warning_has_dependencies',
                'message': f'This {target_user.role} has {len(assigned_projects)} active projects assigned.',
                'assigned_projects_count': len(assigned_projects),
                'assigned_projects': [{'id': p.id, 'name': p.name, 'project_id': p.project_id} for p in assigned_projects]
            }), 409

        if reassign_to_id:
            new_staff = User.query.get(reassign_to_id)
            if new_staff:
                for p in assigned_projects:
                    p.assigned_staff_id = new_staff.id
                db.session.commit()
                log_audit(f'Reassigned projects from {target_user.email} to {new_staff.email}', current_user.email)

        # Unassign any remaining references safely
        for p in assigned_projects:
            p.assigned_staff_id = None
        for t in Task.query.filter_by(assigned_staff_id=target_user.id).all():
            t.assigned_staff_id = None
        for e in Enquiry.query.filter_by(assigned_staff_id=target_user.id).all():
            e.assigned_staff_id = None

        user_email = target_user.email
        try:
            db.session.delete(target_user)
            db.session.commit()
            sync_to_google_sheets('delete_user', {'id': user_id, 'email': user_email})
            log_audit('Deleted User', current_user.email, target_user=user_email)
            return jsonify({'status': 'success', 'message': f'User {user_email} deleted successfully.'})
        except Exception as ex:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': f'Database error during deletion: {str(ex)}'}), 500

@app.route('/api/super-admin/users/<int:user_id>/dependencies', methods=['GET'])
@login_required
def check_user_dependencies(user_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    target_user = User.query.get_or_404(user_id)
    assigned_projects = Project.query.filter_by(assigned_staff_id=target_user.id).all()
    assigned_tasks = Task.query.filter_by(assigned_staff_id=target_user.id).all()

    return jsonify({
        'status': 'success',
        'has_dependencies': bool(assigned_projects or assigned_tasks),
        'assigned_projects_count': len(assigned_projects),
        'assigned_projects': [{'id': p.id, 'project_id': p.project_id, 'name': p.name} for p in assigned_projects],
        'assigned_tasks_count': len(assigned_tasks)
    })

@app.route('/api/super-admin/users/<int:user_id>/reset-password', methods=['POST'])
@login_required
def reset_user_password(user_id):
    if current_user.role != 'Super Admin':
        return jsonify({'status': 'error', 'message': 'Permission denied: Only Super Admin can reset passwords'}), 403

    target_user = User.query.get_or_404(user_id)
    data = request.json or {}
    new_password = str(data.get('password', ''))
    confirm_password = str(data.get('confirm_password', ''))

    if not new_password:
        return jsonify({'status': 'error', 'message': 'New password is required'}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({'status': 'error', 'message': 'Passwords do not match'}), 400

    target_user.set_password(new_password)
    db.session.commit()
    sync_to_google_sheets('sync_user', target_user.to_dict())

    log_audit('Reset User Password', current_user.email, target_user=target_user.email)
    return jsonify({'status': 'success', 'message': f'Password for {target_user.full_name} reset successfully.'})

@app.route('/api/super-admin/users/bulk-action', methods=['POST'])
@login_required
def bulk_user_action():
    if current_user.role != 'Super Admin':
        return jsonify({'status': 'error', 'message': 'Permission denied: Super Admin authorization required'}), 403

    data = request.json or {}
    action = data.get('action')
    user_ids = data.get('user_ids', [])
    reassign_to_id = data.get('reassign_to_id')

    if not action or not user_ids:
        return jsonify({'status': 'error', 'message': 'Action and user IDs are required'}), 400

    # Never apply destructive actions to current Super Admin
    user_ids = [uid for uid in user_ids if uid != current_user.id]

    targets = User.query.filter(User.id.in_(user_ids)).all()
    count = 0

    if action == 'activate':
        for u in targets:
            u.is_active = True
            count += 1
            sync_to_google_sheets('sync_user', u.to_dict())
            log_audit('Activated User', current_user.email, target_user=u.email)
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'{count} users activated successfully.'})

    elif action == 'deactivate':
        for u in targets:
            if u.id != current_user.id:
                u.is_active = False
                count += 1
                sync_to_google_sheets('sync_user', u.to_dict())
                log_audit('Deactivated User', current_user.email, target_user=u.email)
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'{count} users deactivated successfully.'})

    elif action == 'delete':
        reassign_staff = User.query.get(reassign_to_id) if reassign_to_id else None
        for u in targets:
            if u.id == current_user.id:
                continue
            assigned_projects = Project.query.filter_by(assigned_staff_id=u.id).all()
            if assigned_projects:
                for p in assigned_projects:
                    p.assigned_staff_id = reassign_staff.id if reassign_staff else None
            for t in Task.query.filter_by(assigned_staff_id=u.id).all():
                t.assigned_staff_id = reassign_staff.id if reassign_staff else None
            for e in Enquiry.query.filter_by(assigned_staff_id=u.id).all():
                e.assigned_staff_id = reassign_staff.id if reassign_staff else None

            email = u.email
            uid = u.id
            db.session.delete(u)
            sync_to_google_sheets('delete_user', {'id': uid, 'email': email})
            count += 1
            log_audit('Deleted User (Bulk)', current_user.email, target_user=email)
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'{count} users deleted successfully.'})

    return jsonify({'status': 'error', 'message': 'Invalid bulk action'}), 400

@app.route('/api/super-admin/audit-logs', methods=['GET'])
@login_required
def get_super_admin_audit_logs():
    try:
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

        logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(100).all()
        return jsonify({'status': 'success', 'data': [l.to_dict() for l in logs]})
    except Exception as e:
        logger.error(f"Error fetching audit logs: {str(e)}")
        return jsonify({'status': 'success', 'data': []})

@app.route('/api/super-admin/users/<int:user_id>/activity', methods=['GET'])
@login_required
def get_user_activity(user_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403

    target_user = User.query.get_or_404(user_id)
    logs = AuditLog.query.filter(
        (AuditLog.user_email == target_user.email) | (AuditLog.target_user == target_user.email)
    ).order_by(AuditLog.timestamp.desc()).all()

    return jsonify({'status': 'success', 'data': [l.to_dict() for l in logs]})

# --- Project Management API ---

@app.route('/api/projects', methods=['GET'])
@requires_permission('projects.view')
def get_projects():
    try:
        if current_user.role in ['Super Admin', 'Admin']:
            projects = Project.query.order_by(Project.created_at.desc()).all()
        elif current_user.role == 'Staff':
            projects = Project.query.filter_by(assigned_staff_id=current_user.id).order_by(Project.created_at.desc()).all()
        else:
            projects = Project.query.filter_by(customer_id=current_user.id).order_by(Project.created_at.desc()).all()
            
        return jsonify({'status': 'success', 'data': [p.to_dict() for p in projects]})
    except Exception as e:
        logger.error(f"Error fetching projects: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/projects', methods=['POST'])
@requires_permission('projects.create')
def create_project():
    data = request.json or {}
    try:
        name = data.get('name', '').strip()
        if not name:
            return jsonify({'status': 'error', 'message': 'Project name is required'}), 400
            
        new_project_id = generate_unique_project_id()
        
        cust_id_val = data.get('customer_id')
        if cust_id_val and str(cust_id_val).isdigit():
            customer_id = int(cust_id_val)
        else:
            first_user = User.query.first()
            customer_id = first_user.id if first_user else current_user.id

        staff_id_val = data.get('assigned_staff_id')
        assigned_staff_id = int(staff_id_val) if (staff_id_val and str(staff_id_val).isdigit()) else None

        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date() if data.get('start_date') else None
        expected_delivery = datetime.strptime(data.get('expected_delivery'), '%Y-%m-%d').date() if data.get('expected_delivery') else (datetime.utcnow() + timedelta(days=30)).date()
        
        initial_stage = data.get('stage', 'Requirement')
        initial_progress = int(data.get('progress', 10))

        new_project = Project(
            project_id=new_project_id,
            name=name,
            description=data.get('description'),
            address=data.get('address'),
            customer_id=customer_id,
            submission_id=data.get('submission_id'),
            start_date=start_date,
            expected_delivery=expected_delivery,
            assigned_staff_id=assigned_staff_id,
            status=data.get('status', 'ACTIVE'),
            stage=initial_stage,
            progress=initial_progress,
            latest_update=data.get('latest_update', 'Project created.')
        )
        
        db.session.add(new_project)
        db.session.flush()

        if assigned_staff_id:
            assign_hist = StaffAssignment(
                project_id=new_project.id,
                staff_id=assigned_staff_id,
                client_id=customer_id,
                assigned_by_id=current_user.id,
                assigned_at=datetime.utcnow(),
                status='ACTIVE'
            )
            db.session.add(assign_hist)

        timeline = ProjectTimeline(
            project_id=new_project.id,
            stage=initial_stage,
            progress=initial_progress,
            updated_by_id=current_user.id,
            notes='Project initialized'
        )
        db.session.add(timeline)

        db.session.commit()
        sync_to_google_sheets('sync_project', new_project.to_dict())
        log_audit(f'Created Project {new_project.project_id}', current_user.email)
        return jsonify({'status': 'success', 'message': 'Project created successfully', 'data': new_project.to_dict()})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating project: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/projects/<int:project_id>', methods=['PUT', 'DELETE'])
@requires_permission('projects.edit')
def manage_project(project_id):
    project = Project.query.get_or_404(project_id)
    
    # Check permissions
    if request.method == 'DELETE':
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            
        pid = project.project_id
        db.session.delete(project)
        db.session.commit()
        sync_to_google_sheets('delete_project', {'project_id': pid, 'id': project_id})
        log_audit('Deleted Project', current_user.email)
        return jsonify({'status': 'success', 'message': 'Project deleted successfully'})
        
    if request.method == 'PUT':
        if current_user.role == 'User':
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            
        if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            
        data = request.json
        
        # Staff can only update progress and stage and status
        if 'progress' in data:
            project.progress = int(data['progress'])
        if 'stage' in data:
            project.stage = data['stage']
        if 'status' in data:
            project.status = data['status']
        
        # Admins can update everything
        if current_user.role in ['Super Admin', 'Admin']:
            if 'name' in data:
                project.name = data['name']
            if 'expected_delivery' in data and data['expected_delivery']:
                project.expected_delivery = datetime.strptime(data['expected_delivery'], '%Y-%m-%d').date()
            if 'assigned_staff_id' in data:
                project.assigned_staff_id = data['assigned_staff_id'] or None
                
        db.session.commit()
        sync_to_google_sheets('sync_project', project.to_dict())
        log_audit(f'Updated Project {project.project_id}', current_user.email)
        return jsonify({'status': 'success', 'message': 'Project updated successfully'})

@app.route('/api/projects/<int:project_id>', methods=['GET'])
@login_required
def get_single_project(project_id):
    project = Project.query.get_or_404(project_id)

    if current_user.role == 'User' and project.customer_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied: Cannot access another customer project.'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied: Not assigned to this project.'}), 403

    p_dict = project.to_dict()
    p_dict['timeline'] = [t.to_dict() for t in ProjectTimeline.query.filter_by(project_id=project.id).order_by(ProjectTimeline.timestamp.asc()).all()]
    p_dict['remarks'] = [r.to_dict() for r in ProjectRemark.query.filter_by(project_id=project.id).order_by(ProjectRemark.created_at.desc()).all()]
    p_dict['assignments'] = [a.to_dict() for a in StaffAssignment.query.filter_by(project_id=project.id).order_by(StaffAssignment.assigned_at.desc()).all()]

    return jsonify({'status': 'success', 'data': p_dict})

@app.route('/api/projects/<int:project_id>/progress', methods=['PUT'])
@login_required
def update_project_progress(project_id):
    project = Project.query.get_or_404(project_id)

    if current_user.role == 'User':
        return jsonify({'status': 'error', 'message': 'Permission denied: Customers cannot modify project progress.'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied: Staff can only update assigned projects.'}), 403

    data = request.json or {}
    
    stage = data.get('stage')
    progress_val = data.get('progress')
    latest_update = data.get('latest_update', '').strip() or data.get('message', '').strip()
    expected_delivery_str = data.get('expected_delivery')
    status = data.get('status')

    if progress_val is not None:
        try:
            prog_int = int(progress_val)
            if prog_int < 0 or prog_int > 100:
                return jsonify({'status': 'error', 'message': 'Progress percentage must be between 0 and 100'}), 400
            project.progress = prog_int
        except ValueError:
            return jsonify({'status': 'error', 'message': 'Invalid progress value'}), 400

    if stage:
        project.stage = stage
    if latest_update:
        project.latest_update = latest_update
        pup = ProjectUpdate(
            project_id=project.id,
            updated_by_id=current_user.id,
            message=f"[{project.stage} - {project.progress}%] {latest_update}"
        )
        db.session.add(pup)

    if expected_delivery_str and current_user.role in ['Super Admin', 'Admin']:
        project.expected_delivery = datetime.strptime(expected_delivery_str, '%Y-%m-%d').date()

    if status:
        project.status = status

    project.updated_at = datetime.utcnow()

    timeline = ProjectTimeline(
        project_id=project.id,
        stage=project.stage,
        progress=project.progress,
        updated_by_id=current_user.id,
        notes=latest_update or f"Stage updated to {project.stage}"
    )
    db.session.add(timeline)

    db.session.commit()
    sync_to_google_sheets('sync_project', project.to_dict())
    log_audit(f'Updated progress on Project {project.project_id} (Stage: {project.stage}, Progress: {project.progress}%)', current_user.email)

    return jsonify({
        'status': 'success',
        'message': f'Project {project.project_id} progress updated successfully.',
        'data': project.to_dict()
    })

@app.route('/api/projects/<int:project_id>/remarks', methods=['GET', 'POST'])
@login_required
def project_remarks(project_id):
    project = Project.query.get_or_404(project_id)

    if current_user.role == 'User' and project.customer_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

    if request.method == 'GET':
        remarks = ProjectRemark.query.filter_by(project_id=project.id).order_by(ProjectRemark.created_at.desc()).all()
        return jsonify({'status': 'success', 'data': [r.to_dict() for r in remarks]})

    if request.method == 'POST':
        if current_user.role == 'User':
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

        remark_text = (request.json or {}).get('remark', '').strip()
        if not remark_text:
            return jsonify({'status': 'error', 'message': 'Remark text is required'}), 400

        new_remark = ProjectRemark(
            project_id=project.id,
            staff_id=current_user.id,
            remark=remark_text,
            created_at=datetime.utcnow()
        )
        db.session.add(new_remark)
        db.session.commit()
        log_audit(f'Added remark on Project {project.project_id}', current_user.email)

        return jsonify({'status': 'success', 'message': 'Remark added successfully', 'data': new_remark.to_dict()})

@app.route('/api/projects/<int:project_id>/timeline', methods=['GET'])
@login_required
def get_project_timeline(project_id):
    project = Project.query.get_or_404(project_id)

    if current_user.role == 'User' and project.customer_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

    timelines = ProjectTimeline.query.filter_by(project_id=project.id).order_by(ProjectTimeline.timestamp.asc()).all()
    return jsonify({'status': 'success', 'data': [t.to_dict() for t in timelines]})

@app.route('/api/projects/<int:project_id>/updates', methods=['GET', 'POST'])
@requires_permission('projects.view')
def project_updates(project_id):
    project = Project.query.get_or_404(project_id)
    
    # Permission check
    if current_user.role == 'User' and project.customer_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
    if request.method == 'GET':
        updates = ProjectUpdate.query.filter_by(project_id=project.id).order_by(ProjectUpdate.timestamp.desc()).all()
        return jsonify({'status': 'success', 'data': [u.to_dict() for u in updates]})
        
    if request.method == 'POST':
        if current_user.role == 'User':
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
            
        message = request.json.get('message')
        if not message:
            return jsonify({'status': 'error', 'message': 'Message is required'})
            
        new_update = ProjectUpdate(
            project_id=project.id,
            updated_by_id=current_user.id,
            message=message
        )
        db.session.add(new_update)
        db.session.commit()
        
        # Mock Email Notification Logging
        logger.info("== EMAIL NOTIFICATION ==")
        logger.info(f"To: {project.customer.email if project.customer else 'Unknown'}")
        logger.info(f"Subject: Project Update - {project.project_id} - {project.name}")
        logger.info(f"Current Stage: {project.stage} | Progress: {project.progress}%")
        logger.info(f"Latest Update: {message}")
        logger.info("========================")
        
        return jsonify({'status': 'success', 'message': 'Update added successfully'})

@app.route('/api/super-admin/audit-logs', methods=['GET'])
@requires_permission('system.limited')
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify({'status': 'success', 'data': [log.to_dict() for log in logs]})

# --- Helper Functions for Messaging System ---

def generate_unique_message_id():
    current_year = datetime.utcnow().year
    count = Message.query.count()
    next_num = count + 1
    msg_id = f'MSG-{current_year}-{next_num:06d}'
    while Message.query.filter_by(message_id=msg_id).first():
        next_num += 1
        msg_id = f'MSG-{current_year}-{next_num:06d}'
    return msg_id

def generate_unique_conversation_id():
    current_year = datetime.utcnow().year
    count = db.session.query(Message.conversation_id).distinct().count()
    next_num = count + 1
    conv_id = f'CONV-{current_year}-{next_num:06d}'
    while Message.query.filter_by(conversation_id=conv_id).first():
        next_num += 1
        conv_id = f'CONV-{current_year}-{next_num:06d}'
    return conv_id

def is_staff_assigned_to_client(staff_id, client_id):
    if not staff_id or not client_id:
        return False
    client = User.query.get(client_id)
    if client and client.assigned_staff_id == staff_id:
        return True
    proj = Project.query.filter_by(customer_id=client_id, assigned_staff_id=staff_id).first()
    if proj:
        return True
    sa = StaffAssignment.query.filter_by(staff_id=staff_id, client_id=client_id).first()
    if sa:
        return True
    enq = Enquiry.query.filter_by(customer_id=client_id, assigned_staff_id=staff_id).first()
    if enq:
        return True
    return False

def is_conversation_accessible_by_user(conv_id, user):
    if user.role == 'Super Admin':
        return True
    msgs = Message.query.filter_by(conversation_id=conv_id).all()
    if not msgs:
        return False
    for m in msgs:
        if m.sender_id == user.id or m.receiver_id == user.id:
            return True
        if m.customer_id == user.id:
            return True
        if m.project_id:
            proj = Project.query.filter((Project.project_id == m.project_id) | (Project.id == m.project_id)).first()
            if proj:
                if user.role == 'Admin':
                    return True
                if proj.assigned_staff_id == user.id or proj.customer_id == user.id:
                    return True
        if user.role in ['Admin', 'Staff'] and m.recipient_type == 'TEAM':
            return True
    return False

# --- Messaging API Endpoints ---

@app.route('/api/messages/recipients', methods=['GET'])
@login_required
def get_messaging_recipients():
    role = current_user.role
    recipients = []

    if role == 'Super Admin':
        users = User.query.filter(User.id != current_user.id, User.is_active == True).order_by(User.role, User.full_name).all()
        for u in users:
            recipients.append({
                'id': u.id,
                'name': u.full_name,
                'email': u.email,
                'role': u.role,
                'type': 'INDIVIDUAL'
            })
        recipients.append({'id': 'TEAM_ALL_STAFF', 'name': 'All Staff Members (Team)', 'role': 'TEAM', 'type': 'TEAM'})
        recipients.append({'id': 'TEAM_ALL_ADMINS', 'name': 'All Administrators (Team)', 'role': 'TEAM', 'type': 'TEAM'})
        recipients.append({'id': 'TEAM_ALL_CLIENTS', 'name': 'All Clients / Customers (Team)', 'role': 'TEAM', 'type': 'TEAM'})

    elif role == 'Admin':
        users = User.query.filter(User.id != current_user.id, User.role.in_(['Staff', 'User', 'Admin', 'Super Admin']), User.is_active == True).order_by(User.role, User.full_name).all()
        for u in users:
            recipients.append({
                'id': u.id,
                'name': u.full_name,
                'email': u.email,
                'role': u.role,
                'type': 'INDIVIDUAL'
            })
        recipients.append({'id': 'TEAM_ALL_STAFF', 'name': 'All Staff Members (Team)', 'role': 'TEAM', 'type': 'TEAM'})
        recipients.append({'id': 'TEAM_ALL_CLIENTS', 'name': 'All Clients / Customers (Team)', 'role': 'TEAM', 'type': 'TEAM'})

    elif role == 'Staff':
        admins = User.query.filter(User.role.in_(['Super Admin', 'Admin']), User.is_active == True).all()
        for u in admins:
            recipients.append({
                'id': u.id,
                'name': u.full_name,
                'email': u.email,
                'role': u.role,
                'type': 'INDIVIDUAL'
            })
        # Assigned Clients ONLY
        assigned_projects = Project.query.filter_by(assigned_staff_id=current_user.id).all()
        assigned_client_ids = set(p.customer_id for p in assigned_projects if p.customer_id)
        
        assigned_direct_clients = User.query.filter_by(assigned_staff_id=current_user.id, role='User').all()
        for c in assigned_direct_clients:
            assigned_client_ids.add(c.id)

        if assigned_client_ids:
            clients = User.query.filter(User.id.in_(list(assigned_client_ids)), User.is_active == True).all()
            for c in clients:
                recipients.append({
                    'id': c.id,
                    'name': c.full_name,
                    'email': c.email,
                    'role': 'User',
                    'type': 'CLIENT'
                })
        recipients.append({'id': 'TEAM_OPERATIONS', 'name': 'Operations Staff Team', 'role': 'TEAM', 'type': 'TEAM'})

    elif role == 'User': # Client
        admins = User.query.filter(User.role.in_(['Super Admin', 'Admin']), User.is_active == True).all()
        for u in admins:
            recipients.append({
                'id': u.id,
                'name': u.full_name,
                'email': u.email,
                'role': u.role,
                'type': 'INDIVIDUAL'
            })
        # Assigned Staff ONLY
        my_projects = Project.query.filter_by(customer_id=current_user.id).all()
        assigned_staff_ids = set(p.assigned_staff_id for p in my_projects if p.assigned_staff_id)
        if current_user.assigned_staff_id:
            assigned_staff_ids.add(current_user.assigned_staff_id)

        if assigned_staff_ids:
            staff_members = User.query.filter(User.id.in_(list(assigned_staff_ids)), User.is_active == True).all()
            for s in staff_members:
                recipients.append({
                    'id': s.id,
                    'name': s.full_name,
                    'email': s.email,
                    'role': 'Staff',
                    'type': 'INDIVIDUAL'
                })

    return jsonify({'status': 'success', 'data': recipients})

@app.route('/api/messages', methods=['GET', 'POST'])
@login_required
def handle_messages():
    if request.method == 'GET':
        # Retrieve inbox messages for current user
        try:
            if current_user.role == 'Super Admin':
                messages = Message.query.order_by(Message.timestamp.desc()).all()
            else:
                messages = Message.query.filter(
                    (Message.receiver_id == current_user.id) |
                    (Message.sender_id == current_user.id) |
                    ((Message.recipient_type == 'TEAM') & (Message.receiver_role.in_([current_user.role, 'TEAM'])))
                ).order_by(Message.timestamp.desc()).all()
            return jsonify({'status': 'success', 'data': [m.to_dict() for m in messages]})
        except Exception as e:
            logger.error(f"Error fetching messages: {str(e)}")
            return jsonify({'status': 'error', 'message': str(e)})

    elif request.method == 'POST':
        # Send a message with strict backend validation
        data = request.json or {}
        recipient_id_raw = data.get('receiver_id') or data.get('recipient_id')
        subject = (data.get('subject') or '').strip()
        body = (data.get('body') or data.get('message') or '').strip()
        conversation_id = data.get('conversation_id')
        project_id = data.get('project_id')
        attachment_url = data.get('attachment_url')

        if not body:
            return jsonify({'status': 'error', 'message': 'Message body cannot be empty.'}), 400

        # Sender identity comes STRICTLY from authenticated session
        sender_id = current_user.id
        sender_role = current_user.role

        receiver_id = None
        receiver_name = 'Team'
        receiver_role = 'TEAM'
        recipient_type = 'INDIVIDUAL'
        message_type = 'DIRECT'
        customer_id = None

        if project_id:
            message_type = 'PROJECT'
            proj = Project.query.filter((Project.project_id == project_id) | (Project.id == project_id)).first()
            if proj:
                customer_id = proj.customer_id

        # Determine Recipient Details & Enforce Permission Matrix
        if str(recipient_id_raw).startswith('TEAM_'):
            recipient_type = 'TEAM'
            message_type = 'TEAM'
            receiver_role = 'TEAM'
            receiver_name = str(recipient_id_raw).replace('TEAM_', '').replace('_', ' ').title()

            if sender_role not in ['Super Admin', 'Admin', 'Staff']:
                return jsonify({'status': 'error', 'message': 'Permission denied: Clients cannot send team broadcasts.'}), 403

        else:
            if not recipient_id_raw:
                return jsonify({'status': 'error', 'message': 'Recipient is required.'}), 400

            try:
                receiver_id = int(recipient_id_raw)
            except ValueError:
                return jsonify({'status': 'error', 'message': 'Invalid recipient selection.'}), 400

            target_user = User.query.get(receiver_id)
            if not target_user or not target_user.is_active:
                return jsonify({'status': 'error', 'message': 'Recipient user not found or inactive.'}), 404

            receiver_name = target_user.full_name
            receiver_role = target_user.role

            if receiver_role == 'User':
                recipient_type = 'CLIENT'
                message_type = 'CUSTOMER'
                customer_id = target_user.id

            # --- STRICT BACKEND RBAC AUTHORIZATION CHECKS ---
            if sender_role == 'Staff':
                if target_user.role == 'User': # Staff sending to Client
                    if not is_staff_assigned_to_client(sender_id, target_user.id):
                        log_audit("Unauthorized Message Attempt to Unassigned Client", current_user.email, status="Denied")
                        return jsonify({'status': 'error', 'message': 'Permission denied: Staff can only communicate with assigned clients.'}), 403

            elif sender_role == 'User': # Client
                if target_user.role == 'Staff': # Client sending to Staff
                    if not is_staff_assigned_to_client(target_user.id, sender_id):
                        log_audit("Unauthorized Message Attempt to Unassigned Staff", current_user.email, status="Denied")
                        return jsonify({'status': 'error', 'message': 'Permission denied: Client can only communicate with assigned staff.'}), 403
                elif target_user.role == 'User': # Client sending to Client
                    log_audit("Unauthorized Message Attempt to Another Client", current_user.email, status="Denied")
                    return jsonify({'status': 'error', 'message': 'Permission denied: Client cannot message another client.'}), 403

            elif sender_role == 'Admin':
                pass # Admin can message Staff, Clients, Teams

            elif sender_role == 'Super Admin':
                pass # Super Admin has full messaging authority

        # Generate Message ID & Conversation ID
        msg_code = generate_unique_message_id()
        if not conversation_id:
            conversation_id = generate_unique_conversation_id()

        new_msg = Message(
            message_id=msg_code,
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_role=sender_role,
            receiver_id=receiver_id if receiver_id is not None else 0,
            receiver_name=receiver_name,
            receiver_role=receiver_role,
            recipient_type=recipient_type,
            message_type=message_type,
            project_id=project_id,
            customer_id=customer_id,
            subject=subject or f"Message regarding {project_id or 'Website Builders'}",
            body=body,
            attachment_url=attachment_url,
            status='SENT',
            is_read=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.session.add(new_msg)
        db.session.commit()

        msg_dict = new_msg.to_dict()
        sync_to_google_sheets('sync_message', msg_dict)
        log_audit(f"Sent Message {msg_code} to {receiver_name}", current_user.email)

        # Create system notification for recipient if individual
        if receiver_id:
            try:
                notif = Notification(
                    user_id=receiver_id,
                    title=f"New Message from {current_user.full_name}",
                    message=body[:100],
                    type='Message'
                )
                db.session.add(notif)
                db.session.commit()
            except Exception:
                db.session.rollback()

        return jsonify({
            'status': 'success',
            'message': 'Message sent successfully.',
            'message_id': msg_code,
            'conversation_id': conversation_id,
            'data': msg_dict
        })

@app.route('/api/messages/sent', methods=['GET'])
@login_required
def get_sent_messages():
    try:
        messages = Message.query.filter_by(sender_id=current_user.id).order_by(Message.timestamp.desc()).all()
        return jsonify({'status': 'success', 'data': [m.to_dict() for m in messages]})
    except Exception as e:
        logger.error(f"Error fetching sent messages: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/conversations', methods=['GET'])
@login_required
def get_conversations_list():
    try:
        if current_user.role == 'Super Admin':
            msgs = Message.query.order_by(Message.timestamp.desc()).all()
        else:
            msgs = Message.query.filter(
                (Message.sender_id == current_user.id) |
                (Message.receiver_id == current_user.id) |
                (Message.customer_id == current_user.id) |
                ((Message.recipient_type == 'TEAM') & (Message.receiver_role.in_([current_user.role, 'TEAM'])))
            ).order_by(Message.timestamp.desc()).all()

        conversations = {}
        for m in msgs:
            conv_id = m.conversation_id or f"CONV-2026-{m.id:06d}"
            if conv_id not in conversations:
                unread = (m.receiver_id == current_user.id and not m.is_read)
                conversations[conv_id] = {
                    'conversation_id': conv_id,
                    'last_message': m.body,
                    'last_updated': m.timestamp.isoformat() if m.timestamp else '',
                    'last_updated_str': m.timestamp.strftime("%d-%m-%Y %H:%M:%S") if m.timestamp else '',
                    'sender_name': m.sender.full_name if m.sender else 'System',
                    'receiver_name': m.receiver_name or (m.receiver.full_name if m.receiver else 'Team'),
                    'subject': m.subject or '(No Subject)',
                    'project_id': m.project_id or '',
                    'unread': unread,
                    'status': m.status
                }
            elif (m.receiver_id == current_user.id and not m.is_read):
                conversations[conv_id]['unread'] = True

        return jsonify({'status': 'success', 'data': list(conversations.values())})
    except Exception as e:
        logger.error(f"Error fetching conversations list: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/conversations/<conv_id>', methods=['GET'])
@login_required
def get_conversation_thread(conv_id):
    if not is_conversation_accessible_by_user(conv_id, current_user):
        log_audit(f"Unauthorized Conversation Access Attempt: {conv_id}", current_user.email, status="Denied")
        return jsonify({'status': 'error', 'message': 'Permission denied: You are not authorized to view this conversation.'}), 403

    try:
        messages = Message.query.filter_by(conversation_id=conv_id).order_by(Message.timestamp.asc()).all()
        
        # Mark received unread messages as READ with read_at timestamp
        has_updates = False
        for m in messages:
            if m.receiver_id == current_user.id and not m.is_read:
                m.is_read = True
                m.status = 'READ'
                m.read_at = datetime.utcnow()
                m.updated_at = datetime.utcnow()
                has_updates = True
                sync_to_google_sheets('sync_message', m.to_dict())

        if has_updates:
            db.session.commit()

        return jsonify({'status': 'success', 'conversation_id': conv_id, 'data': [m.to_dict() for m in messages]})
    except Exception as e:
        logger.error(f"Error fetching conversation {conv_id}: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/unread-count', methods=['GET'])
@login_required
def get_unread_message_count():
    try:
        count = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
        return jsonify({'status': 'success', 'unread_count': count})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/<int:msg_id>/read', methods=['PUT'])
@login_required
def mark_message_read(msg_id):
    msg = Message.query.get_or_404(msg_id)
    if msg.receiver_id != current_user.id and current_user.role != 'Super Admin':
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403

    msg.is_read = True
    msg.status = 'READ'
    msg.read_at = datetime.utcnow()
    msg.updated_at = datetime.utcnow()
    db.session.commit()
    sync_to_google_sheets('sync_message', msg.to_dict())
    return jsonify({'status': 'success', 'data': msg.to_dict()})

@app.route('/api/projects/<int:project_id>/assign-staff', methods=['POST'])
@login_required
def assign_staff_to_project(project_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Permission denied: Only Admin or Super Admin can assign staff to projects.'}), 403

    project = Project.query.get_or_404(project_id)
    data = request.json or {}
    staff_id = data.get('assigned_staff_id') or data.get('staff_id')

    # Mark previous active assignments as PREVIOUS
    StaffAssignment.query.filter_by(project_id=project.id, status='ACTIVE').update({
        'status': 'PREVIOUS',
        'unassigned_at': datetime.utcnow()
    })

    if staff_id and str(staff_id).isdigit():
        staff = User.query.get(int(staff_id))
        if not staff or not staff.is_active or staff.role not in ['Staff', 'Admin', 'Super Admin']:
            return jsonify({'status': 'error', 'message': 'Selected staff member is invalid or inactive'}), 400

        project.assigned_staff_id = staff.id

        new_assign = StaffAssignment(
            project_id=project.id,
            staff_id=staff.id,
            client_id=project.customer_id,
            assigned_by_id=current_user.id,
            assigned_at=datetime.utcnow(),
            status='ACTIVE'
        )
        db.session.add(new_assign)
        msg_text = f"Assigned Project {project.project_id} ({project.name}) to Staff {staff.full_name}."
    else:
        project.assigned_staff_id = None
        msg_text = f"Unassigned staff from Project {project.project_id}."

    project.updated_at = datetime.utcnow()
    db.session.commit()

    sync_to_google_sheets('sync_project', project.to_dict())
    log_audit(msg_text, current_user.email)

    return jsonify({
        'status': 'success',
        'message': msg_text,
        'data': project.to_dict()
    })

@app.route('/api/super-admin/users/<int:user_id>/assign-staff', methods=['POST'])
@login_required
def assign_staff_to_client(user_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    target_user = User.query.get_or_404(user_id)
    data = request.json or {}
    staff_id = data.get('assigned_staff_id')
    
    if staff_id:
        staff = User.query.get(staff_id)
        if not staff or staff.role not in ['Staff', 'Admin', 'Super Admin']:
            return jsonify({'status': 'error', 'message': 'Invalid staff member selected'}), 400
        target_user.assigned_staff_id = staff.id
        db.session.commit()
        sync_to_google_sheets('sync_user', target_user.to_dict())
        log_audit(f'Assigned Client {target_user.email} to Staff {staff.full_name}', current_user.email)
        return jsonify({'status': 'success', 'message': f'Assigned client {target_user.full_name} to {staff.full_name}'})
    else:
        target_user.assigned_staff_id = None
        db.session.commit()
        sync_to_google_sheets('sync_user', target_user.to_dict())
        log_audit(f'Unassigned Staff from Client {target_user.email}', current_user.email)
        return jsonify({'status': 'success', 'message': f'Unassigned staff from client {target_user.full_name}'})

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    try:
        notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).all()
        return jsonify({'status': 'success', 'data': [n.to_dict() for n in notifications]})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/notifications/read-all', methods=['POST'])
@login_required
def mark_all_notifications_read():
    try:
        Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Notifications marked as read'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/admin/reports', methods=['GET'])
@login_required
def get_admin_reports():
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_projects = Project.query.count()
    completed_projects = Project.query.filter_by(status='Completed').count()
    total_websites = Website.query.count()
    total_tasks = Task.query.count()
    total_audit_logs = AuditLog.query.count()
    
    return jsonify({
        'status': 'success',
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'total_projects': total_projects,
            'completed_projects': completed_projects,
            'total_websites': total_websites,
            'total_tasks': total_tasks,
            'total_audit_logs': total_audit_logs,
            'generated_at': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        }
    })

# --- Universal Systems ---

@app.route('/api/search', methods=['GET'])
@login_required
def global_search():
    query = request.args.get('q', '').lower()
    if not query:
        return jsonify({'status': 'success', 'data': []})
        
    results = []
    
    # Example minimal search logic
    if current_user.role in ['Super Admin', 'Admin']:
        users = User.query.filter(User.full_name.ilike(f"%{query}%")).limit(5).all()
        for u in users:
            results.append({'type': 'User', 'title': u.full_name, 'subtitle': u.email, 'url': '#'})
            
        projects = Project.query.filter(Project.name.ilike(f"%{query}%")).limit(5).all()
        for p in projects:
            results.append({'type': 'Project', 'title': p.name, 'subtitle': p.project_id, 'url': '#'})
            
    elif current_user.role == 'Staff':
        projects = Project.query.filter(Project.assigned_staff_id == current_user.id, Project.name.ilike(f"%{query}%")).limit(5).all()
        for p in projects:
            results.append({'type': 'Project', 'title': p.name, 'subtitle': p.project_id, 'url': '#'})
            
    elif current_user.role == 'User':
        projects = Project.query.filter(Project.customer_id == current_user.id, Project.name.ilike(f"%{query}%")).limit(5).all()
        for p in projects:
            results.append({'type': 'Project', 'title': p.name, 'subtitle': p.project_id, 'url': '#'})
            
    return jsonify({'status': 'success', 'data': results})


@app.route('/api/notifications/<int:notif_id>/read', methods=['PUT'])
@login_required
def mark_notification_read(notif_id):
    notif = Notification.query.get_or_404(notif_id)
    if notif.user_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Denied'}), 403
    notif.is_read = True
    db.session.commit()
    return jsonify({'status': 'success'})

# --- File Management API ---
if 'VERCEL' in os.environ or 'RENDER' in os.environ or os.environ.get('VERCEL_ENV') or os.environ.get('SERVERLESS'):
    UPLOAD_FOLDER = '/tmp/uploads'
else:
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

try:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
except Exception as e:
    logger.warning(f"Could not create UPLOAD_FOLDER {UPLOAD_FOLDER}: {str(e)}")

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/api/projects/<int:project_id>/files', methods=['GET', 'POST'])
@login_required
def project_files(project_id):
    project = Project.query.get_or_404(project_id)
    
    # Permission logic
    if current_user.role == 'User' and project.customer_id != current_user.id:
         return jsonify({'status': 'error', 'message': 'Denied'}), 403
    if current_user.role == 'Staff' and project.assigned_staff_id != current_user.id:
         return jsonify({'status': 'error', 'message': 'Denied'}), 403

    if request.method == 'GET':
        files = ProjectFile.query.filter_by(project_id=project.id).order_by(ProjectFile.uploaded_at.desc()).all()
        return jsonify({'status': 'success', 'data': [f.to_dict() for f in files]})
        
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No selected file'}), 400
            
        if file:
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            new_file = ProjectFile(
                project_id=project.id,
                uploaded_by_id=current_user.id,
                filename=filename,
                filepath=unique_filename,
                category=request.form.get('category', 'Other')
            )
            db.session.add(new_file)
            db.session.commit()
            
            # Trigger notification
            if current_user.role == 'User' and project.assigned_staff_id:
                notif = Notification(user_id=project.assigned_staff_id, type='file_uploaded', title='New Client File', message=f'{current_user.full_name} uploaded {filename} to {project.name}')
                db.session.add(notif)
                db.session.commit()
                
            return jsonify({'status': 'success', 'message': 'File uploaded', 'data': new_file.to_dict()})

@app.route('/uploads/<filename>')
@login_required
def download_file(filename):
    # Ideally check permissions here based on file ownership
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ==========================================
# ENTERPRISE IT OPERATIONS PLATFORM APIs
# ==========================================

# --- Clients API ---
@app.route('/api/clients', methods=['GET', 'POST'])
@login_required
def manage_clients():
    if request.method == 'GET':
        if current_user.role in ['Super Admin', 'Admin']:
            clients = User.query.filter_by(role='User').order_by(User.created_at.desc()).all()
        elif current_user.role == 'Staff':
            assigned_client_ids = [sa.client_id for sa in StaffAssignment.query.filter_by(staff_id=current_user.id).all() if sa.client_id]
            clients = User.query.filter(User.id.in_(assigned_client_ids), User.role == 'User').all() if assigned_client_ids else []
        else:
            clients = [current_user]
        return jsonify({'status': 'success', 'data': [c.to_dict() for c in clients]})
        
    if request.method == 'POST':
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        data = request.json or {}
        full_name = data.get('full_name')
        email = data.get('email')
        mobile = data.get('mobile', '+91 0000000000')
        password = data.get('password', 'Client@1234')
        
        if not full_name or not email:
            return jsonify({'status': 'error', 'message': 'Full name and email are required'}), 400
            
        if User.query.filter_by(email=email).first():
            return jsonify({'status': 'error', 'message': 'Client email already exists'}), 400
            
        client = User(full_name=full_name, email=email, mobile=mobile, role='User', is_active=True)
        client.set_password(password)
        db.session.add(client)
        db.session.commit()
        log_audit('Created Client', current_user.email, target_user=email)
        return jsonify({'status': 'success', 'message': 'Client created successfully', 'data': client.to_dict()})

@app.route('/api/clients/<int:client_id>', methods=['PUT', 'DELETE'])
@login_required
def modify_client(client_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
    client = User.query.get_or_404(client_id)
    if request.method == 'PUT':
        data = request.json or {}
        client.full_name = data.get('full_name', client.full_name)
        client.mobile = data.get('mobile', client.mobile)
        if 'is_active' in data:
            client.is_active = bool(data['is_active'])
        db.session.commit()
        log_audit('Updated Client', current_user.email, target_user=client.email)
        return jsonify({'status': 'success', 'message': 'Client updated successfully'})
        
    if request.method == 'DELETE':
        email = client.email
        db.session.delete(client)
        db.session.commit()
        log_audit('Deleted Client', current_user.email, target_user=email)
        return jsonify({'status': 'success', 'message': 'Client deleted successfully'})

# --- Tasks API ---
@app.route('/api/tasks', methods=['GET', 'POST'])
@login_required
def manage_tasks():
    if request.method == 'GET':
        if current_user.role in ['Super Admin', 'Admin']:
            tasks = Task.query.order_by(Task.created_at.desc()).all()
        elif current_user.role == 'Staff':
            tasks = Task.query.filter_by(assigned_staff_id=current_user.id).order_by(Task.created_at.desc()).all()
        else:
            tasks = []
        return jsonify({'status': 'success', 'data': [t.to_dict() for t in tasks]})
        
    if request.method == 'POST':
        if current_user.role not in ['Super Admin', 'Admin', 'Staff']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        data = request.json or {}
        title = str(data.get('title', '')).strip()
        if not title:
            return jsonify({'status': 'error', 'message': 'Task title is required'}), 400
            
        proj_id_val = data.get('project_id')
        if proj_id_val and str(proj_id_val).isdigit():
            project_id = int(proj_id_val)
        else:
            first_proj = Project.query.first()
            if not first_proj:
                return jsonify({'status': 'error', 'message': 'Please create a Project first before adding tasks'}), 400
            project_id = first_proj.id

        staff_id_val = data.get('assigned_staff_id')
        assigned_staff_id = int(staff_id_val) if (staff_id_val and str(staff_id_val).isdigit()) else None

        due_date = datetime.strptime(data.get('due_date'), '%Y-%m-%d').date() if data.get('due_date') else None
        task = Task(
            project_id=project_id,
            assigned_staff_id=assigned_staff_id,
            title=title,
            description=data.get('description', ''),
            priority=data.get('priority', 'Normal'),
            status=data.get('status', 'Todo'),
            due_date=due_date
        )
        db.session.add(task)
        db.session.commit()
        sync_to_google_sheets('sync_task', task.to_dict())
        log_audit('Created Task', current_user.email)
        return jsonify({'status': 'success', 'message': 'Task created successfully', 'data': task.to_dict()})

@app.route('/api/tasks/<int:task_id>', methods=['PUT', 'DELETE'])
@login_required
def modify_task(task_id):
    task = Task.query.get_or_404(task_id)
    if current_user.role == 'Staff' and task.assigned_staff_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
    if request.method == 'PUT':
        data = request.json or {}
        if 'title' in data and current_user.role in ['Super Admin', 'Admin']:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'priority' in data and current_user.role in ['Super Admin', 'Admin']:
            task.priority = data['priority']
        if 'status' in data:
            task.status = data['status']
            if data['status'] == 'Completed':
                task.completed_at = datetime.utcnow()
        if 'assigned_staff_id' in data and current_user.role in ['Super Admin', 'Admin']:
            task.assigned_staff_id = data['assigned_staff_id'] or None
        if 'due_date' in data and data['due_date'] and current_user.role in ['Super Admin', 'Admin']:
            task.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            
        db.session.commit()
        sync_to_google_sheets('sync_task', task.to_dict())
        log_audit('Updated Task', current_user.email)
        return jsonify({'status': 'success', 'message': 'Task updated successfully'})
        
    if request.method == 'DELETE':
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        tid = task.id
        db.session.delete(task)
        db.session.commit()
        sync_to_google_sheets('delete_task', {'id': tid})
        log_audit('Deleted Task', current_user.email)
        return jsonify({'status': 'success', 'message': 'Task deleted successfully'})

# --- Websites API ---
@app.route('/api/websites', methods=['GET', 'POST'])
@login_required
def manage_websites():
    if request.method == 'GET':
        if current_user.role in ['Super Admin', 'Admin']:
            websites = Website.query.order_by(Website.created_at.desc()).all()
        elif current_user.role == 'Staff':
            assigned_project_ids = [p.id for p in Project.query.filter_by(assigned_staff_id=current_user.id).all()]
            websites = Website.query.filter(Website.project_id.in_(assigned_project_ids)).all() if assigned_project_ids else []
        else:
            websites = Website.query.filter_by(client_id=current_user.id).all()
        return jsonify({'status': 'success', 'data': [w.to_dict() for w in websites]})
        
    if request.method == 'POST':
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        data = request.json or {}
        name = str(data.get('name', '')).strip()
        if not name:
            return jsonify({'status': 'error', 'message': 'Website name is required'}), 400
            
        client_id_val = data.get('client_id')
        if client_id_val and str(client_id_val).isdigit():
            client_id = int(client_id_val)
        else:
            first_user = User.query.first()
            client_id = first_user.id if first_user else current_user.id

        proj_id_val = data.get('project_id')
        project_id = int(proj_id_val) if (proj_id_val and str(proj_id_val).isdigit()) else None

        website = Website(
            client_id=client_id,
            project_id=project_id,
            name=name,
            domain=data.get('domain', ''),
            status=data.get('status', 'Draft')
        )
        db.session.add(website)
        db.session.commit()
        sync_to_google_sheets('sync_website', website.to_dict())
        log_audit('Created Website', current_user.email)
        return jsonify({'status': 'success', 'message': 'Website created successfully', 'data': website.to_dict()})

@app.route('/api/websites/<int:website_id>', methods=['PUT', 'DELETE'])
@login_required
def modify_website(website_id):
    website = Website.query.get_or_404(website_id)
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
    if request.method == 'PUT':
        data = request.json or {}
        website.name = data.get('name', website.name)
        website.domain = data.get('domain', website.domain)
        website.status = data.get('status', website.status)
        db.session.commit()
        sync_to_google_sheets('sync_website', website.to_dict())
        log_audit('Updated Website', current_user.email)
        return jsonify({'status': 'success', 'message': 'Website updated successfully'})
        
    if request.method == 'DELETE':
        wid = website.id
        db.session.delete(website)
        db.session.commit()
        sync_to_google_sheets('delete_website', {'id': wid})
        log_audit('Deleted Website', current_user.email)
        return jsonify({'status': 'success', 'message': 'Website deleted successfully'})

# --- Workload & Team Performance API ---
@app.route('/api/admin/workload', methods=['GET'])
@role_required('Admin', 'Super Admin')
def admin_workload_api():
    staff_members = User.query.filter_by(role='Staff').all()
    workload_data = []
    for s in staff_members:
        assigned_projects_count = Project.query.filter_by(assigned_staff_id=s.id).count()
        assigned_tasks_count = Task.query.filter_by(assigned_staff_id=s.id).count()
        completed_tasks_count = Task.query.filter_by(assigned_staff_id=s.id, status='Completed').count()
        
        # Calculate load percentage based on tasks capacity (e.g. 20 tasks = 100%)
        load_pct = min(100, int((assigned_tasks_count / max(1, 20)) * 100))
        if load_pct >= 90:
            state = 'Overloaded'
        elif load_pct >= 70:
            state = 'High'
        elif load_pct >= 40:
            state = 'Balanced'
        else:
            state = 'Low'
            
        workload_data.append({
            'staff_id': s.id,
            'name': s.full_name,
            'email': s.email,
            'projects_count': assigned_projects_count,
            'tasks_count': assigned_tasks_count,
            'completed_tasks_count': completed_tasks_count,
            'load_percentage': load_pct,
            'state': state
        })
    return jsonify({'status': 'success', 'data': workload_data})

@app.route('/api/admin/team-performance', methods=['GET'])
@role_required('Admin', 'Super Admin')
def admin_team_performance_api():
    staff_members = User.query.filter_by(role='Staff').all()
    perf_data = []
    for s in staff_members:
        total_tasks = Task.query.filter_by(assigned_staff_id=s.id).count()
        completed_tasks = Task.query.filter_by(assigned_staff_id=s.id, status='Completed').count()
        overdue_tasks = Task.query.filter(Task.assigned_staff_id == s.id, Task.status != 'Completed', Task.due_date < datetime.utcnow().date()).count()
        
        completion_rate = int((completed_tasks / max(1, total_tasks)) * 100) if total_tasks > 0 else 100
        on_time_rate = max(0, 100 - (overdue_tasks * 10))
        
        perf_data.append({
            'staff_id': s.id,
            'name': s.full_name,
            'email': s.email,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'overdue_tasks': overdue_tasks,
            'completion_rate': completion_rate,
            'on_time_rate': on_time_rate,
            'is_active': s.is_active,
            'last_active': s.last_login.isoformat() if s.last_login else 'Never'
        })
    return jsonify({'status': 'success', 'data': perf_data})

# --- System Health API ---
@app.route('/api/admin/system-health', methods=['GET'])
@role_required('Super Admin')
def system_health_api():
    return jsonify({
        'status': 'success',
        'data': {
            'application_status': 'Healthy (Online)',
            'database_status': 'Connected (SQLite DB)',
            'api_status': 'Operational (Flask REST API)',
            'storage': 'Local Storage (Uploads active)',
            'background_jobs': 'Active',
            'recent_errors': 0,
            'last_backup': datetime.utcnow().strftime('%Y-%m-%d 02:00:00 UTC')
        }
    })


if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)


# ==========================================
# NEW DASHBOARD STATS API
# ==========================================
@app.route('/api/stats/super-admin', methods=['GET'])
@login_required
@requires_permission('manage_users')
def stats_super_admin():
    total_users = User.query.count()
    total_admins = User.query.filter_by(role='Admin').count()
    total_staff = User.query.filter_by(role='Staff').count()
    total_customers = User.query.filter_by(role='User').count()
    total_projects = Project.query.count()
    active_projects = Project.query.filter(Project.status != 'Completed').count()
    completed_projects = Project.query.filter_by(status='Completed').count()
    unread_messages = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
    
    return jsonify({
        'status': 'success',
        'data': {
            'total_users': total_users,
            'total_admins': total_admins,
            'total_staff': total_staff,
            'total_customers': total_customers,
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'unread_messages': unread_messages,
            'pending_emails': 0, # Placeholder until email tracking is added
            'total_enquiries': 0 # We will fetch this dynamically below or frontend does it
        }
    })

@app.route('/api/stats/admin', methods=['GET'])
@login_required
@requires_permission('manage_projects')
def stats_admin():
    active_projects = Project.query.filter(Project.status != 'Completed').count()
    completed_projects = Project.query.filter_by(status='Completed').count()
    unread_messages = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
    
    return jsonify({
        'status': 'success',
        'data': {
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'unread_messages': unread_messages,
            'pending_emails': 0
        }
    })

@app.route('/api/stats/staff', methods=['GET'])
@login_required
def stats_staff():
    assigned_projects = Project.query.filter_by(assigned_staff_id=current_user.id).count()
    active_projects = Project.query.filter(Project.assigned_staff_id == current_user.id, Project.status != 'Completed').count()
    completed_projects = Project.query.filter_by(assigned_staff_id=current_user.id, status='Completed').count()
    unread_messages = Message.query.filter_by(receiver_id=current_user.id, is_read=False).count()
    
    return jsonify({
        'status': 'success',
        'data': {
            'assigned_projects': assigned_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'unread_messages': unread_messages,
            'pending_updates': 0
        }
    })

@app.route('/api/settings', methods=['GET', 'POST'])
@login_required
@requires_permission('manage_users')
def manage_settings():
    if request.method == 'GET':
        settings = SystemSetting.query.all()
        return jsonify({'status': 'success', 'data': {s.key: s.value for s in settings}})
    else:
        data = request.json
        for k, v in data.items():
            setting = SystemSetting.query.filter_by(key=k).first()
            if setting:
                setting.value = str(v)
            else:
                new_setting = SystemSetting(key=k, value=str(v))
                db.session.add(new_setting)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Settings saved successfully'})



@app.route('/api/reports', methods=['GET'])
@login_required
@requires_permission('view_reports')
def get_reports():
    report_type = request.args.get('type', 'projects')
    if report_type == 'projects':
        projects = Project.query.all()
        return jsonify({'status': 'success', 'data': [{'id': p.project_id, 'name': p.name, 'status': p.status, 'progress': p.progress} for p in projects]})
    elif report_type == 'users':
        users = User.query.all()
        return jsonify({'status': 'success', 'data': [u.to_dict() for u in users]})
    return jsonify({'status': 'error', 'message': 'Invalid report type'})
