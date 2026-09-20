import requests

GAS_URL = 'https://script.google.com/macros/s/AKfycbzOHqf47OudqBUULE8wLrMv-lWVN8InExF56vd_AL8PlE3zA_u65se3SPbc4P1K6ePkjQ/exec'
GAS_SECRET = 'sec_wb_crm_77c4e569bbd18f0a1c6a58'

p = {'token': GAS_SECRET, 'action': 'getUser', 'user_id': 'USR-2026-000005'}
resp = requests.get(GAS_URL, params=p, timeout=20)
print("Status:", resp.status_code)
print("Response text:", resp.text[:500])
