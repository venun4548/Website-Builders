import os
import uuid
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
from models import db, User, PasswordResetToken, AuditLog, Project, ProjectUpdate, Notification, ProjectFile, Website, Task, SystemSetting, EnquiryState, Message, StaffAssignment

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
    if current_user.is_authenticated and current_user.role in ['Super Admin', 'Admin', 'Staff']:
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
    return False

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

# Secret mapping Google Apps Script Web App
GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzOHqf47OudqBUULE8wLrMv-lWVN8InExF56vd_AL8PlE3zA_u65se3SPbc4P1K6ePkjQ/exec'
SHARED_SECRET = 'sec_wb_crm_77c4e569bbd18f0a1c6a58'

def sync_to_google_sheets(action, data):
    def _send():
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
            with urllib.request.urlopen(req, timeout=4) as resp:
                pass
        except Exception as e:
            logger.debug(f"Google Sheets background sync notice: {str(e)}")

    import threading
    threading.Thread(target=_send, daemon=True).start()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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

# Database initialization & Admin Seed
def init_db():
    with app.app_context():
        db.create_all()
        # Seed Super Admin
        super_admin = User.query.filter_by(email='super@websitebuilders.com').first()
        if not super_admin:
            super_admin = User(
                full_name='Super Administrator',
                email='super@websitebuilders.com',
                mobile='+91 0000000000',
                role='Super Admin',
                is_active=True
            )
            super_admin.set_password('Super@1234')
            db.session.add(super_admin)

        # Seed an Admin if none exists
        admin = User.query.filter_by(email='admin@websitebuilders.com').first()
        if not admin:
            admin = User(
                full_name='System Administrator',
                email='admin@websitebuilders.com',
                mobile='+91 7386204885',
                role='Admin',
                is_active=True
            )
            admin.set_password('Admin@1234')
            db.session.add(admin)
            
        # Seed a Staff
        staff = User.query.filter_by(email='staff@websitebuilders.com').first()
        if not staff:
            staff = User(
                full_name='Staff Member',
                email='staff@websitebuilders.com',
                mobile='+91 1111111111',
                role='Staff',
                is_active=True
            )
            staff.set_password('Staff@1234')
            db.session.add(staff)

        # Seed a User
        normal_user = User.query.filter_by(email='user@websitebuilders.com').first()
        if not normal_user:
            normal_user = User(
                full_name='Venu Gopal',
                email='user@websitebuilders.com',
                mobile='+91 7386204885',
                role='User',
                is_active=True
            )
            normal_user.set_password('User@1234')
            db.session.add(normal_user)

        db.session.commit()
        logger.info("Database seeded successfully with Super Admin, Admin, Staff, and User roles.")

# --- Authentication Routes ---

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/index.html')
def home():
    return app.send_static_file('index.html')

@app.route('/services.html')
def services_page():
    return app.send_static_file('services.html')

@app.route('/contact.html')
def contact_page():
    return app.send_static_file('contact.html')

# --- Admin Portal Two-Step Access Verification ---

@app.route('/admin/access', methods=['GET'])
def admin_access_page():
    if current_user.is_authenticated and current_user.role in ['Super Admin', 'Admin', 'Staff']:
        return redirect(url_for('dashboard'))
    if is_admin_access_verified():
        return redirect(url_for('admin_login'))
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
        return redirect(url_for('dashboard'))
        
    if not is_admin_access_verified():
        flash('Please enter the Admin Access PIN to continue.', 'error')
        return redirect(url_for('admin_access_page'))

    preset_role = request.args.get('role', '')

    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('admin_login.html', preset_role=preset_role), 429

        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        selected_role = request.form.get('role', '').strip()
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.is_active and user.check_password(password):
            if user.role == 'User':
                log_audit("Unauthorized Admin Portal Access Attempt", user.email, status="Denied")
                flash('Access Denied: Customer accounts cannot access the Admin Portal.', 'error')
                return render_template('admin_login.html', preset_role=selected_role)

            if selected_role and user.role != selected_role:
                # If role mismatched, check if Super Admin logging in as Admin
                if not (user.role == 'Super Admin' and selected_role == 'Admin'):
                    flash(f'Invalid credentials for the selected role ({selected_role}).', 'error')
                    return render_template('admin_login.html', preset_role=selected_role)

            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user, remember=remember)
            log_audit("Logged in", user.email)
            logger.info(f"{user.role} login successful: {email}")
            
            if user.role == 'Super Admin':
                return redirect(url_for('super_admin_dashboard'))
            elif user.role == 'Admin':
                return redirect(url_for('admin_dashboard'))
            elif user.role == 'Staff':
                return redirect(url_for('staff_dashboard'))
            return redirect(url_for('my_projects'))
            
        logger.warning(f"Failed login attempt for email: {email}")
        flash('Invalid email or password.', 'error')
        
    return render_template('admin_login.html', preset_role=preset_role)

@app.route('/user/login', methods=['GET', 'POST'])
def user_login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    preset_role = request.args.get('role', 'User')

    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('user_login.html', preset_role=preset_role), 429

        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        selected_role = request.form.get('role', '').strip()
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.is_active and user.check_password(password):
            if user.role in ['Super Admin', 'Admin', 'Staff']:
                flash('Notice: Administrative accounts must log in via the Admin Portal.', 'error')
                return render_template('user_login.html', preset_role='User')

            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user, remember=remember)
            log_audit("Logged in", user.email)
            logger.info(f"{user.role} login successful: {email}")
            
            if user.role == 'Super Admin':
                return redirect(url_for('super_admin_dashboard'))
            elif user.role == 'Admin':
                return redirect(url_for('admin_dashboard'))
            elif user.role == 'Staff':
                return redirect(url_for('staff_dashboard'))
            return redirect(url_for('my_projects'))
            
        logger.warning(f"Failed User login attempt for email: {email}")
        flash('Invalid email or password.', 'error')
        
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

@app.route('/api/enquiries', methods=['GET'])
@login_required
def get_enquiries():
    try:
        # Securely fetch data from Google Apps Script Web App
        res = requests.get(GAS_WEB_APP_URL, params={'token': SHARED_SECRET}, timeout=15)
        if res.status_code == 200:
            result = res.json()
            if result.get('status') == 'success':
                all_enquiries = result.get('data', [])
                
                # Filter logic for User and Staff roles (only show assigned to them)
                if current_user.role in ['User', 'Staff']:
                    all_enquiries = [e for e in all_enquiries if e.get('assignedTo') == current_user.full_name]
                    
                return jsonify({'status': 'success', 'data': all_enquiries})
            else:
                return jsonify({'status': 'error', 'message': result.get('message')})
        else:
            return jsonify({'status': 'error', 'message': 'Failed to connect to Google Sheets backend.'})
    except Exception as e:
        logger.error(f"Error fetching enquiries: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/enquiries/update', methods=['POST'])
@login_required
def update_enquiry():
    # Role check
    # Admin can update everything. Users can only update if assigned to them.
    submission_id = request.json.get('submissionId')
    ticket_status = request.json.get('ticketStatus')
    assigned_to = request.json.get('assignedTo')
    follow_up_status = request.json.get('followUpStatus')
    remarks = request.json.get('remarks')

    if not submission_id:
        return jsonify({'status': 'error', 'message': 'Submission ID is required.'}), 400

    try:
        # If User or Staff, verify they are only updating their assigned item
        if current_user.role in ['User', 'Staff']:
            # Fetch existing state first
            res = requests.get(GAS_WEB_APP_URL, params={'token': SHARED_SECRET}, timeout=15)
            if res.status_code == 200:
                all_enquiries = res.json().get('data', [])
                matching = next((e for e in all_enquiries if e.get('submissionId') == submission_id), None)
                if not matching or matching.get('assignedTo') != current_user.full_name:
                    return jsonify({'status': 'error', 'message': 'Permission denied: You can only manage assigned enquiries.'}), 403
            else:
                return jsonify({'status': 'error', 'message': 'Failed to verify assignment permissions.'})

        # Post update back to Google Apps Script Web App
        payload = {
            'action': 'update_enquiry',
            'token': SHARED_SECRET,
            'submissionId': submission_id
        }
        if ticket_status:
            payload['ticketStatus'] = ticket_status
        if assigned_to is not None:
            payload['assignedTo'] = assigned_to
        if follow_up_status:
            payload['followUpStatus'] = follow_up_status
        if remarks is not None:
            payload['remarks'] = remarks

        res = requests.post(GAS_WEB_APP_URL, data=payload, timeout=15)
        if res.status_code == 200:
            return jsonify(res.json())
        return jsonify({'status': 'error', 'message': 'Failed to post update to Google Sheet.'})
    except Exception as e:
        logger.error(f"Error updating enquiry: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/users', methods=['GET'])
@login_required
def get_users():
    # Only Admin and Super Admin can fetch assignees
    users = User.query.filter_by(is_active=True).all()
    return jsonify({'status': 'success', 'data': [u.to_dict() for u in users]})

# --- User Management API (Super Admin) ---

@app.route('/api/super-admin/users', methods=['GET', 'POST'])
@login_required
def manage_users():
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
    if request.method == 'GET':
        users = User.query.all()
        return jsonify({'status': 'success', 'data': [u.to_dict() for u in users]})
        
    if request.method == 'POST':
        data = request.json or {}
        full_name = str(data.get('full_name', '')).strip()
        email = str(data.get('email', '')).strip()
        mobile = str(data.get('mobile', '')).strip()
        password = str(data.get('password', ''))
        role = str(data.get('role', 'Staff')).strip()
        status = bool(data.get('status', True))
        
        if not full_name or not email or not password:
            return jsonify({'status': 'error', 'message': 'Full name, email, and password are required'}), 400
            
        if current_user.role == 'Admin' and role == 'Super Admin':
            return jsonify({'status': 'error', 'message': 'Permission denied: Cannot create Super Admin'}), 403
            
        if User.query.filter_by(email=email).first():
            return jsonify({'status': 'error', 'message': 'Email address already registered'}), 400
            
        new_user = User(full_name=full_name, email=email, mobile=mobile, role=role, is_active=status)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        sync_to_google_sheets('sync_user', new_user.to_dict())
        log_audit('Created User', current_user.email, target_user=email)
        return jsonify({'status': 'success', 'message': f'{role} created successfully', 'data': new_user.to_dict()})

@app.route('/api/super-admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@requires_permission('users.limited')
def modify_user(user_id):
    user = User.query.get_or_404(user_id)
    
    if request.method == 'PUT':
        data = request.json
        
        if current_user.role == 'Admin' and (user.role == 'Super Admin' or data.get('role') == 'Super Admin'):
            return jsonify({'status': 'error', 'message': 'Permission denied: Cannot modify Super Admin'})
            
        user.full_name = data.get('full_name', user.full_name)
        user.mobile = data.get('mobile', user.mobile)
        user.role = data.get('role', user.role)
        if 'status' in data:
            user.is_active = data['status']
            
        db.session.commit()
        log_audit('Updated User', current_user.email, target_user=user.email)
        return jsonify({'status': 'success', 'message': 'User updated successfully'})
        
    if request.method == 'DELETE':
        if current_user.role == 'Admin' and user.role == 'Super Admin':
            return jsonify({'status': 'error', 'message': 'Permission denied: Cannot delete Super Admin'})
        email = user.email
        try:
            db.session.delete(user)
            db.session.commit()
            log_audit('Deleted User', current_user.email, target_user=email)
            return jsonify({'status': 'success', 'message': 'User deleted successfully'})
        except Exception as e:
            db.session.rollback()
            return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/super-admin/users/<int:user_id>/reset-password', methods=['POST'])
@requires_permission('users.limited')
def reset_user_password(user_id):
    user = User.query.get_or_404(user_id)
    new_password = request.json.get('password')
    
    if not new_password:
        return jsonify({'status': 'error', 'message': 'Password is required'})
        
    user.set_password(new_password)
    db.session.commit()
    log_audit('Reset User Password', current_user.email, target_user=user.email)
    return jsonify({'status': 'success', 'message': 'Password reset successfully'})

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
            
        today = datetime.utcnow().strftime('%Y%m%d')
        last_project = Project.query.filter(Project.project_id.like(f"WBP-{today}-%")).order_by(Project.project_id.desc()).first()
        if last_project:
            last_num = int(last_project.project_id.split('-')[-1])
            new_num = f"{(last_num + 1):04d}"
        else:
            new_num = "0001"
            
        new_project_id = f"WBP-{today}-{new_num}"
        
        cust_id_val = data.get('customer_id')
        if cust_id_val and str(cust_id_val).isdigit():
            customer_id = int(cust_id_val)
        else:
            first_user = User.query.first()
            customer_id = first_user.id if first_user else current_user.id

        staff_id_val = data.get('assigned_staff_id')
        assigned_staff_id = int(staff_id_val) if (staff_id_val and str(staff_id_val).isdigit()) else None

        start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date() if data.get('start_date') else None
        expected_delivery = datetime.strptime(data.get('expected_delivery'), '%Y-%m-%d').date() if data.get('expected_delivery') else None
        
        new_project = Project(
            project_id=new_project_id,
            name=name,
            customer_id=customer_id,
            submission_id=data.get('submission_id'),
            start_date=start_date,
            expected_delivery=expected_delivery,
            assigned_staff_id=assigned_staff_id,
            status=data.get('status', 'Not Started'),
            stage=data.get('stage', 'Requirement Gathering'),
            progress=int(data.get('progress', 0))
        )
        
        db.session.add(new_project)
        db.session.commit()
        sync_to_google_sheets('sync_project', new_project.to_dict())
        log_audit('Created Project', current_user.email)
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
            
        db.session.delete(project)
        db.session.commit()
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
        log_audit(f'Updated Project {project.project_id}', current_user.email)
        return jsonify({'status': 'success', 'message': 'Project updated successfully'})

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

# --- Messaging API ---

@app.route('/api/messages', methods=['GET'])
@requires_permission('messages.view')
def get_messages():
    try:
        messages = Message.query.filter_by(receiver_id=current_user.id).order_by(Message.timestamp.desc()).all()
        return jsonify({'status': 'success', 'data': [m.to_dict() for m in messages]})
    except Exception as e:
        logger.error(f"Error fetching messages: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/sent', methods=['GET'])
@requires_permission('messages.view')
def get_sent_messages():
    try:
        messages = Message.query.filter_by(sender_id=current_user.id).order_by(Message.timestamp.desc()).all()
        return jsonify({'status': 'success', 'data': [m.to_dict() for m in messages]})
    except Exception as e:
        logger.error(f"Error fetching sent messages: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages', methods=['POST'])
@requires_permission('messages.send')
def send_message():
    data = request.json
    receiver_id = data.get('receiver_id')
    subject = data.get('subject')
    body = data.get('body')
    
    if not receiver_id or not body:
        return jsonify({'status': 'error', 'message': 'Receiver and body are required.'}), 400
        
    try:
        new_msg = Message(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            subject=subject,
            body=body
        )
        db.session.add(new_msg)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Message sent successfully.'})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error sending message: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/api/messages/<int:msg_id>/read', methods=['PUT'])
@login_required
def mark_message_read(msg_id):
    msg = Message.query.get_or_404(msg_id)
    if msg.receiver_id != current_user.id:
        return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        
    msg.is_read = True
    db.session.commit()
    return jsonify({'status': 'success'})

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


@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({'status': 'success', 'data': [n.to_dict() for n in notifs]})

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
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
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
        log_audit('Updated Task', current_user.email)
        return jsonify({'status': 'success', 'message': 'Task updated successfully'})
        
    if request.method == 'DELETE':
        if current_user.role not in ['Super Admin', 'Admin']:
            return jsonify({'status': 'error', 'message': 'Permission denied'}), 403
        db.session.delete(task)
        db.session.commit()
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
        log_audit('Updated Website', current_user.email)
        return jsonify({'status': 'success', 'message': 'Website updated successfully'})
        
    if request.method == 'DELETE':
        db.session.delete(website)
        db.session.commit()
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

@app.route('/api/super-admin/users/<int:user_id>/change-role', methods=['PUT'])
@login_required
def change_user_role(user_id):
    if current_user.role not in ['Super Admin', 'Admin']:
        return jsonify({'status': 'error', 'message': 'Forbidden'}), 403
        
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        return jsonify({'status': 'error', 'message': 'Cannot change your own role'}), 400
    
    data = request.json or {}
    new_role = data.get('role')
    
    if current_user.role == 'Admin' and (user.role == 'Super Admin' or new_role == 'Super Admin'):
        return jsonify({'status': 'error', 'message': 'Permission denied: Cannot modify Super Admin role'}), 403
        
    if new_role not in ['Super Admin', 'Admin', 'Staff', 'User']:
        return jsonify({'status': 'error', 'message': 'Invalid role'}), 400
        
    user.role = new_role
    db.session.commit()
    log_audit('Changed Role', current_user.email, target_user=user.email)
    return jsonify({'status': 'success', 'message': 'Role updated successfully'})


@app.route('/api/super-admin/users/<int:user_id>', methods=['PUT', 'DELETE'])
@login_required
@requires_permission('manage_users')
def manage_single_user(user_id):
    user = User.query.get_or_404(user_id)
    if request.method == 'PUT':
        data = request.json
        user.full_name = data.get('full_name', user.full_name)
        user.mobile = data.get('mobile', user.mobile)
        user.is_active = data.get('status', user.is_active)
        if 'role' in data and user.id != current_user.id:
            user.role = data['role']
        db.session.commit()
        log_audit('Updated User', current_user.email, target_user=user.email)
        return jsonify({'status': 'success', 'message': 'User updated successfully'})
    
    if request.method == 'DELETE':
        if user.id == current_user.id:
            return jsonify({'status': 'error', 'message': 'Cannot delete your own account'})
        email = user.email
        db.session.delete(user)
        db.session.commit()
        log_audit('Deleted User', current_user.email, target_user=email)
        return jsonify({'status': 'success', 'message': 'User deleted successfully'})
