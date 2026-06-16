# SSB Connect

SSB Connect is a full-stack social and preparation platform for defence aspirants. It combines a community feed, profiles, connections, groups, events, chat, fitness tracking, locality discovery, and SSB practice modules for PPDT, TAT, WAT, and SRT.

## Features

- JWT-based authentication with register, login, token refresh, and email verification endpoints
- Social feed with posts, comments, likes, saved posts, and user profiles
- Friend requests, follows, connections, groups, and events
- Real-time chat and notifications using Django Channels
- SSB preparation hub with PPDT, TAT, WAT, and SRT practice flows
- AI mentor and evaluation endpoints for SSB practice responses
- Fitness run tracking with route points and map support
- Locality discovery map for aspirant networking
- Responsive React UI built with Tailwind CSS and Lucide icons

## Tech Stack

### Frontend

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- Framer Motion
- Leaflet / React Leaflet
- Lucide React

### Backend

- Django 5
- Django REST Framework
- Simple JWT
- Django Channels
- SQLite for local development
- PostgreSQL-ready production settings
- Redis-ready channel layer
- MongoDB/PyMongo support for selected social data flows
- Groq SDK support for AI features

## Project Structure

```text
ssb_buddy/
|-- backend/
|   |-- apps/
|   |   |-- accounts/
|   |   |-- ai/
|   |   |-- chat/
|   |   |-- events/
|   |   |-- fitness/
|   |   |-- groups/
|   |   |-- network/
|   |   |-- notifications/
|   |   |-- practice/
|   |   |-- resources/
|   |   `-- social/
|   |-- config/
|   |-- db.sqlite3
|   |-- manage.py
|   `-- requirements.txt
|-- src/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- pages/
|   |-- services/
|   |-- App.tsx
|   `-- main.tsx
|-- package.json
|-- vite.config.ts
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Python 3.10+
- Redis and MongoDB are optional for local experimentation, depending on which real-time or social-data features you use.

### 1. Clone The Repository

```bash
git clone https://github.com/Prashant8008/ssb_buddy.git
cd ssb-buddy
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up The Backend

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
cd backend
copy .env.example .env
..\.venv\Scripts\python manage.py migrate
```

### 4. Run The Backend

This project is currently configured to call the API on port `8001`.

```powershell
cd backend
..\.venv\Scripts\python manage.py runserver 127.0.0.1:8001
```

Backend URL:

```text
http://127.0.0.1:8001/
```

### 5. Run The Frontend

Open a second terminal:

```bash
npm run dev
```

Frontend URL:

```text
http://127.0.0.1:5173/
```

## Frontend Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Backend Commands

```powershell
cd backend
..\.venv\Scripts\python manage.py migrate
..\.venv\Scripts\python manage.py createsuperuser
..\.venv\Scripts\python manage.py runserver 127.0.0.1:8001
```

## Main API Endpoints

```text
POST /api/auth/register/
POST /api/auth/token/
POST /api/auth/token/refresh/
GET  /api/auth/verify-email/?token=...

/api/users/
/api/profiles/
/api/posts/
/api/comments/
/api/friend-requests/
/api/follows/
/api/groups/
/api/conversations/
/api/practice-prompts/
/api/practice-submissions/
/api/fitness-runs/
/api/events/
/api/notifications/
/api/ai/

/ws/chat/<conversation_id>/
/ws/notifications/
```

## Environment Variables

Create `backend/.env` from `backend/.env.example`.

Important values:

```env
SECRET_KEY=change-this-in-production
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
REDIS_URL=redis://127.0.0.1:6379/0
```

For production, configure a strong secret key, PostgreSQL, Redis, allowed hosts, CORS origins, CSRF trusted origins, email settings, and secure HTTPS settings.

## Notes

- The frontend API base URL is defined in `src/services/api.ts`.
- Login and registration currently call the backend directly from `src/pages/auth/Login.tsx` and `src/pages/auth/Register.tsx`.
- If you prefer Django on port `8000`, update those frontend URLs from `8001` to `8000`.
- Local development uses `backend/db.sqlite3` by default.

## Author

Prashant Kumar  
GitHub: [@Prashant8008](https://github.com/Prashant8008)
