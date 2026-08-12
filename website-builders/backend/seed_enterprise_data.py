import sys
from datetime import datetime, timedelta
from app import app
from models import db, User, Project, Website, Task, Message, AuditLog, Notification, StaffAssignment

def seed_data():
    with app.app_context():
        db.create_all()
        print("Ensuring database seed records...")

        # 1. Super Admin
        sa = User.query.filter_by(email='super@websitebuilders.com').first()
        if not sa:
            sa = User(full_name='Super Administrator', email='super@websitebuilders.com', mobile='+91 9999999999', role='Super Admin', is_active=True)
            sa.set_password('Super@1234')
            db.session.add(sa)

        # 2. Admins
        admin1 = User.query.filter_by(email='admin@websitebuilders.com').first()
        if not admin1:
            admin1 = User(full_name='Operations Manager', email='admin@websitebuilders.com', mobile='+91 7386204885', role='Admin', is_active=True)
            admin1.set_password('Admin@1234')
            db.session.add(admin1)

        admin2 = User.query.filter_by(email='sarah.admin@websitebuilders.com').first()
        if not admin2:
            admin2 = User(full_name='Sarah Jenkins', email='sarah.admin@websitebuilders.com', mobile='+91 8887776665', role='Admin', is_active=True)
            admin2.set_password('Admin@1234')
            db.session.add(admin2)

        # 3. Staff Members
        staff1 = User.query.filter_by(email='staff@websitebuilders.com').first()
        if not staff1:
            staff1 = User(full_name='Rahul Kumar', email='staff@websitebuilders.com', mobile='+91 9876543210', role='Staff', is_active=True)
            staff1.set_password('Staff@1234')
            db.session.add(staff1)

        staff2 = User.query.filter_by(email='priya.staff@websitebuilders.com').first()
        if not staff2:
            staff2 = User(full_name='Priya Sharma', email='priya.staff@websitebuilders.com', mobile='+91 9876543211', role='Staff', is_active=True)
            staff2.set_password('Staff@1234')
            db.session.add(staff2)

        staff3 = User.query.filter_by(email='arun.staff@websitebuilders.com').first()
        if not staff3:
            staff3 = User(full_name='Arun Patel', email='arun.staff@websitebuilders.com', mobile='+91 9876543212', role='Staff', is_active=True)
            staff3.set_password('Staff@1234')
            db.session.add(staff3)

        # 4. Clients
        client1 = User.query.filter_by(email='user@websitebuilders.com').first()
        if not client1:
            client1 = User(full_name='Venu Gopal', email='user@websitebuilders.com', mobile='+91 7386204885', role='User', is_active=True)
            client1.set_password('User@1234')
            db.session.add(client1)

        client2 = User.query.filter_by(email='apex.client@company.com').first()
        if not client2:
            client2 = User(full_name='Apex Enterprises', email='apex.client@company.com', mobile='+91 9123456789', role='User', is_active=True)
            client2.set_password('User@1234')
            db.session.add(client2)

        db.session.commit()

        # Re-fetch ids
        sa = User.query.filter_by(email='super@websitebuilders.com').first()
        admin1 = User.query.filter_by(email='admin@websitebuilders.com').first()
        staff1 = User.query.filter_by(email='staff@websitebuilders.com').first()
        staff2 = User.query.filter_by(email='priya.staff@websitebuilders.com').first()
        staff3 = User.query.filter_by(email='arun.staff@websitebuilders.com').first()
        client1 = User.query.filter_by(email='user@websitebuilders.com').first()
        client2 = User.query.filter_by(email='apex.client@company.com').first()

        # 5. Projects
        p1 = Project.query.filter_by(project_id='WBP-20260812-0001').first()
        if not p1:
            p1 = Project(
                project_id='WBP-20260812-0001',
                name='E-Commerce Platform Redesign',
                customer_id=client1.id,
                assigned_staff_id=staff1.id,
                start_date=datetime.utcnow().date() - timedelta(days=10),
                expected_delivery=datetime.utcnow().date() + timedelta(days=15),
                status='In Progress',
                stage='UI Design',
                progress=65
            )
            db.session.add(p1)

        p2 = Project.query.filter_by(project_id='WBP-20260812-0002').first()
        if not p2:
            p2 = Project(
                project_id='WBP-20260812-0002',
                name='SaaS Operations Portal',
                customer_id=client2.id,
                assigned_staff_id=staff2.id,
                start_date=datetime.utcnow().date() - timedelta(days=20),
                expected_delivery=datetime.utcnow().date() + timedelta(days=5),
                status='In Progress',
                stage='Development',
                progress=85
            )
            db.session.add(p2)

        p3 = Project.query.filter_by(project_id='WBP-20260812-0003').first()
        if not p3:
            p3 = Project(
                project_id='WBP-20260812-0003',
                name='Corporate Mobile API Gateway',
                customer_id=client1.id,
                assigned_staff_id=staff3.id,
                start_date=datetime.utcnow().date() - timedelta(days=30),
                expected_delivery=datetime.utcnow().date() - timedelta(days=2),
                status='Completed',
                stage='Deployment',
                progress=100
            )
            db.session.add(p3)

        db.session.commit()
        p1 = Project.query.filter_by(project_id='WBP-20260812-0001').first()
        p2 = Project.query.filter_by(project_id='WBP-20260812-0002').first()
        p3 = Project.query.filter_by(project_id='WBP-20260812-0003').first()

        # 6. Websites
        w1 = Website.query.filter_by(name='VenuGopal Official Store').first()
        if not w1:
            w1 = Website(client_id=client1.id, project_id=p1.id, name='VenuGopal Official Store', domain='venugopal-store.com', status='Building')
            db.session.add(w1)

        w2 = Website.query.filter_by(name='Apex Corporate Portal').first()
        if not w2:
            w2 = Website(client_id=client2.id, project_id=p2.id, name='Apex Corporate Portal', domain='apex-portal.io', status='Review')
            db.session.add(w2)

        # 7. Tasks
        if Task.query.count() == 0:
            tasks = [
                Task(project_id=p1.id, assigned_staff_id=staff1.id, title='Fix Homepage Responsiveness', description='Optimize grid breakpoints for mobile screens.', priority='High', status='In Progress', due_date=datetime.utcnow().date()),
                Task(project_id=p1.id, assigned_staff_id=staff1.id, title='Integrate Payment Gateway API', description='Stripe & Razorpay payment integration.', priority='Urgent', status='Todo', due_date=datetime.utcnow().date() + timedelta(days=3)),
                Task(project_id=p2.id, assigned_staff_id=staff2.id, title='Configure Role-Based Access Control', description='Verify Flask security decorators and 403 responses.', priority='High', status='In Progress', due_date=datetime.utcnow().date() + timedelta(days=1)),
                Task(project_id=p2.id, assigned_staff_id=staff2.id, title='Optimize Database Query Performance', description='Add indexing to frequent foreign keys.', priority='Normal', status='Todo', due_date=datetime.utcnow().date() + timedelta(days=4)),
                Task(project_id=p3.id, assigned_staff_id=staff3.id, title='Final Security Audit & Load Test', description='Penetration test report generation.', priority='High', status='Completed', due_date=datetime.utcnow().date() - timedelta(days=2), completed_at=datetime.utcnow())
            ]
            db.session.add_all(tasks)

        # 8. Staff Assignments
        if StaffAssignment.query.count() == 0:
            assignments = [
                StaffAssignment(staff_id=staff1.id, client_id=client1.id, project_id=p1.id, website_id=w1.id),
                StaffAssignment(staff_id=staff2.id, client_id=client2.id, project_id=p2.id, website_id=w2.id),
                StaffAssignment(staff_id=staff3.id, client_id=client1.id, project_id=p3.id)
            ]
            db.session.add_all(assignments)

        # 9. Audit Logs
        if AuditLog.query.count() == 0:
            logs = [
                AuditLog(action='System Initialization', user_email='super@websitebuilders.com', status='Success'),
                AuditLog(action='Created Staff Account', user_email='admin@websitebuilders.com', target_user='staff@websitebuilders.com', status='Success'),
                AuditLog(action='Assigned Staff to Project', user_email='admin@websitebuilders.com', target_user='staff@websitebuilders.com', status='Success'),
                AuditLog(action='Updated Task Status', user_email='staff@websitebuilders.com', status='Success')
            ]
            db.session.add_all(logs)

        # 10. Messages & Notifications
        if Message.query.count() == 0:
            msgs = [
                Message(sender_id=admin1.id, receiver_id=staff1.id, subject='Project Milestone Delivery', body='Hi Rahul, please prioritize the payment gateway API integration task today.'),
                Message(sender_id=staff1.id, receiver_id=admin1.id, subject='Re: Project Milestone Delivery', body='Understood. Homepage responsiveness fix is almost done, starting API integration next.')
            ]
            db.session.add_all(msgs)

        if Notification.query.count() == 0:
            notifs = [
                Notification(user_id=staff1.id, type='task_assigned', title='New High Priority Task', message='You were assigned: Fix Homepage Responsiveness'),
                Notification(user_id=admin1.id, type='project_update', title='Project Stage Advanced', message='E-Commerce Platform Redesign advanced to UI Design stage.')
            ]
            db.session.add_all(notifs)

        db.session.commit()
        print("Database seeded with enterprise operational data successfully.")

if __name__ == '__main__':
    seed_data()
