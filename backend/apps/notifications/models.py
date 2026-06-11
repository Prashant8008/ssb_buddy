from django.conf import settings
from django.db import models


class Notification(models.Model):
    TYPES = [('MESSAGE', 'New Message'), ('FRIEND_REQUEST', 'Friend Request'), ('COMMENT', 'Comment'), ('GROUP', 'Group Activity'), ('EVENT', 'Event Reminder')]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=TYPES)
    title = models.CharField(max_length=160)
    body = models.TextField(blank=True)
    target_url = models.CharField(max_length=255, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

# Create your models here.
