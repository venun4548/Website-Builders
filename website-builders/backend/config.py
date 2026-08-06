import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'de34f56a29bc718de11e9f45b6ccba9a2245fb0a')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 
        'sqlite:////data/database.db' if os.environ.get('RENDER') else 'sqlite:///database.db')
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

    # Google Sheets ID for loading dashboard data
    SPREADSHEET_ID = '1BbDho5uGScPbuDxL2nWaNFpwESUsb6CWcY9vJkeYuUk'
