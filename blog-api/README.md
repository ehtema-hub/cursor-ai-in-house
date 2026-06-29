# Blog Platform API

Standalone Flask REST API for a blogging platform with JWT authentication, post management, comments, categories, and Redis caching.

## Tech Stack

- **Flask 3** + **Flasgger** — REST API with Swagger docs
- **SQLAlchemy** + **Flask-Migrate** — ORM and migrations
- **Flask-JWT-Extended** — JWT authentication
- **Redis** — response caching (fakeredis in tests)
- **Marshmallow** — request/response serialization
- **pytest** — test suite (85%+ coverage)

## Getting Started

### Prerequisites

- Python 3.11+
- Redis (optional; fakeredis used in tests)

### Setup

```bash
cd blog-api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

The database is created automatically on first run (`db.create_all()` in `run.py`).

### Seed categories

```bash
flask seed
```

### Run the server

```bash
python run.py
```

- API base URL: [http://localhost:5001](http://localhost:5001)
- Swagger UI: [http://localhost:5001/apidocs](http://localhost:5001/apidocs)
- Health check: [http://localhost:5001/health](http://localhost:5001/health)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_ENV` | `development` | Config profile |
| `SECRET_KEY` | — | Flask secret key |
| `JWT_SECRET_KEY` | — | JWT signing key |
| `DATABASE_URL` | `sqlite:///blog.db` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379/1` | Redis cache (separate DB from backend) |
| `CACHE_DEFAULT_TIMEOUT` | `300` | Cache TTL in seconds |
| `PORT` | `5001` | Server port |

See [`.env.example`](.env.example) for the full list.

## API Overview

Protected endpoints require `Authorization: Bearer <token>`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new author |
| POST | `/api/auth/login` | Login and receive JWT |

### Posts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts` | Public | List published posts (paginated) |
| POST | `/api/posts` | Required | Create a new post |
| GET | `/api/posts/:id` | Public | Get post by ID |
| PUT | `/api/posts/:id` | Owner | Update a post |
| DELETE | `/api/posts/:id` | Owner | Delete a post |

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/posts/:id/comments` | Public | List comments on a post |
| POST | `/api/posts/:id/comments` | Required | Add a comment |

### Categories & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List all categories |
| GET | `/api/search?q=...` | Search posts by title/content |

## Frontend Integration

The ShopVerse frontend (`../frontend/`) consumes this API for the **Blog** section (`#feed`):

- Dev proxy: `/blog-api/*` → `http://localhost:5001/*`
- Separate JWT (`blog_access_token` in `localStorage`) — synced from main app login when possible
- Read posts/categories publicly; create posts/comments require blog auth

Start this service alongside the [backend](../backend/README.md) and [frontend](../frontend/README.md) for the full blog experience.

```bash
flask seed   # categories + demo authors, posts, and comments
```

Demo authors (password `DemoPass123!`): `mayachen`, `alexrivera`, `samortiz`, `priyanair`, `jordanlee` — posts span Programming, Technology, Travel, Food, and Lifestyle topics.

To re-seed posts, clear the blog database first (delete `instance/blog.db` in dev) then run `flask seed` again.

## Example Usage

```bash
# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jane","email":"jane@example.com","password":"SecurePass123!"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"SecurePass123!"}' \
  | python -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Create a post
curl -X POST http://localhost:5001/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello World","content":"My first blog post.","category_id":1}'

# List posts
curl http://localhost:5001/api/posts
```

## Testing

**Important:** Run tests from the `blog-api/` directory with the project virtualenv. System Python will fail with `ModuleNotFoundError: No module named 'flasgger'`.

### Option A — Makefile (recommended)

```bash
cd blog-api
make test
```

This creates `.venv`, installs dependencies, and runs pytest.

### Option B — Manual setup

```bash
cd blog-api
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
pytest -v
```

### Option C — Test script

```bash
cd blog-api
chmod +x scripts/test.sh   # first time only
./scripts/test.sh -v
```

Skip the coverage gate:

```bash
.venv/bin/pytest -v --no-cov
```

Coverage threshold: 85% on the `app` package.

## Project Structure

```
blog-api/
├── app/
│   ├── routes/
│   │   ├── auth.py         # Register / login
│   │   ├── posts.py        # Posts, comments, search
│   │   └── categories.py   # Category listing
│   ├── services/
│   │   ├── post_service.py # Post business logic + caching
│   │   └── cache.py        # Redis cache wrapper
│   ├── models.py           # User, Post, Comment, Category
│   ├── schemas.py          # Marshmallow schemas
│   └── utils/              # Auth helpers, error handlers
├── tests/
│   ├── conftest.py
│   ├── test_posts.py
│   └── test_comments.py
├── run.py                  # Dev server entry point
└── requirements.txt
```

## Error Format

```json
{
  "error": "Validation failed",
  "message": "Detailed description",
  "errors": {
    "field": ["Validation message"]
  }
}
```
