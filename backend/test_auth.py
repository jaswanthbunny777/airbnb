"""
Authentication and booking integration tests.
Run from the backend directory with the FastAPI server running:
    python test_auth.py

Or run unit tests only (no server needed):
    python test_auth.py --unit-only
"""
import sys
import json
import random
import string
import argparse
import base64
import urllib.request
import urllib.error

BASE = "http://localhost:8000"


def random_email():
    suffix = "".join(random.choices(string.ascii_lowercase, k=8))
    return f"test_{suffix}@example.com"


def api(method, path, body=None, token=None):
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def run_tests():
    results = []

    def check(name, condition, detail=""):
        status = "PASS" if condition else "FAIL"
        results.append((status, name, detail))
        print(f"  [{status}] {name}" + (f" -- {detail}" if detail else ""))

    print("\n=== 1. Health Check ===")
    code, body = api("GET", "/api/health")
    check("Backend reachable", code == 200, str(body))

    print("\n=== 2. User Registration ===")
    email = random_email()
    password = "TestPass123!"
    code, body = api("POST", "/api/auth/register", {
        "email": email, "password": password,
        "first_name": "Test", "last_name": "User",
    })
    check("Register returns 200", code == 200, f"status={code}")
    check("Register returns access_token", "access_token" in body, str(body.get("access_token", "")[:20]))
    check("Register returns user object", "user" in body)
    token = body.get("access_token")
    user_id = body.get("user", {}).get("id")

    print("\n=== 3. Duplicate Registration ===")
    code2, body2 = api("POST", "/api/auth/register", {
        "email": email, "password": password,
        "first_name": "Test", "last_name": "User",
    })
    check("Duplicate email rejected (400)", code2 == 400, f"status={code2}")

    print("\n=== 4. Login with Valid Credentials ===")
    code, body = api("POST", "/api/auth/login", {"email": email, "password": password})
    check("Login returns 200", code == 200, f"status={code}")
    check("Login returns access_token", "access_token" in body)
    login_token = body.get("access_token")

    print("\n=== 5. Login with Invalid Credentials ===")
    code, body = api("POST", "/api/auth/login", {"email": email, "password": "wrongpassword"})
    check("Invalid password rejected (401)", code == 401, f"status={code}")

    print("\n=== 6. Auth Persistence - GET /me ===")
    code, body = api("GET", "/api/auth/me", token=login_token)
    check("GET /me returns 200 with valid token", code == 200, f"status={code}")
    check("GET /me returns correct email", body.get("email") == email, body.get("email"))
    check("GET /me returns correct user id", body.get("id") == user_id, f"{body.get('id')} == {user_id}")

    print("\n=== 7. Token Rejection ===")
    code, body = api("GET", "/api/auth/me", token="invalid.token.here")
    check("Invalid token rejected (401)", code == 401, f"status={code}")
    code, body = api("GET", "/api/auth/me")
    check("Missing token rejected (401)", code == 401, f"status={code}")

    print("\n=== 8. Unauthenticated Booking Rejected ===")
    code, body = api("POST", "/api/bookings", {
        "listing_id": 1, "check_in": "2027-06-01",
        "check_out": "2027-06-05", "num_guests": 1,
    })
    check("Unauthenticated booking rejected (401)", code == 401, f"status={code}")

    print("\n=== 9. Authenticated Booking ===")
    code, listings_body = api("GET", "/api/listings?page_size=50")
    bookable_listing = None
    if code == 200:
        for listing in listings_body.get("listings", []):
            host = listing.get("host") or {}
            if host.get("id") != user_id:
                bookable_listing = listing
                break

    if bookable_listing:
        import datetime
        rand_days = random.randint(300, 1500)
        c_in = (datetime.date.today() + datetime.timedelta(days=rand_days)).isoformat()
        c_out = (datetime.date.today() + datetime.timedelta(days=rand_days + 4)).isoformat()
        code, body = api("POST", "/api/bookings", {
            "listing_id": bookable_listing["id"],
            "check_in": c_in,
            "check_out": c_out,
            "num_guests": 1,
        }, token=login_token)
        check("Booking with valid token (201)", code == 201, f"status={code}, detail={body.get('detail', body.get('id'))}")
        if code == 201:
            check("Booking guest_id matches user", body.get("guest_id") == user_id, f"{body.get('guest_id')} == {user_id}")
    else:
        check("Booking test - no suitable listing found", False, "No listing found not owned by test user")

    print("\n=== 10. My Trips ===")
    code, body = api("GET", "/api/bookings/my-trips", token=login_token)
    check("GET /my-trips returns 200", code == 200, f"status={code}")
    check("GET /my-trips returns list", isinstance(body, list), str(type(body)))

    print("\n=== 11. User Isolation ===")
    other_email = random_email()
    code, other_body = api("POST", "/api/auth/register", {
        "email": other_email, "password": "Pass456!",
        "first_name": "Other", "last_name": "User",
    })
    other_token = other_body.get("access_token")
    code, body = api("GET", "/api/auth/me", token=other_token)
    check("Other user gets their own profile", body.get("email") == other_email, body.get("email"))
    check("Other user cannot access first user identity", body.get("id") != user_id, f"{body.get('id')} != {user_id}")

    print("\n=== 12. JWT Sub Is String ===")
    if login_token:
        try:
            parts = login_token.split(".")
            padded = parts[1] + "=" * (4 - len(parts[1]) % 4)
            payload = json.loads(base64.urlsafe_b64decode(padded))
            sub_val = payload.get("sub")
            check("JWT sub claim is a string", isinstance(sub_val, str), f"type={type(sub_val).__name__}, value={sub_val}")
        except Exception as e:
            check("JWT sub parsing failed", False, str(e))

    # Summary
    print("\n" + "=" * 50)
    passed = sum(1 for s, _, _ in results if s == "PASS")
    failed = sum(1 for s, _, _ in results if s == "FAIL")
    print(f"Results: {passed} PASSED, {failed} FAILED")
    if failed:
        print("\nFailed tests:")
        for status, name, detail in results:
            if status == "FAIL":
                print(f"  x {name}: {detail}")
    return failed == 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--unit-only", action="store_true")
    args = parser.parse_args()

    if args.unit_only:
        import os
        sys.path.insert(0, ".")
        from app.auth import create_access_token, get_password_hash, verify_password
        from jose import jwt

        print("[UNIT] Testing JWT sub encoding...")
        token = create_access_token({"sub": str(42)})
        SECRET = os.getenv("SECRET_KEY", "airbnb-clone-secret-key-change-in-production-2024")
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        print(f"[UNIT] sub type={type(sub).__name__}, value={sub}")
        print(f"[UNIT] JWT sub is string: {'PASS' if isinstance(sub, str) else 'FAIL'}")

        print("[UNIT] Testing password hashing...")
        hashed = get_password_hash("mypassword")
        print(f"[UNIT] Correct password: {'PASS' if verify_password('mypassword', hashed) else 'FAIL'}")
        print(f"[UNIT] Wrong password rejected: {'PASS' if not verify_password('wrong', hashed) else 'FAIL'}")
    else:
        success = run_tests()
        sys.exit(0 if success else 1)
