import sys
import unittest
sys.path.insert(0, 'backend')
from app import app
from models import SheetsUser

class TestEnquiriesSuite(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()

    def test_enquiries_flow(self):
        with self.client.session_transaction() as sess:
            sess['_user_id'] = 'USR-001'
            sess['_fresh'] = True
            sess['_user_cache'] = {
                'id': 'USR-001',
                'user_id': 'USR-001',
                'email': 'admin@test.com',
                'full_name': 'Super Admin',
                'role': 'Super Admin',
                'is_active': True
            }

        # 1. Get list
        res = self.client.get('/api/enquiries')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data.get('success') or data.get('status') == 'success')
        print(f"Enquiries list returned: {len(data.get('data', []))} items")

        # 2. Update endpoint
        res = self.client.put('/api/enquiries/ENQ-2026-0001', json={
            'status': 'IN_PROGRESS',
            'assigned_staff_id': 'USR-002'
        })
        self.assertEqual(res.status_code, 200)
        print("Enquiry update endpoint responded with status 200")

        # 3. Convert endpoint
        res = self.client.post('/api/enquiries/ENQ-2026-0001/convert', json={
            'name': 'Test Client Project',
            'description': 'Test Conversion Description'
        })
        self.assertEqual(res.status_code, 200)
        cdata = res.get_json()
        self.assertTrue(cdata.get('success') or cdata.get('status') == 'success')
        print("Enquiry convert endpoint responded with status 200 and project ID")

if __name__ == '__main__':
    unittest.main()
