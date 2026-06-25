#!/bin/sh
set -e

python manage.py migrate --noinput
exec daphne -b 0.0.0.0 -p "${PORT:-8080}" config.asgi:application
