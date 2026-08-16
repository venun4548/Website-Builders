"""
models.py — Session-backed User model for Google Sheets storage system.
No SQLAlchemy / database ORM. All data comes from Google Sheets via GAS.
"""
from datetime import datetime, timedelta
from flask_login import UserMixin

IST_OFFSET = timedelta(hours=5, minutes=30)


def ist_now():
    return datetime.utcnow() + IST_OFFSET


def format_ist(dt=None, fmt="%d-%m-%Y %H:%M:%S"):
    if dt is None:
        dt = ist_now()
    return dt.strftime(fmt)


class SheetsUser(UserMixin):
    """
    Flask-Login compatible user backed by data from Google Sheets.
    Instantiated at login time with data returned from GAS loginUser().
    Cached in Flask session to avoid repeated GAS lookups.
    """
    def __init__(self, data: dict):
        # Accept both 'user_id' and 'id' from GAS responses
        self.id           = str(data.get('user_id') or data.get('id') or '')
        self.full_name    = str(data.get('full_name', ''))
        self.email        = str(data.get('email', '')).lower()
        self.mobile       = str(data.get('mobile', ''))
        self.role         = str(data.get('role', ''))
        self.status       = str(data.get('status', 'ACTIVE'))
        self.last_login   = str(data.get('last_login', ''))
        self.created_at = None
        self.assigned_staff_id = str(data.get('assigned_staff_id', ''))

    @property
    def is_active(self):
        return self.status.upper() == 'ACTIVE'

    # Flask-Login requires get_id()
    def get_id(self):
        return str(self.id)

    # Convenience role checks
    def is_super_admin(self):
        return self.role.lower() in ('super admin', 'super_admin', 'superadmin')

    def is_admin(self):
        return self.role.lower() == 'admin'

    def is_staff(self):
        return self.role.lower() == 'staff'

    def is_user(self):
        return self.role.lower() in ('user', 'client', 'customer')

    def to_dict(self):
        """Return a safe dict (no password) suitable for session caching."""
        return {
            'user_id'          : self.id,
            'id'               : self.id,
            'full_name'        : self.full_name,
            'email'            : self.email,
            'mobile'           : self.mobile,
            'role'             : self.role,
            'status'           : self.status,
            'is_active'        : self.is_active,
            'last_login'       : self.last_login,
            'assigned_staff_id': self.assigned_staff_id,
        }

    def __repr__(self):
        return f'<SheetsUser {self.id} {self.email} [{self.role}]>'
