from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='Staff')  # Super Admin, Admin, Staff
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)

    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    assigned_staff = db.relationship('User', remote_side=[id], foreign_keys=[assigned_staff_id], backref=db.backref('assigned_clients', lazy='dynamic'))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        if not self.password_hash or not password:
            return False
        try:
            return check_password_hash(self.password_hash, password)
        except Exception:
            return False

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'mobile': self.mobile,
            'role': self.role,
            'is_active': self.is_active,
            'assigned_staff_id': self.assigned_staff_id,
            'assigned_staff_name': self.assigned_staff.full_name if self.assigned_staff else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    action = db.Column(db.String(255), nullable=False)
    user_email = db.Column(db.String(120), nullable=False)
    target_user = db.Column(db.String(120), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action,
            'user_email': self.user_email,
            'target_user': self.target_user,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None,
            'iso_timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'status': self.status
        }

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    address = db.Column(db.String(255), nullable=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    submission_id = db.Column(db.String(100), nullable=True)
    start_date = db.Column(db.Date, nullable=True)
    expected_delivery = db.Column(db.Date, nullable=True)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    status = db.Column(db.String(50), default='ACTIVE')
    stage = db.Column(db.String(50), default='Requirement')
    progress = db.Column(db.Integer, default=10)
    latest_update = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = db.relationship('User', foreign_keys=[customer_id], backref=db.backref('projects', cascade='all, delete-orphan'))
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id], backref='assigned_projects')
    updates = db.relationship('ProjectUpdate', backref='project', cascade='all, delete-orphan')
    timelines = db.relationship('ProjectTimeline', backref='project', cascade='all, delete-orphan')
    remarks = db.relationship('ProjectRemark', backref='project', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'name': self.name,
            'description': self.description,
            'address': self.address,
            'customer_id': self.customer_id,
            'customer_name': self.customer.full_name if self.customer else None,
            'customer_email': self.customer.email if self.customer else None,
            'customer_mobile': self.customer.mobile if self.customer else None,
            'submission_id': self.submission_id,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'expected_delivery': self.expected_delivery.isoformat() if self.expected_delivery else None,
            'assigned_staff_id': self.assigned_staff_id,
            'assigned_staff_name': self.assigned_staff.full_name if self.assigned_staff else None,
            'status': self.status,
            'stage': self.stage,
            'progress': self.progress,
            'latest_update': self.latest_update or 'Project initiated.',
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }

class ProjectUpdate(db.Model):
    __tablename__ = 'project_updates'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    updated_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    updated_by = db.relationship('User', foreign_keys=[updated_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'updated_by_id': self.updated_by_id,
            'updated_by_name': self.updated_by.full_name if self.updated_by else 'System',
            'message': self.message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    message_id = db.Column(db.String(50), unique=True, index=True, nullable=True) # e.g. MSG-2026-000001
    conversation_id = db.Column(db.String(50), index=True, nullable=True) # e.g. CONV-2026-000001

    sender_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)

    sender_role = db.Column(db.String(50), nullable=True)
    receiver_name = db.Column(db.String(255), nullable=True)
    receiver_role = db.Column(db.String(50), nullable=True)

    recipient_type = db.Column(db.String(50), default='INDIVIDUAL') # INDIVIDUAL, TEAM, CLIENT, PROJECT
    message_type = db.Column(db.String(50), default='DIRECT') # DIRECT, TEAM, PROJECT, CUSTOMER, SYSTEM

    project_id = db.Column(db.String(50), nullable=True) # WB-2026-XXX or Project DB ID
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    subject = db.Column(db.String(255), nullable=True)
    body = db.Column(db.Text, nullable=False)
    attachment_url = db.Column(db.String(500), nullable=True)

    status = db.Column(db.String(50), default='SENT') # SENT, DELIVERED, READ, FAILED
    is_read = db.Column(db.Boolean, default=False)
    read_at = db.Column(db.DateTime, nullable=True)

    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sender = db.relationship('User', foreign_keys=[sender_id], backref=db.backref('sent_messages', lazy='dynamic', cascade='all, delete-orphan'))
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref=db.backref('received_messages', lazy='dynamic', cascade='all, delete-orphan'))
    customer = db.relationship('User', foreign_keys=[customer_id])

    def to_dict(self):
        created_dt = self.created_at or self.timestamp or datetime.utcnow()
        read_at_str = self.read_at.strftime("%d-%m-%Y %H:%M:%S") if self.read_at else ''

        s_name = self.sender.full_name if self.sender else 'System'
        s_role = self.sender_role or (self.sender.role if self.sender else 'System')

        r_name = self.receiver_name or (self.receiver.full_name if self.receiver else 'Team / All')
        r_role = self.receiver_role or (self.receiver.role if self.receiver else 'TEAM')

        msg_code = self.message_id or f"MSG-2026-{self.id:06d}"
        conv_code = self.conversation_id or f"CONV-2026-{self.id:06d}"

        return {
            'id': self.id,
            'message_id': msg_code,
            'conversation_id': conv_code,

            'sender_id': self.sender_id,
            'sender_name': s_name,
            'sender_role': s_role,

            'receiver_id': self.receiver_id or '',
            'receiver_name': r_name,
            'receiver_role': r_role,

            'recipient_type': self.recipient_type or 'INDIVIDUAL',
            'message_type': self.message_type or 'DIRECT',

            'project_id': self.project_id or '',
            'customer_id': self.customer_id or '',

            'subject': self.subject or '(No Subject)',
            'body': self.body or '',
            'message': self.body or '',
            'attachment_url': self.attachment_url or '',

            'status': self.status or ('READ' if self.is_read else 'SENT'),
            'is_read': self.is_read,
            'read_at': read_at_str,

            'created_date': created_dt.strftime("%d-%m-%Y"),
            'created_time': created_dt.strftime("%H:%M:%S"),
            'timestamp': created_dt.strftime("%d-%m-%Y %H:%M:%S"),
            'last_updated': (self.updated_at or created_dt).strftime("%d-%m-%Y %H:%M:%S")
        }

class Website(db.Model):
    __tablename__ = 'websites'

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    name = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='Draft') # Draft, Building, Review, Published, Paused, Archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship('User', foreign_keys=[client_id])
    project = db.relationship('Project', foreign_keys=[project_id])

    def to_dict(self):
        return {
            'id': self.id,
            'client_id': self.client_id,
            'project_id': self.project_id,
            'name': self.name,
            'domain': self.domain,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    priority = db.Column(db.String(50), default='Normal') # Low, Normal, High, Urgent
    status = db.Column(db.String(50), default='Todo') # Todo, In Progress, Review, Completed, Overdue
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)

    project = db.relationship('Project', backref=db.backref('tasks', cascade='all, delete-orphan'))
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id])

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'assigned_staff_id': self.assigned_staff_id,
            'assigned_staff_name': self.assigned_staff.full_name if self.assigned_staff else None,
            'title': self.title,
            'description': self.description,
            'priority': self.priority,
            'status': self.status,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # e.g. project_update, message, task_assigned
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class StaffAssignment(db.Model):
    __tablename__ = 'staff_assignments'

    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    unassigned_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='ACTIVE') # ACTIVE, PREVIOUS

    staff = db.relationship('User', foreign_keys=[staff_id])
    assigned_by = db.relationship('User', foreign_keys=[assigned_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'staff_id': self.staff_id,
            'staff_name': self.staff.full_name if self.staff else None,
            'client_id': self.client_id,
            'project_id': self.project_id,
            'assigned_by_name': self.assigned_by.full_name if self.assigned_by else 'Admin',
            'assigned_at': self.assigned_at.strftime('%Y-%m-%d %H:%M:%S') if self.assigned_at else None,
            'unassigned_at': self.unassigned_at.strftime('%Y-%m-%d %H:%M:%S') if self.unassigned_at else None,
            'status': self.status
        }

class ProjectFile(db.Model):
    __tablename__ = 'project_files'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    uploaded_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(50), default='Other') # Documents, Designs, Reports, Client Files, Other
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    uploaded_by = db.relationship('User', foreign_keys=[uploaded_by_id])
    project = db.relationship('Project', backref=db.backref('files', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'uploaded_by_name': self.uploaded_by.full_name if self.uploaded_by else 'System',
            'filename': self.filename,
            'filepath': self.filepath,
            'category': self.category,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(100), unique=True, nullable=False)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EnquiryState(db.Model):
    __tablename__ = 'enquiry_states'
    
    id = db.Column(db.Integer, primary_key=True)
    submission_id = db.Column(db.String(100), unique=True, nullable=False)
    status = db.Column(db.String(50), default='New')
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    is_converted = db.Column(db.Boolean, default=False)
    
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id])

class Enquiry(db.Model):
    __tablename__ = 'enquiries'

    id = db.Column(db.Integer, primary_key=True)
    enquiry_id = db.Column(db.String(100), unique=True, nullable=False) # e.g. ENQ-2026-0001
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    mobile = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(255), nullable=True)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(50), default='NEW') # NEW, CONTACTED, FOLLOW-UP, CONVERTED, CLOSED, REJECTED
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_converted = db.Column(db.Boolean, default=False)
    project_id = db.Column(db.String(50), nullable=True) # WB-2026-001
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = db.relationship('User', foreign_keys=[customer_id])
    assigned_staff = db.relationship('User', foreign_keys=[assigned_staff_id])

    def to_dict(self):
        return {
            'id': self.id,
            'enquiry_id': self.enquiry_id,
            'submission_id': self.enquiry_id,
            'customer_id': self.customer_id,
            'full_name': self.full_name,
            'email': self.email,
            'mobile': self.mobile,
            'address': self.address,
            'message': self.message,
            'status': self.status,
            'assigned_staff_id': self.assigned_staff_id,
            'assigned_staff_name': self.assigned_staff.full_name if self.assigned_staff else None,
            'is_converted': self.is_converted,
            'project_id': self.project_id,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }

class ProjectTimeline(db.Model):
    __tablename__ = 'project_timelines'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    stage = db.Column(db.String(50), nullable=False) # Requirement, Planning, UI Design, Development, Testing, Deployment, Support
    progress = db.Column(db.Integer, default=0)
    updated_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    updated_by = db.relationship('User', foreign_keys=[updated_by_id])

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'stage': self.stage,
            'progress': self.progress,
            'updated_by_name': self.updated_by.full_name if self.updated_by else 'System',
            'notes': self.notes,
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S') if self.timestamp else None
        }

class ProjectRemark(db.Model):
    __tablename__ = 'project_remarks'

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    staff_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    remark = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    staff = db.relationship('User', foreign_keys=[staff_id])

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'staff_id': self.staff_id,
            'staff_name': self.staff.full_name if self.staff else 'Staff',
            'remark': self.remark,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None
        }
