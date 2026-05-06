import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:5000/api"

def make_request(url, method="GET", headers=None, data=None):
    if headers is None: headers = {}
    if data:
        data = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("--- 1. Login as Admin ---")
status, login_data = make_request(f"{BASE_URL}/auth/login", "POST", data={
    "email": "admin@example.com", "password": "admin123"
})
print("Login status:", status)
token = login_data.get("access_token")

print("\n--- 2. Register Payment ---")
status, payment_rc = make_request(
    f"{BASE_URL}/payments/", "POST",
    headers={"Authorization": f"Bearer {token}"},
    data={"athlete_id": 1, "amount": 100.50, "status": "PAID", "payment_method": "Credit Card", "description": "Mensualidad Mayo"}
)
print("Create Payment status:", status)
print(json.dumps(payment_rc, indent=2))

print("\n--- 3. View Payments as Admin ---")
status, view_rc = make_request(
    f"{BASE_URL}/payments/athlete/1", "GET",
    headers={"Authorization": f"Bearer {token}"}
)
print("View Payments status:", status)
print(json.dumps(view_rc, indent=2))

