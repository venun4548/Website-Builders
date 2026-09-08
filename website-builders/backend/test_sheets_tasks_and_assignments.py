import unittest
from unittest.mock import patch
from app import app
from models import SheetsUser

class TestTasksAndAssignments(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['WTF_CSRF_ENABLED'] = False
        self.client = app.test_client()

    @patch('app.call_gas')
    @patch('app.gas_get')
    def test_create_and_get_tasks(self, mock_gas_get, mock_call_gas):
        # Mock admin user in session
        with self.client.session_transaction() as sess:
            sess['_user_cache'] = {
                'id': 'USR-2026-000001',
                'user_id': 'USR-2026-000001',
                'full_name': 'Super Admin',
                'email': 'super@websitebuilders.com',
                'role': 'Super Admin',
                'status': 'ACTIVE'
            }
            sess['_user_id'] = 'USR-2026-000001'

        mock_call_gas.return_value = {
            'status': 'success',
            'data': {'id': 'TSK-2026-000001', 'task_id': 'TSK-2026-000001', 'title': 'Test Task', 'status': 'Pending'}
        }
        mock_gas_get.return_value = {
            'status': 'success',
            'data': [{'task_id': 'TSK-2026-000001', 'title': 'Test Task', 'status': 'Pending', 'assigned_staff_name': 'Staff One'}]
        }

        # 1. Create task
        res_post = self.client.post('/api/tasks', json={
            'title': 'Test Task',
            'priority': 'High',
            'assigned_staff_id': 'USR-2026-000002'
        })
        self.assertEqual(res_post.status_code, 200)
        self.assertTrue(res_post.get_json()['success'])
        mock_call_gas.assert_called_with('createTask', {
            'title': 'Test Task',
            'priority': 'High',
            'assigned_staff_id': 'USR-2026-000002',
            'created_by': 'USR-2026-000001'
        })

        # 2. Get tasks
        res_get = self.client.get('/api/tasks')
        self.assertEqual(res_get.status_code, 200)
        data = res_get.get_json()
        self.assertTrue(data['success'])
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['status'], 'Pending')

    @patch('app.call_gas')
    def test_update_task_status(self, mock_call_gas):
        with self.client.session_transaction() as sess:
            sess['_user_cache'] = {
                'id': 'USR-2026-000002',
                'user_id': 'USR-2026-000002',
                'full_name': 'Staff Member',
                'email': 'staff@websitebuilders.com',
                'role': 'Staff',
                'status': 'ACTIVE'
            }
            sess['_user_id'] = 'USR-2026-000002'

        mock_call_gas.return_value = {'status': 'success', 'message': 'Task updated.'}

        res_put = self.client.put('/api/tasks/TSK-2026-000001', json={'status': 'Completed'})
        self.assertEqual(res_put.status_code, 200)
        self.assertTrue(res_put.get_json()['success'])
        mock_call_gas.assert_called_with('updateTask', {
            'task_id': 'TSK-2026-000001',
            'status': 'Completed',
            'updated_by': 'USR-2026-000002'
        })

    @patch('app.call_gas')
    def test_assign_staff_to_user(self, mock_call_gas):
        with self.client.session_transaction() as sess:
            sess['_user_cache'] = {
                'id': 'USR-2026-000001',
                'user_id': 'USR-2026-000001',
                'full_name': 'Super Admin',
                'email': 'super@websitebuilders.com',
                'role': 'Super Admin',
                'status': 'ACTIVE'
            }
            sess['_user_id'] = 'USR-2026-000001'

        mock_call_gas.return_value = {'status': 'success', 'message': 'Staff assigned to client successfully.'}

        res = self.client.post('/api/super-admin/users/USR-2026-000005/assign-staff', json={
            'assigned_staff_id': 'USR-2026-000002'
        })
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.get_json()['success'])
        mock_call_gas.assert_called_with('assignStaffToUser', {
            'user_id': 'USR-2026-000005',
            'assigned_staff_id': 'USR-2026-000002',
            'assigned_by': 'USR-2026-000001'
        })

if __name__ == '__main__':
    unittest.main()
