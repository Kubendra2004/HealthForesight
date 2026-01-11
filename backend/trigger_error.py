import requests
import json

url = "http://localhost:8000/frontdesk/appointments"
payload = {
    "patient_id": "test",
    "doctor_id": "doc999",
    "date": "2024-12-25T10:00:00Z",
    "reason": "Test Error Trigger",
    "type": "in-person"
}

try:
    # Health Check
    try:
        health = requests.get("http://localhost:8000/")
        print(f"Health Check: {health.status_code}")
    except Exception as e:
        print(f"Health Check Failed: {e}")

    # Trigger Error
    res = requests.post(url, json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(e)
