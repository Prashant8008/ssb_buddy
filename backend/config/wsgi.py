"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from config.settings_module import configure_default_settings_module

configure_default_settings_module()

from django.core.wsgi import get_wsgi_application

application = get_wsgi_application()
