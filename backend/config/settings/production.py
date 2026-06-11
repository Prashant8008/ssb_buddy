from .base import *  # noqa: F401,F403

DEBUG = False
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

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
