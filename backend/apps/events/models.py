from django.conf import settings
from django.db import models


class Event(models.Model):
    TYPES = [('MOCK_INTERVIEW', 'Mock Interview'), ('GD', 'Group Discussion'), ('RUNNING', 'Running Session'), ('LECTURETTE', 'Lecturette Practice'), ('CURRENT_AFFAIRS', 'Current Affairs Session')]
    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=30, choices=TYPES)
    host = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='hosted_events')
    group = models.ForeignKey('groups.StudyGroup', on_delete=models.SET_NULL, null=True, blank=True, related_name='events')
    starts_at = models.DateTimeField(db_index=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    city = models.CharField(max_length=80, blank=True, db_index=True)
    state = models.CharField(max_length=80, blank=True, db_index=True)
    online_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['starts_at']

    def __str__(self):
        return self.title


class RSVP(models.Model):
    STATUS = [('GOING', 'Going'), ('INTERESTED', 'Interested'), ('DECLINED', 'Declined')]
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='rsvps')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='event_rsvps')
    status = models.CharField(max_length=20, choices=STATUS, default='GOING')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('event', 'user')

# Create your models here.
