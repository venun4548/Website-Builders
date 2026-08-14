import unittest
from datetime import datetime, timedelta
from app import app, db, User, Project, Website, Task, Message, AuditLog, Notification, StaffAssignment

class ComprehensiveEnterpriseAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config['TESTING'] = True
        with cls.app.app_context():
            db.create_all()

            # Ensure Seed Users safely
            sa = User.query.filter_by(email='super@websitebuilders.com').first()
            if not sa:
                sa = User(full_name='Super Administrator', email='super@websitebuilders.com', mobile='+91 9999999999', role='Super Admin', is_active=True)
                sa.set_password('Super@1234')
                db.session.add(sa)
            else:
                sa.role = 'Super Admin'
                sa.is_active = True

            admin = User.query.filter_by(email='admin@websitebuilders.com').first()
            if not admin:
                admin = User(full_name='System Administrator', email='admin@websitebuilders.com', mobile='+91 7386204885', role='Admin', is_active=True)
                admin.set_password('Admin@1234')
                db.session.add(admin)
            else:
                admin.role = 'Admin'
                admin.is_active = True

            staff = User.query.filter_by(email='staff@websitebuilders.com').first()
            if not staff:
                staff = User(full_name='Staff Member', email='staff@websitebuilders.com', mobile='+91 1111111111', role='Staff', is_active=True)
                staff.set_password('Staff@1234')
                db.session.add(staff)
            else:
                staff.role = 'Staff'
                staff.is_active = True

            db.session.commit()

    def setUp(self):
        self.client = self.app.test_client()

    # ==================================================
    # 1. SUPER ADMIN AUDIT
    # ==================================================
    def test_01_super_admin_full_crud(self):
        print("\n--- [AUDIT 1] Super Admin E2E Operations & Database Persistence ---")
        with self.client:
            self.client.post('/api/admin/access/verify', json={'pin': '7788'})
            res = self.client.post('/admin/login', data={'email':'super@websitebuilders.com', 'password':'Super@1234', 'role':'Super Admin'}, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Create Staff
            res_create = self.client.post('/api/super-admin/users', json={
                'full_name': 'E2E Test Staff',
                'email': 'e2e.staff@company.com',
                'mobile': '+91 9991112223',
                'password': 'Staff@1234',
                'role': 'Staff',
                'status': True
            })
            self.assertEqual(res_create.status_code, 200)
            print("[SUCCESS] Super Admin: Created Staff Account via API")

            # DB Verification
            with self.app.app_context():
                user_record = User.query.filter_by(email='e2e.staff@company.com').first()
                self.assertIsNotNone(user_record)
                target_id = user_record.id

            # Edit Staff
            res_edit = self.client.put(f'/api/super-admin/users/{target_id}', json={'full_name': 'E2E Staff Updated', 'mobile': '+91 9991112224', 'status': True})
            self.assertEqual(res_edit.status_code, 200)
            with self.app.app_context():
                upd = User.query.get(target_id)
                self.assertEqual(upd.full_name, 'E2E Staff Updated')
            print("[SUCCESS] Super Admin: Updated Staff Account")

            # Deactivate Staff
            res_deact = self.client.put(f'/api/super-admin/users/{target_id}', json={'status': False})
            self.assertEqual(res_deact.status_code, 200)
            with self.app.app_context():
                upd = User.query.get(target_id)
                self.assertFalse(upd.is_active)
            print("[SUCCESS] Super Admin: Deactivated Staff Account")

            # Activate Staff
            res_act = self.client.put(f'/api/super-admin/users/{target_id}', json={'status': True})
            self.assertEqual(res_act.status_code, 200)
            with self.app.app_context():
                upd = User.query.get(target_id)
                self.assertTrue(upd.is_active)
            print("[SUCCESS] Super Admin: Re-activated Staff Account")

            # Delete Staff
            res_del = self.client.delete(f'/api/super-admin/users/{target_id}')
            self.assertEqual(res_del.status_code, 200)
            with self.app.app_context():
                del_rec = User.query.filter_by(email='e2e.staff@company.com').first()
                self.assertIsNone(del_rec)
            print("[SUCCESS] Super Admin: Deleted Staff Account & Verified DB Cleanliness")

            self.client.get('/logout')

    # ==================================================
    # 2. ADMIN ROLE SECURITY AUDIT
    # ==================================================
    def test_02_admin_security_bounds(self):
        print("\n--- [AUDIT 2] Admin Security Guards & Privilege Restrictions ---")
        with self.client:
            self.client.post('/api/admin/access/verify', json={'pin': '7788'})
            res = self.client.post('/admin/login', data={'email':'admin@websitebuilders.com', 'password':'Admin@1234', 'role':'Admin'}, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Attempt Create Super Admin -> Must be rejected
            res_sa = self.client.post('/api/super-admin/users', json={
                'full_name': 'Attacker SA',
                'email': 'attacker.sa@company.com',
                'mobile': '+91 9990001112',
                'password': 'Super@1234',
                'role': 'Super Admin'
            })
            res_data = res_sa.get_json()
            self.assertTrue(res_data['status'] == 'error' or res_sa.status_code == 403)
            print("[SUCCESS] Security Guard: Admin blocked from creating Super Admin account")

            # Attempt Change Super Admin Role -> Must be rejected
            with self.app.app_context():
                sa_user = User.query.filter_by(email='super@websitebuilders.com').first()
                sa_id = sa_user.id

            res_role = self.client.put(f'/api/super-admin/users/{sa_id}/change-role', json={'role': 'Staff'})
            if res_role.status_code == 200:
                self.assertEqual(res_role.get_json()['status'], 'error')
            else:
                self.assertEqual(res_role.status_code, 403)
            print("[SUCCESS] Security Guard: Admin blocked from modifying Super Admin role")

            self.client.get('/logout')

    # ==================================================
    # 3. STAFF PRIVILEGES & RBAC DIRECT URL TESTING
    # ==================================================
    def test_03_staff_rbac_and_api_security(self):
        print("\n--- [AUDIT 3] Staff RBAC & Direct URL Security Guards ---")
        with self.client:
            self.client.post('/api/admin/access/verify', json={'pin': '7788'})
            res = self.client.post('/admin/login', data={'email':'staff@websitebuilders.com', 'password':'Staff@1234', 'role':'Staff'}, follow_redirects=True)
            self.assertEqual(res.status_code, 200)

            # Direct API Security Testing (Must return 403 Forbidden for Staff)
            endpoints = ['/api/super-admin/users', '/api/super-admin/audit-logs', '/api/admin/system-health', '/api/settings']
            for ep in endpoints:
                resp = self.client.get(ep)
                self.assertEqual(resp.status_code, 403, f"Staff not blocked on {ep}")
                print(f"[SUCCESS] Security Guard: Staff blocked with 403 Forbidden on {ep}")

            # Update assigned task
            with self.app.app_context():
                staff_user = User.query.filter_by(email='staff@websitebuilders.com').first()
                task = Task.query.filter_by(assigned_staff_id=staff_user.id).first() if staff_user else None
                task_id = task.id if task else None

            if task_id:
                res_upd = self.client.put(f'/api/tasks/{task_id}', json={'status': 'Completed'})
                self.assertEqual(res_upd.status_code, 200)
                with self.app.app_context():
                    completed_task = Task.query.get(task_id)
                    self.assertEqual(completed_task.status, 'Completed')
                print("[SUCCESS] Staff: Updated Assigned Task Status & Verified DB Persistence")

            self.client.get('/logout')

if __name__ == '__main__':
    unittest.main()
