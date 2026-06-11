# Complete Project Structure

```text
backend/
  manage.py
  requirements.txt
  .env.example
  config/
    settings/
      base.py
      dev.py
      production.py
    urls.py
    api_urls.py
    asgi.py
    wsgi.py
  apps/
    accounts/        User, email verification, profile model/forms/API
    social/          Posts, comments, likes, reports
    network/         Friend requests and follows
    chat/            Conversations, messages, websocket consumer/routing
    groups/          Study groups and members
    resources/       Notes and downloads
    events/          Events and RSVPs
    notifications/   Notification API and websocket consumer
    practice/        PPDT, WAT, TAT, SRT prompts/submissions/reviews
    frontend/        Template page views and URLs
  templates/
    base.html
    authentication/
      login.html
      register.html
      forgot_password.html
    dashboard/
      home.html
    profiles/
      profile.html
      edit_profile.html
    posts/
      create_post.html
      post_detail.html
    chat/
      chat_list.html
      chat_room.html
    groups/
      group_list.html
      group_detail.html
    notes/
      upload_notes.html
      notes_list.html
    events/
      events.html
    practice/
      ppdt.html
      wat.html
      tat.html
      srt.html
    settings/
      settings.html
  static/
    css/
      app.css
    js/
      app.js
  deploy/
    docker-compose.yml
```

Naming note: the codebase keeps concise Django app labels already used by migrations. `social` is the posts module, `resources` is the notes module, and `practice` is the SSB practice module.
