from .base import *  # noqa: F401,F403
import os
import sys

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

_BUILD_PLACEHOLDER_SECRET = 'render-build-placeholder-not-for-runtime'
_RENDER_BUILD_CMDS = frozenset({'collectstatic', 'check', 'migrate'})


def _is_render_build_command() -> bool:
    return (
        os.environ.get('RENDER') == 'true'
        and len(sys.argv) > 1
        and sys.argv[1] in _RENDER_BUILD_CMDS
    )


def _is_render_collectstatic_build() -> bool:
    return (
        os.environ.get('RENDER') == 'true'
        and len(sys.argv) > 1
        and sys.argv[1] in {'collectstatic', 'check'}
    )


_secret = config('SECRET_KEY', default='')
if not _secret or _secret.startswith('dev-only'):
    if _is_render_build_command():
        SECRET_KEY = _BUILD_PLACEHOLDER_SECRET
    else:
        raise ImproperlyConfigured('Set a strong SECRET_KEY environment variable for production.')
else:
    SECRET_KEY = _secret

if SECRET_KEY == _BUILD_PLACEHOLDER_SECRET and not _is_render_build_command():
    raise ImproperlyConfigured('Set a strong SECRET_KEY environment variable for production.')

# PostgreSQL — required at runtime; collectstatic during Render build does not need DB.
if _is_render_collectstatic_build():
    pass  # keep DATABASES from base.py (sqlite fallback is fine for collectstatic)
else:
    _database_url = config('DATABASE_URL', default='')
    if not _database_url:
        raise ImproperlyConfigured(
            'DATABASE_URL is required in production. On Render: create a PostgreSQL database '
            'and link it to this web service (Environment → Link Database).'
        )

    DATABASES = {
        'default': dj_database_url.config(
            default=_database_url,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True,
        )
    }
    _db_host = (DATABASES['default'].get('HOST') or '').lower()
    if _db_host in ('', 'localhost', '127.0.0.1', '::1'):
        raise ImproperlyConfigured(
            f'DATABASE_URL points to "{_db_host or "localhost"}" — remove any local '
            'postgres URL from Render env vars and use the linked database connection string.'
        )

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ssb-connect.onrender.com",
    ".onrender.com",
    ".up.railway.app",
]
_render_hostname = config('RENDER_EXTERNAL_HOSTNAME', default='')
if _render_hostname:
    ALLOWED_HOSTS.append(_render_hostname)

# CSRF Trusted Origins
CSRF_TRUSTED_ORIGINS = [
    "https://ssb-connect.onrender.com",
]
_csrf_origins = list(config('CSRF_TRUSTED_ORIGINS', default='', cast=Csv()))
if _csrf_origins:
    CSRF_TRUSTED_ORIGINS.extend(_csrf_origins)

# Keep CORS in sync with frontend URLs (Vercel / Netlify set via CSRF_TRUSTED_ORIGINS on Render).
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(list(CORS_ALLOWED_ORIGINS) + CSRF_TRUSTED_ORIGINS))

CHANNEL_LAYER_BACKEND = config('CHANNEL_LAYER_BACKEND', default='channels_redis.core.RedisChannelLayer')
CHANNEL_LAYERS = {'default': {'BACKEND': CHANNEL_LAYER_BACKEND}}
if CHANNEL_LAYER_BACKEND == 'channels_redis.core.RedisChannelLayer':
    CHANNEL_LAYERS['default']['CONFIG'] = {'hosts': [config('REDIS_URL', default='redis://127.0.0.1:6379/0')]}

SECURE_SSL_REDIRECT = env_bool('SECURE_SSL_REDIRECT', default=True)
SESSION_COOKIE_SECURE = env_bool('SESSION_COOKIE_SECURE', default=True)
CSRF_COOKIE_SECURE = env_bool('CSRF_COOKIE_SECURE', default=True)
SECURE_HSTS_SECONDS = int(config('SECURE_HSTS_SECONDS', default=31536000))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
SECURE_HSTS_PRELOAD = env_bool('SECURE_HSTS_PRELOAD', default=True)
