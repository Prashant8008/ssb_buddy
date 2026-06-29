from .base import *  # noqa: F401,F403
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

_secret = config('SECRET_KEY', default='')
if not _secret or _secret.startswith('dev-only'):
    raise ImproperlyConfigured('Set a strong SECRET_KEY environment variable for production.')
SECRET_KEY = _secret

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "ssb-connect.onrender.com",
]
_render_hostname = config('RENDER_EXTERNAL_HOSTNAME', default='')
if _render_hostname:
    ALLOWED_HOSTS.append(_render_hostname)

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
