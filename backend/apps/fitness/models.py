from django.conf import settings
from django.db import models


class RunSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='run_sessions',
    )
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    distance_m = models.FloatField()
    duration_sec = models.PositiveIntegerField()
    avg_pace = models.CharField(max_length=16, blank=True)
    route_points = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'Run {self.user_id} — {self.distance_m:.0f}m'
