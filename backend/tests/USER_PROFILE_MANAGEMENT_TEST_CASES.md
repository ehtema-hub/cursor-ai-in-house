# User Profile Management — Test Case Specification

Comprehensive test scenarios for user registration, profile updates, password changes, and account deletion.

**Scope**

| Layer | Location | Notes |
|-------|----------|--------|
| API | `backend/` — `/api/auth/*`, `/api/users/me` | JWT auth, Marshmallow validation |
| UI | `src/` — Register, Login, Settings → Profile | Client-side validation in `settingsValidation.ts` |
| E2E | `e2e/` — Playwright | Multi-step registration flow |

**Planned API (profile management v1)**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create account |
| GET | `/api/auth/me` | Read current user |
| PUT | `/api/users/me` | Update name / email |
| PUT | `/api/users/me/password` | Change password |
| DELETE | `/api/users/me` | Delete account (soft or hard) |

---

## Test Data Catalog

### Valid users (API)

| ID | Name | Email | Password | Role |
|----|------|-------|----------|------|
| `USER_A` | Alex Morgan | `alex.morgan@profile.test` | `ValidPass123!` | customer |
| `USER_B` | Blake Chen | `blake.chen@profile.test` | `AnotherPass456!` | customer |
| `ADMIN_1` | Support Admin | `admin@support.local` | `AdminPass123!` | admin |

### Valid profile (UI settings)

```json
{
  "fullName": "Jordan Lee",
  "email": "jordan@taskflow.app",
  "phone": "+1 (555) 123-4567",
  "country": "US"
}
```

### Invalid / boundary payloads

| Field | Value | Expected error |
|-------|-------|----------------|
| name | `A` | min length 2 |
| name | 121+ chars | max length 120 |
| email | `not-an-email` | invalid format |
| email | `` (empty) | required |
| password | `short` | min length 8 |
| password | `` | required |
| phone (UI) | `123` | invalid phone format |
| country (UI) | `` | required |

### Security payloads

| Payload | Purpose |
|---------|---------|
| `<script>alert('xss')</script>` in name | XSS sanitization |
| `'; DROP TABLE users;--` in name | SQL injection resistance |
| Another user's JWT | IDOR on profile endpoints |
| Expired / malformed JWT | Auth rejection |

---

## 1. User Registration

### 1.1 Positive

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| UPM-REG-001 | Register with valid data | POST `/api/auth/register` with USER_A payload | `201`, user JSON, no `password_hash`, email normalized lowercase |
| UPM-REG-002 | Login after registration | Register USER_A → POST `/api/auth/login` | `200`, `access_token` + `refresh_token` present |
| UPM-REG-003 | Get profile after register | Register → login → GET `/api/auth/me` | `200`, email matches USER_A |
| UPM-REG-004 | UI multi-step registration | Complete 3-step register flow (E2E) | Redirect to dashboard; session in localStorage |
| UPM-REG-005 | Email case normalization | Register `Alex@Test.Local` | Stored as `alex@test.local` |
| UPM-REG-006 | Name trimmed | Register name `"  Alex Morgan  "` | Stored trimmed |

### 1.2 Negative

| ID | Scenario | Input | Expected result |
|----|----------|-------|-----------------|
| UPM-REG-N01 | Duplicate email | Same email as existing user | `409`, message about existing account |
| UPM-REG-N02 | Missing name | omit `name` | `422` validation error |
| UPM-REG-N03 | Missing email | omit `email` | `422` validation error |
| UPM-REG-N04 | Missing password | omit `password` | `422` validation error |
| UPM-REG-N05 | Password too short | `password: "abc"` | `422`, min 8 chars |
| UPM-REG-N06 | Invalid email format | `email: "bad@"` | `422` |
| UPM-REG-N07 | Name too short | `name: "A"` | `422`, min 2 chars |
| UPM-REG-N08 | UI password mismatch | step2 password ≠ confirm | Inline error; cannot proceed |
| UPM-REG-N09 | UI terms not accepted | submit step 3 without terms | Validation blocks submit |

### 1.3 Edge cases

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-REG-E01 | Minimum valid password (8 chars) | `201` success |
| UPM-REG-E02 | Maximum name length (120 chars) | `201` success |
| UPM-REG-E03 | Unicode name `José García` | Accepted and stored correctly |
| UPM-REG-E04 | Plus-address email `user+tag@domain.com` | Accepted if valid email format |
| UPM-REG-E05 | Rapid double-submit same email | One `201`, second `409` |
| UPM-REG-E06 | Empty JSON body | `422` |

### 1.4 Security

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-REG-S01 | Password not returned in response | Response body has no password fields |
| UPM-REG-S02 | Password stored hashed | DB `password_hash` ≠ plaintext; bcrypt verify works |
| UPM-REG-S03 | XSS in name field | Stored sanitized or escaped on output |
| UPM-REG-S04 | Rate limiting on register (if enabled) | Excessive requests throttled |
| UPM-REG-S05 | Register without auth header | Allowed (public endpoint) |

---

## 2. Profile Updates

### 2.1 Positive

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| UPM-PRO-001 | Read own profile | GET `/api/auth/me` with valid JWT | `200`, id, name, email, role |
| UPM-PRO-002 | Read via users me | GET `/api/users/me` | Same as UPM-PRO-001 |
| UPM-PRO-003 | Update display name | PUT `/api/users/me` `{ "name": "New Name" }` | `200`, name updated |
| UPM-PRO-004 | Update email | PUT `/api/users/me` `{ "email": "new@profile.test" }` | `200`; login with new email works |
| UPM-PRO-005 | UI profile save valid | Settings → Profile → save VALID profile | No validation errors; success toast |
| UPM-PRO-006 | Partial update name only | Only send changed fields | Other fields unchanged |

### 2.2 Negative

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PRO-N01 | Unauthenticated read | GET `/api/auth/me` no token | `401` |
| UPM-PRO-N02 | Invalid JWT | Bearer `invalid.token.here` | `401` |
| UPM-PRO-N03 | Update with duplicate email | Email owned by USER_B | `409` |
| UPM-PRO-N04 | Empty name | `name: ""` | `422` |
| UPM-PRO-N05 | Invalid email on update | `email: "bad"` | `422` |
| UPM-PRO-N06 | UI missing full name | `fullName: ""` | Error: required |
| UPM-PRO-N07 | UI invalid phone | `phone: "123"` | Error: valid phone |
| UPM-PRO-N08 | UI missing country | `country: ""` | Error: select country |
| UPM-PRO-N09 | Customer updates another user (admin route) | PUT `/api/users/{other_id}` as customer | `403` |

### 2.3 Edge cases

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PRO-E01 | No-op update (same values) | `200`, no error |
| UPM-PRO-E02 | Whitespace-only name | Rejected validation |
| UPM-PRO-E03 | Email change then old email login | `401` with old password+email |
| UPM-PRO-E04 | Concurrent updates two tabs | Last write wins or conflict handling documented |

### 2.4 Security

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PRO-S01 | IDOR: GET `/api/users/{id}` other user as customer | `403` unless own id |
| UPM-PRO-S02 | Privilege escalation via profile | Customer cannot set `role: admin` |
| UPM-PRO-S03 | XSS in updated name | Sanitized in API responses |
| UPM-PRO-S04 | Mass assignment | Extra fields (`is_admin`, `role`) ignored for self-service |

---

## 3. Password Changes

### 3.1 Positive

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| UPM-PWD-001 | Change password success | PUT `/api/users/me/password` current + new | `200`; login with new password |
| UPM-PWD-002 | Old password invalid after change | Login with old password | `401` |
| UPM-PWD-003 | Refresh token after password change | Optional: invalidate old tokens | Policy documented |

### 3.2 Negative

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PWD-N01 | Wrong current password | `401` or `400` with clear message |
| UPM-PWD-N02 | New password too short | `422` |
| UPM-PWD-N03 | Missing current password | `422` |
| UPM-PWD-N04 | Unauthenticated | `401` |
| UPM-PWD-N05 | New password same as current | `400` optional policy |

### 3.3 Edge cases

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PWD-E01 | Minimum length new password (8) | Success |
| UPM-PWD-E02 | Very long password (128+ chars) | Accept or reject per policy |
| UPM-PWD-E03 | Unicode password | Works if allowed by validator |

### 3.4 Security

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-PWD-S01 | Brute force current password | Rate limit / lockout after N failures |
| UPM-PWD-S02 | Password not logged or returned | Response never includes secrets |
| UPM-PWD-S03 | Timing attack mitigation | Similar response time wrong vs missing user |

---

## 4. Account Deletion

### 4.1 Positive

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| UPM-DEL-001 | Self-delete account | DELETE `/api/users/me` + password confirm | `204`; user removed or `is_active=false` |
| UPM-DEL-002 | Login after deletion | POST login deleted user | `401` or `403` account disabled |
| UPM-DEL-003 | Profile inaccessible after delete | GET `/api/auth/me` old token | `401` |

### 4.2 Negative

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-DEL-N01 | Wrong password confirmation | `401` / `400` |
| UPM-DEL-N02 | Missing confirmation flag | `422` |
| UPM-DEL-N03 | Delete another user's account | `403` |
| UPM-DEL-N04 | Unauthenticated delete | `401` |

### 4.3 Edge cases

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-DEL-E01 | Delete user with open support tickets | Cascade or block per business rule |
| UPM-DEL-E02 | Delete user who owns projects | Ownership transfer or block |
| UPM-DEL-E03 | Double delete request | Second request `404` |

### 4.4 Security

| ID | Scenario | Expected result |
|----|----------|-----------------|
| UPM-DEL-S01 | CSRF / token required | JWT required |
| UPM-DEL-S02 | Admin cannot delete self without password | Re-auth required |
| UPM-DEL-S03 | Soft delete PII retention | GDPR export/delete policy documented |

---

## 5. Traceability — Automation Status

| Area | Automated file | Framework | Notes |
|------|----------------|-----------|-------|
| API registration & auth | `tests/unittest/test_registration.py` | **unittest** | Full UPM-REG-* coverage |
| API profile read/update | `tests/unittest/test_profile_updates.py` | **unittest** | Update tests skipped until `PUT /api/users/me` |
| API password change | `tests/unittest/test_password_changes.py` | **unittest** | Skipped until endpoint exists |
| API account delete | `tests/unittest/test_account_deletion.py` | **unittest** | Skipped until endpoint exists |
| Shared fixtures | `tests/unittest/fixtures.py`, `tests/unittest/base.py` | — | Mock data + setUp/tearDown |
| Pytest equivalent | `tests/test_user_profile_management.py` | pytest | Same scenarios |
| UI profile validation | `ProfileUiValidationTests` in profile module | unittest | Mirrors `settingsValidation.ts` |
| E2E registration | `e2e/multi-step-registration.spec.ts` | Playwright | Existing |

---

## 6. Running unittest suite

```bash
cd backend
source .venv/bin/activate

# All profile management unittests (56 tests, 18 skipped)
python -m tests.unittest.run_suite -v

# Single category
python -m unittest tests.unittest.test_registration -v
python -m unittest tests.unittest.test_profile_updates.ProfileSecurityTests -v
```

## 7. Running pytest suite

```bash
pytest tests/test_user_profile_management.py -v
pytest tests/test_user_profile_management.py -v -k "REG"
```
