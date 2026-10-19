# Airbnb Clone – Booking Authentication Bug Fix Report

## 1. Confirmed Root Causes & Resolution

### Primary Root Cause: JWT `sub` Claim Type Mismatch in python-jose (Critical)
In `backend/app/routes/auth.py`, during both user registration and login:
```python
token = create_access_token({"sub": user.id})
```
Because the backend connects to PostgreSQL on Neon, `user.id` is an `integer` (e.g. `5`).
The JWT RFC 7519 specification mandates that the `sub` (subject) claim must be a string:
> *"The 'sub' (subject) Claim ... The 'sub' value is a StringOrURI value of String type or containing a String value."*

`python-jose` strictly validates registered claims during `jwt.decode()`. When `claims['sub']` was an integer, `python-jose` raised:
```text
jose.exceptions.JWTClaimsError: Subject must be a string.
```
In `backend/app/auth.py`, `get_current_user()` caught `(JWTError, ValueError)` and returned `None`:
```python
try:
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
...
except (JWTError, ValueError):
    return None
```
When `get_current_user()` returned `None`, `require_auth()` raised HTTP 401:
```python
raise HTTPException(status_code=401, detail="Authentication required")
```

### Secondary Bug: Disruptive Auto-Logout on Booking Error (UX Bug)
In `frontend/src/lib/api.ts`, a 401 interceptor was catching ANY 401 response and immediately clearing `localStorage['airbnb_token']` and resetting React authentication state.
When the user clicked "Reserve", the 401 from `POST /api/bookings` triggered this interceptor, immediately wiping the user's session from browser storage and React state. The user was greeted with the `"Authentication required"` toast, followed immediately by `"Please log in to book"`.

### Database Architecture: Neon PostgreSQL Connection
The backend on Render is connected to a pooled Neon PostgreSQL instance. `database.py` was previously updated with connection pooling (`pool_pre_ping=True`) and `psycopg2-binary==2.9.9` in `requirements.txt`.

---

## 2. Changes Applied

### A. Backend Fixes (`backend/app/auth.py` & `backend/app/routes/auth.py`)
1. **`backend/app/auth.py`**:
   - In `create_access_token()`: Added string coercion for `sub`:
     ```python
     if "sub" in to_encode:
         to_encode["sub"] = str(to_encode["sub"])
     ```
   - In `get_current_user()`: Added `options={"verify_sub": False}` to `jwt.decode()`:
     ```python
     payload = jwt.decode(
         token,
         SECRET_KEY,
         algorithms=[ALGORITHM],
         options={"verify_sub": False},
     )
     ```
     This provides backward compatibility for any tokens created with integer `sub` claims, while safely casting `int(payload.get("sub"))`.
2. **`backend/app/routes/auth.py`**:
   - In both `/register` and `/login`: Explicitly pass `str(user.id)` to `create_access_token`:
     ```python
     token = create_access_token({"sub": str(user.id)})
     ```

### B. Frontend Fixes (`frontend/src/lib/api.ts` & `frontend/src/components/BookingPanel.tsx`)
1. **`frontend/src/lib/api.ts`**:
   - Scoped the 401 interceptor so it only auto-logs out when `/api/auth/me` returns 401 (meaning the session is truly dead). It does not wipe the user's session when a transactional call like `/api/bookings` encounters an error:
     ```typescript
     if (response.status === 401 && endpoint.startsWith('/api/auth/me')) {
       import('./auth-context').then(({ getLogoutCallback }) => {
         const cb = getLogoutCallback();
         if (cb) cb();
       }).catch(() => {});
     }
     ```
2. **`frontend/src/components/BookingPanel.tsx`**:
   - Added robust token resolution with `localStorage` fallback:
     ```typescript
     const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('airbnb_token') : null);
     ```

---

## 3. Verification & Live Test Results

1. **Local Test Suite**:
   All 21 integration tests in `backend/test_auth.py` passed (`21 PASSED, 0 FAILED`), verifying:
   - Registration and token issuance
   - Login and token decoding
   - `/api/auth/me` with valid and invalid tokens
   - Booking creation with authenticated tokens
   - JWT `sub` claim string compliance

2. **Frontend Build**:
   `npm run build` compiled all routes without warnings or errors.

3. **Live Deployment Verification on Render**:
   - `POST https://airbnb-493d.onrender.com/api/auth/login` returns a token with string `sub`: `{"sub":"5", ...}`.
   - `GET https://airbnb-493d.onrender.com/api/auth/me` returns HTTP 200 with user profile: Alex Thompson (`id: 5`).
   - `POST https://airbnb-493d.onrender.com/api/bookings` returns HTTP 201 Created and successfully books the listing (`id: 5`, `status: confirmed`).
   - `GET https://airbnb-493d.onrender.com/api/bookings/my-trips` returns HTTP 200 with all user bookings.
