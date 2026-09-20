import requests

try:
    resp = requests.get('http://127.0.0.1:5000/favicon.ico')
    print("favicon status:", resp.status_code)
    print("favicon text:", resp.text[:500])
except Exception as e:
    print("Error:", e)

try:
    resp = requests.get('http://127.0.0.1:5000/access')
    print("access status:", resp.status_code)
    print("access text:", resp.text[:500])
except Exception as e:
    print("Error:", e)
