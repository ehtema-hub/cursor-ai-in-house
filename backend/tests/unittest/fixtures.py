"""Shared mock data for user profile management unittest suite."""

USER_A = {
    "name": "Alex Morgan",
    "email": "alex.morgan@profile.test",
    "password": "ValidPass123!",
}

USER_B = {
    "name": "Blake Chen",
    "email": "blake.chen@profile.test",
    "password": "AnotherPass456!",
}

VALID_MIN_PASSWORD_USER = {
    "name": "Min Pass User",
    "email": "minpass@profile.test",
    "password": "12345678",
}

UNICODE_NAME_USER = {
    "name": "José García",
    "email": "jose.garcia@profile.test",
    "password": "ValidPass123!",
}

UI_VALID_PROFILE = {
    "fullName": "Jordan Lee",
    "email": "jordan@taskflow.app",
    "phone": "+1 (555) 123-4567",
    "country": "US",
}

XSS_NAME = "<script>alert('xss')</script>"
SQL_INJECTION_NAME = "'; DROP TABLE users;--"

INVALID_REGISTRATION_PAYLOADS = [
    {"name": "Test User", "email": "bad@", "password": "ValidPass123!"},
    {"name": "Test User", "email": "short@test.local", "password": "short"},
    {"name": "A", "email": "shortname@test.local", "password": "ValidPass123!"},
]

MISSING_FIELD_PAYLOADS = [
    {"email": USER_A["email"], "password": USER_A["password"]},
    {"name": USER_A["name"], "password": USER_A["password"]},
    {"name": USER_A["name"], "email": USER_A["email"]},
]

UI_VALIDATION_CASES = [
    ("Jordan Lee", "jordan@taskflow.app", "+1 555 123 4567", "US", None),
    ("", "jordan@taskflow.app", "", "US", "fullName"),
    ("J", "jordan@taskflow.app", "", "US", "fullName"),
    ("Jordan Lee", "bad-email", "", "US", "email"),
    ("Jordan Lee", "jordan@taskflow.app", "123", "US", "phone"),
    ("Jordan Lee", "jordan@taskflow.app", "", "", "country"),
]

OWNER_CREDENTIALS = {"email": "owner@test.local", "password": "OwnerPass123!"}
MEMBER_CREDENTIALS = {"email": "member@test.local", "password": "MemberPass123!"}
