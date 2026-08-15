import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'de34f56a29bc718de11e9f45b6ccba9a2245fb0a')

    # ─── NO DATABASE ───────────────────────────────────────────
    # Google Sheets is the sole permanent storage.
    # All data reads/writes go through Google Apps Script (GAS).
    SQLALCHEMY_DATABASE_URI   = None   # kept to avoid import errors; unused
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ─── Google Apps Script Backend ────────────────────────────
    # Set GAS_WEB_APP_URL in Vercel / Render environment variables
    # to the deployed Apps Script Web App URL.
    GAS_URL    = os.environ.get('GAS_WEB_APP_URL', '')
    GAS_SECRET = os.environ.get('GAS_SECRET', 'sec_wb_crm_77c4e569bbd18f0a1c6a58')

    # Google Spreadsheet ID (informational)
    SPREADSHEET_ID = '1BbDho5uGScPbuDxL2nWaNFpwESUsb6CWcY9vJkeYuUk'

    # ─── Session / Cookie Options ──────────────────────────────
    SESSION_COOKIE_HTTPONLY  = True
    SESSION_COOKIE_SECURE    = False   # True in production (HTTPS)
    REMEMBER_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_DURATION = 86400 * 30   # 30 days

    # ─── Admin PIN Gate ────────────────────────────────────────
    ADMIN_PORTAL_ACCESS_PIN   = os.environ.get('ADMIN_PORTAL_ACCESS_PIN', '7788')
    ADMIN_PIN_SESSION_MINUTES = 15

    # ─── Rate Limiting (in-memory) ─────────────────────────────
    RATELIMIT_DEFAULT     = "100 per hour"
    RATELIMIT_STORAGE_URI = "memory://"
