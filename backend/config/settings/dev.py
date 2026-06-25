from .base import *  # noqa: F401,F403

DEBUG = env_bool('DEBUG', default=True)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost,0.0.0.0', cast=Csv())

EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

# Vite may use 5173+ when ports are busy — allow local dev + same-WiFi phone (LAN IP).
CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^https?://localhost:\d+$',
    r'^https?://127\.0\.0\.1:\d+$',
    r'^https?://192\.168\.\d{1,3}\.\d{1,3}:\d+$',
    r'^https?://10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$',
]
CSRF_TRUSTED_ORIGINS += [
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
]

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
