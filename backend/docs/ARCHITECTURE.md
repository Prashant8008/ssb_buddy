# SSB Connect Architecture

## Layout

```text
backend/
  apps/                 Domain apps and business features
    accounts/           Custom user, profile, auth serializers/views
    social/             Feed, comments, likes, reports
    network/            Friend requests and follows
    groups/             Study groups and memberships
    chat/               Conversations, messages, websocket consumer
    practice/           PPDT, WAT, TAT, SRT prompts/submissions/reviews
    resources/          Notes and downloadable preparation material
    events/             Events and RSVP flows
    notifications/      Notification API and websocket consumer
    frontend/           Server-rendered shell
  config/
    settings/           base/dev/production settings
    api_urls.py         Central API composition
    urls.py             Public URL composition
    asgi.py             HTTP + websocket routing
  templates/            Django templates
  staticfiles/          Collected static output
```

## Boundaries

Apps own their models, serializers, views, admin, URLs, and migrations. Cross-app imports should point through the `apps.*` package path. Database app labels remain short names such as `accounts` and `social`, which keeps migrations stable after moving the code into `apps/`.

## Runtime Profiles

Local development uses `config.settings` which loads `config.settings.dev`. Production should use:

```powershell
$env:DJANGO_SETTINGS_MODULE='config.settings.production'
```

Production expects PostgreSQL, Redis for Channels, SMTP email settings, a strong `SECRET_KEY`, and HTTPS cookie/security options.
