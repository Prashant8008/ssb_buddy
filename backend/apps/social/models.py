"""
Social app PostgreSQL models.
Post, Comment, Like have been moved to MongoDB (see mongo_models.py).
Only Report remains here for admin/moderation — it needs relational joins.
"""
from django.conf import settings
from django.db import models


class Report(models.Model):
    REASONS = [
        ("SPAM", "Spam"),
        ("ABUSE", "Abuse"),
        ("MISLEADING", "Misleading"),
        ("OTHER", "Other"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    # Store MongoDB ObjectId strings instead of FK to Post/Comment
    post_mongo_id = models.CharField(max_length=24, blank=True, db_index=True)
    comment_mongo_id = models.CharField(max_length=24, blank=True, db_index=True)
    reason = models.CharField(max_length=30, choices=REASONS)
    details = models.TextField(blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report by {self.reporter.username} — {self.reason}"
