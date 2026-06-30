"""Pick Django settings module for local dev vs Render/Railway production."""
import os


def configure_default_settings_module() -> None:
    if os.environ.get('DJANGO_SETTINGS_MODULE'):
        return
    on_render = os.environ.get('RENDER') == 'true' or bool(os.environ.get('RENDER_EXTERNAL_HOSTNAME'))
    on_railway = bool(os.environ.get('RAILWAY_ENVIRONMENT') or os.environ.get('RAILWAY_PUBLIC_DOMAIN'))
    if on_render or on_railway:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.production'
    else:
        os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
