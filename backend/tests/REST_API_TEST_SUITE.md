# REST API — Comprehensive Test Suite Specification

Automated tests in `tests/test_rest_api_suite.py` (pytest).

## API Endpoints

### User management

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/auth/register` | Public | — |
| POST | `/api/auth/login` | Public | — |
| GET | `/api/users/me` | JWT | Any |
| PUT | `/api/users/me` | JWT | Any |
| DELETE | `/api/users/me` | JWT | Any (soft deactivate) |
| GET | `/api/users/:id` | JWT | Admin or self |
| PUT | `/api/users/:id` | JWT | Admin |

### Product catalog

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/products` | Public | — |
| GET | `/api/products/:id` | Public | — |
| POST | `/api/products` | JWT | Admin |
| PUT | `/api/products/:id` | JWT | Admin |
| DELETE | `/api/products/:id` | JWT | Admin (soft) |

### Orders

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/orders` | JWT | Own orders; admin all |
| POST | `/api/orders` | JWT | Customer+ |
| GET | `/api/orders/:id` | JWT | Owner or admin |
| PUT | `/api/orders/:id` | JWT | Admin (status) |
| DELETE | `/api/orders/:id` | JWT | Owner/admin cancel |

## Test categories (35 tests)

| Class | Focus |
|-------|--------|
| `TestUserManagement` | Register, GET/PUT/DELETE `/users/me`, authz, validation |
| `TestProductCatalog` | CRUD, public GET, admin-only writes, filters, performance |
| `TestOrders` | Create, list, status update, cancel, stock validation |
| `TestCrossCutting` | Invalid JWT, error shape, rate limit 429, <500ms latency, SQLi |

## Run

```bash
cd backend
source .venv/bin/activate
pytest tests/test_rest_api_suite.py -v
pytest tests/test_rest_api_suite.py -v --no-cov
```

## Error response format

```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "NOT_FOUND",
  "errors": { "field": ["detail"] }
}
```

## Rate limiting

Configured via `RATE_LIMIT_MAX_REQUESTS` / `RATE_LIMIT_WINDOW_SECONDS`. Returns `429` with `RATE_LIMIT_EXCEEDED`.

## Performance

List/read endpoints assert `< 500ms` under in-memory SQLite test load.
