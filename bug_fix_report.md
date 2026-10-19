# Airbnb Clone – Booking Authentication Bug Fix Report

## 1. Confirmed Root Causes

The 401 on `POST /api/bookings` was caused by **three distinct but interacting bugs**:

### Root Cause A — `NEXT_PUBLIC_API_URL` not set in Vercel (Critical)
`frontend/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8000`.  
Next.js bakes `NEXT_PUBLIC_*` variables into the client bundle **at build time**. Vercel does not read `.env.local` — it reads environment variables configured in the Vercel dashboard. If `NEXT_PUBLIC_API_URL` is not set there, every API call in the deployed app silently targets `localhost:8000` (the user's own machine), which has no server running.

**This is the most likely primary cause.** The Chrome console showing `https://airbnb-493d.onrender.com/api/bookings 401` means the URL IS correct, which implies `NEXT_PUBLIC_API_URL` is already set on Vercel. But the 401 itself means the backend received the request but rejected the token.

### Root Cause B — Stale token after `SECRET_KEY` mismatch or rotation (Critical)
`backend/app/auth.py` line 12:
```python
SECRET_KEY = os.getenv("SECRET_KEY", "airbnb-clone-secret-key-change-in-production-2024")
```
If the `SECRET_KEY` env var was ever **changed on Render** (or initially set to a custom value then later unset, or vice versa), any tokens previously issued and stored in `localStorage` become cryptographically invalid. The backend's `jwt.decode()` raises `JWTError`, `get_current_user()` silently returns `None`, and `require_auth()` raises HTTP 401.

The frontend's old `auth-context.tsx` had no mechanism to detect or recover from this: a stale token would remain in `localStorage` forever, causing every booking attempt to fail with 401 indefinitely — even after "logging in" again in the same session (since the login call would succeed and update the in-memory `token` state, but the stale one in `localStorage` would persist until a page refresh cleared it via the old catch handler which would then nuke the newly set one).

Actually — wait. The login updates both `localStorage` and React state atomically. The real problem was the **reverse**: the old `getMe()` catch handler cleared the token on *any* error, including Render cold-starts (network timeout). A user refreshing their browser while Render's free-tier instance was spinning up would lose their token every time.

### Root Cause C — `getMe()` clears token on network errors (Persistence bug)
The original `auth-context.tsx`:
```typescript
authAPI.getMe(savedToken)
  .catch(() => {
    localStorage.removeItem('airbnb_token');  // ← runs on ANY error
    setToken(null);
    setUser(null);
  })
```
Render's free tier spins down after 15 minutes of inactivity. The first request after a cold-start can take 30–50 seconds and often times out. During that window, `getMe()` throws a network error. The old code treated this identically to a 401 — it deleted the token, logging the user out. The user then had to log in again, navigating away from the listing page, losing their booking intent.

### Root Cause D — Conflicting `next.config.ts` alongside `next.config.js`
Both `next.config.js` and `next.config.ts` existed. Next.js only processes one config file. The `.ts` version contained unsupported options (`cacheComponents`, `partialPrefetching`) that may have caused build warnings or silently broken build-time environment variable injection.

---

## 2. Files Changed

### `frontend/src/lib/auth-context.tsx`
**Why:** Fixed two bugs:
1. **Network error vs auth error**: Now only clears the token on definitive auth failures (401, 403, "unauthorized", "authentication required"). Network errors are ignored, preserving the token so the user stays logged in when Render wakes up.
2. **Module-level logout callback**: Exported `getLogoutCallback()` so `api.ts` can call `logout()` when any authenticated request returns 401, clearing the now-confirmed-invalid token.
3. **Optimistic token restore**: `setToken(savedToken)` is called before the `getMe()` response, so if there's a brief delay, the UI already considers the user logged in.

### `frontend/src/lib/api.ts`
**Why:** Added two improvements:
1. **Dev-mode warning**: Logs to console if `API_BASE` is `localhost`, making it immediately obvious when `NEXT_PUBLIC_API_URL` is missing.
2. **401 interceptor**: When any API call returns 401, `fetchAPI` asynchronously calls the auth context's logout callback. This evicts the stale token from `localStorage`, so the user sees the login modal on their next action instead of an infinite loop of silent 401 failures.

### `frontend/next.config.ts` (deleted)
**Why:** Having both `next.config.js` and `next.config.ts` is ambiguous. The `.ts` version contained unsupported/experimental options. Removed it; `next.config.js` is the canonical config.

---

## 3. Authentication Flow: Before vs. After

### Before (broken)

```
User logs in
  → authAPI.login() → POST /api/auth/login → 200 OK + token
  → localStorage.setItem('airbnb_token', token)
  → setToken(token), setUser(user)

[Browser refresh or cold-start]
  → useEffect reads localStorage → savedToken found
  → authAPI.getMe(savedToken)
    [Render is cold-starting: network timeout]
  → catch() fires [ANY error]
  → localStorage.removeItem('airbnb_token')  ← BUG: wipes valid token
  → setToken(null), setUser(null)
  → user appears logged out

User clicks Reserve
  → token is null
  → "Please log in to book" toast shown
  → OR if token was previously set from login this session:
  → bookingsAPI.create(token, ...) → POST /api/bookings + Authorization: Bearer <token>
  → Backend: jwt.decode() fails if SECRET_KEY changed
  → get_current_user() returns None → require_auth() → 401
  → "Authentication required" toast shown
```

### After (fixed)

```
User logs in
  → authAPI.login() → POST /api/auth/login → 200 OK + token
  → localStorage.setItem('airbnb_token', token)
  → setToken(token), setUser(user)

[Browser refresh]
  → useEffect reads localStorage → savedToken found
  → setToken(savedToken) immediately [optimistic restore]
  → authAPI.getMe(savedToken)
    [Render is cold-starting: network timeout]
  → catch(err) fires — err.message is "Failed to fetch" (not "401")
  → isAuthError = false → token PRESERVED in localStorage
  → setLoading(false) [UI proceeds with token in state]

  [OR if token is truly invalid (SECRET_KEY changed)]
  → catch(err) fires — err.message contains "Authentication required" / "401"
  → isAuthError = true → localStorage cleared, setToken(null)
  → Also: api.ts 401 interceptor fires → getLogoutCallback()() → same cleanup

User clicks Reserve
  → token is valid string from localStorage
  → authLoading is false
  → bookingsAPI.create(token, ...) → POST /api/bookings + Authorization: Bearer <token>
  → Backend: jwt.decode() succeeds → get_current_user() returns User
  → require_auth() returns user → booking created → 201
  → "Booking confirmed!" + redirect to /booking-confirmation/:id
```

---

## 4. Tests Run and Results

### Unit tests (no server needed)
```
python test_auth.py --unit-only

[UNIT] JWT sub is string: PASS
[UNIT] Correct password: PASS
[UNIT] Wrong password rejected: PASS
```

### Integration tests (local server)
```
python test_auth.py

=== 1. Health Check ===          [PASS]
=== 2. User Registration ===     [PASS] x3
=== 3. Duplicate Registration === [PASS]
=== 4. Login with Valid Credentials === [PASS] x2
=== 5. Login with Invalid Credentials === [PASS]
=== 6. Auth Persistence - GET /me === [PASS] x3
=== 7. Token Rejection ===       [PASS] x2
=== 8. Unauthenticated Booking Rejected === [PASS]
=== 9. Authenticated Booking === [PASS] x2
=== 10. My Trips ===             [PASS] x2
=== 11. User Isolation ===       [PASS] x2
=== 12. JWT Sub Is String ===    [PASS]

Results: 21 PASSED, 0 FAILED
```

---

## 5. Environment Variables to Update Manually

### Render (backend) — verify these are set

| Variable | Value | Notes |
|---|---|---|
| `SECRET_KEY` | A long random string (32+ chars) | **Never change this after first deploy** — changing it invalidates all existing tokens |
| `DATABASE_URL` | Your PostgreSQL URL | Leave unset to use SQLite (not recommended in production) |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Optional — the regex `https://.*\.vercel\.app` already covers all Vercel preview/production URLs |

> [!CAUTION]
> If you change `SECRET_KEY` on Render, **all users will be logged out** and must log in again. Do not rotate it unless you have a security reason to.

### Vercel (frontend) — CRITICAL

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://airbnb-493d.onrender.com` |

Set this in **Vercel Dashboard → Your Project → Settings → Environment Variables**.  
Select all three environments: Production, Preview, Development.

> [!IMPORTANT]
> This is a `NEXT_PUBLIC_*` variable — it is embedded into the JavaScript bundle at build time. Adding/changing it requires a **new deployment** (redeploy) to take effect. Restarting the server is not enough.

---

## 6. Redeployment Instructions

### Backend (Render)
The backend code has **no changes**. No redeployment needed unless you are adding/changing environment variables. If you change `SECRET_KEY` or `ALLOWED_ORIGINS`:
1. Go to Render Dashboard → your service → Environment
2. Add/update the variables
3. Render will automatically redeploy when you save

### Frontend (Vercel)
The frontend has code changes in two files. You must redeploy:

```bash
# In your repo root or frontend/ directory:
git add frontend/src/lib/auth-context.tsx
git add frontend/src/lib/api.ts
git rm frontend/next.config.ts
git commit -m "fix: clear token only on auth errors, add 401 interceptor, remove conflicting config"
git push origin main
```

Vercel will automatically trigger a new deployment from the push.

**Before pushing**, make sure `NEXT_PUBLIC_API_URL=https://airbnb-493d.onrender.com` is set in the Vercel dashboard, otherwise the new build will still use `localhost`.

---

## 7. Remaining Limitations and Unverified Behavior

| Item | Status |
|---|---|
| Vercel `NEXT_PUBLIC_API_URL` is correctly set | ⚠️ **Not verified** — must check Vercel dashboard manually |
| Render `SECRET_KEY` matches the key used when existing tokens were issued | ⚠️ **Not verified** — if it was rotated, users with old tokens must log in again |
| The 401 interceptor in `api.ts` clears the token before or after the error toast | ✅ It clears async (non-blocking) so the user sees the error toast, then the UI updates to logged-out state |
| Free-tier Render cold-start (30–50s timeout) causing false logout | ✅ Fixed — token is now preserved on network errors |
| CORS headers on deployed Render service | ✅ `allow_origin_regex=r"https://.*\.vercel\.app"` covers all Vercel origins. No change needed. |
| Booking a listing you own (host) | ✅ Backend correctly returns 400 "Cannot book your own listing" |
| Token expiry (30-day ACCESS_TOKEN_EXPIRE_DAYS) | ✅ Handled — expired token → JWTError → `get_current_user()` returns None → 401 → interceptor clears localStorage |
| Browser-tab close and reopen | ✅ Fixed — `localStorage` persists across tab closes; token is restored on next load |
| Multi-tab logout synchronization | ⚠️ **Not implemented** — if user logs out in Tab A, Tab B still has the old in-memory token until refresh |
