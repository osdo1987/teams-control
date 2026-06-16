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
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body

print("--- 1. Login as Admin ---")
status, login_data = make_request(f"{BASE_URL}/auth/login", "POST", data={
    "identification_number": "1140892301", "password": "admin123"
})
print("Login status:", status)
token = login_data.get("access_token")
headers = {"Authorization": f"Bearer {token}"}

print("\n--- 2. Create Training Plan with Cycles, Sessions, Exercises ---")
plan_payload = {
    "name": "Plan de Fuerza Básica",
    "description": "Un plan enfocado en hipertrofia y fuerza general.",
    "cycles": [
        {
            "name": "Ciclo 1: Adaptación",
            "description": "Semanas iniciales de acondicionamiento muscular.",
            "order": 1,
            "sessions": [
                {
                    "name": "Día 1: Empuje (Push)",
                    "notes": "Enfoque en pecho y tríceps.",
                    "order": 1,
                    "exercises": [
                        {
                            "exercise_name": "Press de Banca con Barra",
                            "sets": 4,
                            "reps": "10",
                            "weight": "60kg",
                            "rest_seconds": 90,
                            "notes": "Controlar la fase excéntrica."
                        },
                        {
                            "exercise_name": "Flexiones de pecho",
                            "sets": 3,
                            "reps": "Fallo",
                            "rest_seconds": 60
                        }
                    ]
                }
            ]
        }
    ]
}

status, plan_rc = make_request(
    f"{BASE_URL}/training-plans", "POST",
    headers=headers,
    data=plan_payload
)
print("Create Plan status:", status)
print(json.dumps(plan_rc, indent=2))
plan_id = plan_rc.get("id")

print("\n--- 3. List All Training Plans ---")
status, list_rc = make_request(
    f"{BASE_URL}/training-plans", "GET",
    headers=headers
)
print("List Plans status:", status)
print(f"Total plans found: {len(list_rc)}")

print("\n--- 4. Assign Plan to Athlete 1 ---")
assign_payload = {
    "athlete_id": 1,
    "start_date": "2026-06-16",
    "end_date": "2026-07-16"
}
status, assign_rc = make_request(
    f"{BASE_URL}/training-plans/{plan_id}/assign", "POST",
    headers=headers,
    data=assign_payload
)
print("Assign Plan status:", status)
print(json.dumps(assign_rc, indent=2))
assignment_id = assign_rc.get("id")

print("\n--- 5. Get Athlete 1 Training Plans ---")
status, ath_plans = make_request(
    f"{BASE_URL}/training-plans/athlete/1", "GET",
    headers=headers
)
print("Athlete Plans status:", status)
print(json.dumps(ath_plans, indent=2))

print("\n--- 6. Clean Up (Delete Plan) ---")
status, delete_rc = make_request(
    f"{BASE_URL}/training-plans/{plan_id}", "DELETE",
    headers=headers
)
print("Delete Plan status:", status)
print(delete_rc)
