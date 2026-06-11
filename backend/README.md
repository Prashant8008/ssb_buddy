# SSB Connect Django Backend

Production-style Django foundation for a defence aspirant social and preparation platform.

## Structure

Domain code lives in `apps/`, project wiring lives in `config/`, settings are split into `config/settings/base.py`, `dev.py`, and `production.py`, and API composition is centralized in `config/api_urls.py`. See `docs/ARCHITECTURE.md`.

## Run locally

```powershell
cd backend
..\.venv\Scripts\python manage.py migrate
..\.venv\Scripts\python manage.py runserver
```

Use `http://127.0.0.1:8000/` for the template UI and `/api/` for DRF endpoints.

## Main endpoints

- `POST /api/auth/register/`
- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`
- `GET /api/auth/verify-email/?token=...`
- `/api/profiles/`, `/api/posts/`, `/api/groups/`, `/api/conversations/`
- `/api/practice-prompts/`, `/api/notes/`, `/api/events/`, `/api/notifications/`
- WebSockets: `/ws/chat/<conversation_id>/`, `/ws/notifications/`

## Production notes

Copy `.env.example` to `.env`, set a strong `SECRET_KEY`, enable PostgreSQL and Redis, configure SMTP, and set secure cookie/HTTPS/HSTS options behind your reverse proxy.

For production:

```powershell
$env:DJANGO_SETTINGS_MODULE='config.settings.production'
```
