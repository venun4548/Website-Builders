import os

# Serverless / Cloud environment check for Vercel/Render read-only filesystems
if 'VERCEL' in os.environ or 'RENDER' in os.environ or os.environ.get('VERCEL_ENV') or os.environ.get('SERVERLESS'):
    default_db = 'sqlite:////tmp/database.db'
else:
    default_db = 'sqlite:///database.db'

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'de34f56a29bc718de11e9f45b6ccba9a2245fb0a')
    
    db_uri = os.environ.get('DATABASE_URL', default_db)
    if db_uri and db_uri.startswith('postgres://'):
        db_uri = db_uri.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_DATABASE_URI = db_uri
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Session options
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 86400 * 30  # 30 days
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "100 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
    
    # Password Reset config
    RESET_TOKEN_EXPIRY_MINUTES = 15

    # Admin Access PIN (Two-Step Verification Gate)
    ADMIN_PORTAL_ACCESS_PIN = os.environ.get('ADMIN_PORTAL_ACCESS_PIN', '7788')
    ADMIN_PIN_SESSION_MINUTES = 15

    # Google Sheets ID for loading dashboard data
    SPREADSHEET_ID = '1BbDho5uGScPbuDxL2nWaNFpwESUsb6CWcY9vJkeYuUk'
