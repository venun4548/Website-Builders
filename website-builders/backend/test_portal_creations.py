import unittest
from app import app, db, User, Project, Website, Task

class PortalCreationTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = app
        cls.app.config['TESTING'] = True
        with cls.app.app_context():
            db.create_all()
            sa = User.query.filter_by(email='super@websitebuilders.com').first()
            if not sa:
                sa = User(full_name='Super Admin', email='super@websitebuilders.com', mobile='+91 9999999999', role='Super Admin', is_active=True)
                sa.set_password('Super@1234')
                db.session.add(sa)
            db.session.commit()

    def setUp(self):
        with self.app.app_context():
            # Clean up test users created in previous runs
            for email in ['jane.staff@websitebuilders.com', 'alex.admin@websitebuilders.com']:
                u = User.query.filter_by(email=email).first()
                if u:
                    db.session.delete(u)
            db.session.commit()

        self.client = self.app.test_client()
        # Verify PIN gate
        self.client.post('/api/admin/access/verify', json={'pin': '7788'})
        # Login as Super Admin
        self.client.post('/admin/login', data={'email': 'super@websitebuilders.com', 'password': 'Super@1234', 'role': 'Super Admin'})

    def test_01_create_staff_member(self):
        print("\n--- Test 1: Create Staff Member ---")
        res = self.client.post('/api/super-admin/users', json={
            'full_name': 'Jane Staff',
            'email': 'jane.staff@websitebuilders.com',
            'mobile': '+91 9876543210',
            'password': 'StaffPass@123',
            'role': 'Staff',
            'status': True
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        print("[PASSED] Staff member created successfully")

    def test_02_create_admin_member(self):
        print("\n--- Test 2: Create Admin Member ---")
        res = self.client.post('/api/super-admin/users', json={
            'full_name': 'Alex Admin',
            'email': 'alex.admin@websitebuilders.com',
            'mobile': '+91 9876543211',
            'password': 'AdminPass@123',
            'role': 'Admin',
            'status': True
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        print("[PASSED] Admin member created successfully")

    def test_03_create_project(self):
        print("\n--- Test 3: Create Project ---")
        res = self.client.post('/api/projects', json={
            'name': 'Enterprise Portal Redesign',
            'customer_id': '1',
            'stage': 'Requirement Gathering'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        print("[PASSED] Project created successfully")

    def test_04_create_website(self):
        print("\n--- Test 4: Create Website ---")
        res = self.client.post('/api/websites', json={
            'name': 'Enterprise Corporate Site',
            'domain': 'enterprise.com',
            'client_id': '1'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        print("[PASSED] Website created successfully")

    def test_05_create_task(self):
        print("\n--- Test 5: Create Task ---")
        res = self.client.post('/api/tasks', json={
            'title': 'Design Database Schema',
            'priority': 'High'
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data['status'], 'success')
        print("[PASSED] Task created successfully")

    def test_06_admin_login_page_no_user_option(self):
        print("\n--- Test 6: Verify Admin Login Page Role Select ---")
        fresh_client = self.app.test_client()
        fresh_client.post('/api/admin/access/verify', json={'pin': '7788'})
        res = fresh_client.get('/admin/login')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn(b'value="User"', res.data)
        self.assertIn(b'value="Admin"', res.data)
        self.assertIn(b'value="Staff"', res.data)
        self.assertIn(b'value="Super Admin"', res.data)
        print("[PASSED] Admin login page verified (Only Admin, Staff, Super Admin options present)")

if __name__ == '__main__':
    unittest.main()
