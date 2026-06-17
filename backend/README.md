# TaskFlow Support API

Flask REST API for project/task management and a customer support ticket system. Built with Flask-Smorest (OpenAPI 3), SQLAlchemy, JWT authentication, Redis caching, and Celery background jobs.

## Tech Stack

- **Flask 3** + **flask-smorest** — REST API with Swagger UI
- **SQLAlchemy** + **Flask-Migrate** — ORM and database migrations
- **Flask-JWT-Extended** — JWT auth (24h access tokens)
- **Redis** — caching, rate limiting, Celery broker
- **Celery** — background tasks (SLA scans, notifications)
- **bcrypt** + **bleach** — password hashing and XSS sanitization
- **pytest** — test suite (90%+ coverage on core modules)

## Getting Started

### Prerequisites

- Python 3.11+
- Redis (optional for dev; in-memory fallback available in tests)

### Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### Database

```bash
flask db upgrade
python -c "
from app import create_app
from app.support.seed import seed_support_users
app = create_app()
with app.app_context():
    seed_support_users()
"
```

### Run the server

```bash
python run.py
```

- API base URL: [http://localhost:5000](http://localhost:5000)
- Swagger UI: [http://localhost:5000/swagger-ui](http://localhost:5000/swagger-ui)
- Health check: [http://localhost:5000/health](http://localhost:5000/health)

### Celery worker (optional)

Requires Redis running:

```bash
celery -A celery_worker.celery_app worker --loglevel=info
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Config profile (`development`, `testing`, `production`) |
| `SECRET_KEY` | — | Flask secret key |
| `JWT_SECRET_KEY` | — | JWT signing key |
| `DATABASE_URL` | `sqlite:///app.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis for cache and rate limiting |
| `CELERY_BROKER_URL` | same as `REDIS_URL` | Celery message broker |
| `PORT` | `5000` | Server port |

See [`.env.example`](.env.example) for the full list.

## API Overview

All endpoints require a `Bearer` JWT token unless noted. Register or log in via `/api/auth` to obtain a token.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user profile |

### Projects & Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Project CRUD |
| GET/POST | `/api/projects/:id/members` | Manage project members |
| GET/POST | `/api/tasks` | List / create tasks |
| GET/PUT/DELETE | `/api/tasks/:id` | Task CRUD |

### Customer Support Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tickets` | List / create tickets |
| GET/PUT/DELETE | `/api/tickets/:id` | Ticket CRUD |
| POST | `/api/tickets/:id/assign` | Assign or reassign ticket |
| PUT | `/api/tickets/:id/status` | Update ticket status |
| PUT | `/api/tickets/:id/priority` | Update priority (staff) |
| GET/POST | `/api/tickets/:id/comments` | List / add comments |
| GET | `/api/tickets/:id/history` | Status change history |
| POST | `/api/tickets/:id/attachments` | Upload attachment |
| GET | `/api/tickets/export` | Export tickets (staff) |

Ticket creation accepts JSON or `multipart/form-data` (with optional file attachments). New tickets auto-assign to agents by default (`?auto_assign=false` to disable).

### Agents & Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List support agents |
| GET | `/api/agents/:id/tickets` | Agent's assigned tickets |
| PUT | `/api/agents/:id/availability` | Update agent availability |
| GET | `/api/admin/dashboard` | Admin dashboard metrics |
| GET | `/api/admin/reports/*` | Ticket, agent, and SLA reports |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Unread count |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

## Seed Credentials

After running `seed_support_users()`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@support.local` | `AdminPass123!` |
| Agent | `agent1@support.local` | `AgentPass123!` |
| Agent | `agent2@support.local` | `AgentPass123!` |
| Customer | `customer@support.local` | `CustomerPass123!` |

## Testing

```bash
pytest                          # Full suite (task/project modules, 90% threshold)
pytest --no-cov                 # Skip coverage gate

# Support ticket tests — use pytest-support.ini so coverage measures support code,
# not task blueprints (default pytest.ini would show ~42% for support-only runs)
pytest -c pytest-support.ini tests/test_support_tickets.py -v
```

Coverage threshold: 90% on core task/project blueprints (full suite); 85% on support modules (`pytest-support.ini`).

### User profile management (unittest)

```bash
python -m tests.unittest.run_suite -v
```

See `tests/USER_PROFILE_MANAGEMENT_TEST_CASES.md` for the full UPM-* specification.

## Project Structure

```
backend/
├── app/
│   ├── blueprints/       # API route handlers
│   │   ├── auth.py
│   │   ├── projects.py
│   │   ├── tasks.py
│   │   ├── notifications.py
│   │   └── support.py    # Tickets, agents, admin
│   ├── models/           # SQLAlchemy models
│   ├── services/         # Business logic (cache, tasks, permissions)
│   ├── support/          # Support ticket domain (models, validation, SLA)
│   ├── tasks/            # Celery background tasks
│   └── schemas/          # Marshmallow serialization schemas
├── migrations/           # Alembic migrations
├── tests/                # pytest test suite
├── uploads/              # Ticket attachment storage
├── run.py                # Dev server entry point
└── celery_worker.py      # Celery worker entry point
```

## Error Format

API errors follow a consistent JSON structure:

```json
{
  "status": "error",
  "message": "Human-readable message",
  "code": "VALIDATION_ERROR",
  "errors": {
    "field_name": ["Specific validation message"]
  }
}
```
