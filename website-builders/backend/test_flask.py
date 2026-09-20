import traceback
from app import app
import json

try:
    with app.test_client() as client:
        print("\nFetching /api/projects")
        resp = client.get('/api/projects')
        print(f"Status: {resp.status_code}")
        print("Response:", resp.text)
        
        print("\nFetching /api/super-admin/users/USR-2026-000005")
        resp = client.get('/api/super-admin/users/USR-2026-000005')
        print(f"Status: {resp.status_code}")
        print("Response:", resp.text)
except Exception as e:
    traceback.print_exc()
