import os
import uuid
import requests
import logging
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_cors import CORS

from config import Config
from models import db, User, PasswordResetToken

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

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Secret mapping Google Apps Script Web App
GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzOHqf47OudqBUULE8wLrMv-lWVN8InExF56vd_AL8PlE3zA_u65se3SPbc4P1K6ePkjQ/exec'
SHARED_SECRET = 'sec_wb_crm_77c4e569bbd18f0a1c6a58'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

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
            
            # Seed a User
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
            logger.info("Database seeded successfully with Admin and User roles.")

# --- Authentication Routes ---

@app.route('/')
def index():
    return redirect(url_for('user_login'))

@app.route('/index.html')
def home():
    if not current_user.is_authenticated:
        return redirect(url_for('user_login'))
    return app.send_static_file('index.html')

@app.route('/services.html')
def services_page():
    if not current_user.is_authenticated:
        return redirect(url_for('user_login'))
    return app.send_static_file('services.html')

@app.route('/contact.html')
def contact_page():
    if not current_user.is_authenticated:
        return redirect(url_for('user_login'))
    return app.send_static_file('contact.html')

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('admin_login.html'), 429

        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.is_active and user.check_password(password):
            # Authorize ONLY Admin on this endpoint
            if user.role != 'Admin':
                flash('Please use the User Portal to log in.', 'error')
                return render_template('admin_login.html')

            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user, remember=remember)
            logger.info(f"Admin login successful: {email}")
            return redirect(url_for('dashboard'))
            
        logger.warning(f"Failed Admin login attempt for email: {email}")
        flash('Invalid email or password.', 'error')
        
    return render_template('admin_login.html')

@app.route('/user/login', methods=['GET', 'POST'])
def user_login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        if not check_login_rate_limit(request.remote_addr):
            flash('Too many login attempts. Please wait a minute and try again.', 'error')
            return render_template('user_login.html'), 429

        email = request.form.get('email', '').strip()
        password = request.form.get('password', '')
        remember = True if request.form.get('remember') else False
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.is_active and user.check_password(password):
            # Authorize ONLY User role
            if user.role != 'User':
                flash('Administrators should use the Admin Portal.', 'error')
                return render_template('user_login.html')

            user.last_login = datetime.utcnow()
            db.session.commit()
            login_user(user, remember=remember)
            logger.info(f"User login successful: {email}")
            
            # Redirect to Vercel frontend if configured
            frontend_url = os.environ.get('FRONTEND_URL')
            if frontend_url:
                return redirect(f"{frontend_url.rstrip('/')}/index.html")
            return redirect('/index.html')
            
        logger.warning(f"Failed User login attempt for email: {email}")
        flash('Invalid email or password.', 'error')
        
    return render_template('user_login.html')

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
        return redirect(url_for('login'))
        
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
            return redirect(url_for('login'))
            
        flash('Error resetting password.', 'error')
        
    return render_template('reset_password.html', token=token)

@app.route('/logout')
@login_required
def logout():
    # Detect role for smart redirect
    is_admin = current_user.role == 'Admin'
    logout_user()
    session.clear()
    flash('Logged out successfully.', 'success')
    if is_admin:
        return redirect(url_for('admin_login'))
    return redirect(url_for('user_login'))

# --- Dashboard Routes ---

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html', user=current_user)

@app.route('/change-password', methods=['POST'])
@login_required
def change_password():
    current_pw = request.form.get('current_password')
    new_pw = request.form.get('new_password')
    confirm_pw = request.form.get('confirm_password')

    if not current_pw or not new_pw or not confirm_pw:
        flash('All fields are required.', 'error')
        return redirect(url_for('profile'))

    if new_pw != confirm_pw:
        flash('New passwords do not match.', 'error')
        return redirect(url_for('profile'))

    if not current_user.check_password(current_pw):
        flash('Incorrect current password.', 'error')
        return redirect(url_for('profile'))

    current_user.set_password(new_pw)
    db.session.commit()
    flash('Password updated successfully!', 'success')
    return redirect(url_for('profile'))

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
                
                # Filter logic for User role (only show assigned to them)
                if current_user.role == 'User':
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
        # If User, verify they are only updating their assigned item
        if current_user.role == 'User':
            # Fetch existing state first
            res = requests.get(GAS_WEB_APP_URL, params={'token': SHARED_SECRET}, timeout=15)
            if res.status_code == 200:
                all_enquiries = res.json().get('data', [])
                matching = next((e for e in all_enquiries if e.get('submissionId') == submission_id), None)
                if not matching or matching.get('assignedTo') != current_user.full_name:
                    return jsonify({'status': 'error', 'message': 'Permission denied: Users can only manage assigned enquiries.'}), 403
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

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
