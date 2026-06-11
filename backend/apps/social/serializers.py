"""
Serializers for the social app.
Post & Comment use plain Serializer (MongoDB data — no ORM model).
Report still uses ModelSerializer (PostgreSQL).
"""
from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Report


# ─────────────────────────────────────────────
#  MongoDB-backed serializers (plain)
# ─────────────────────────────────────────────

POST_TYPES = ["TEXT", "NOTE", "EXPERIENCE", "CURRENT_AFFAIRS"]


class PostCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180, required=False, allow_blank=True, default="")
    body = serializers.CharField(required=True)
    post_type = serializers.ChoiceField(choices=POST_TYPES, default="TEXT")
    image_url = serializers.URLField(required=False, allow_blank=True, default="")
    video_url = serializers.URLField(required=False, allow_blank=True, default="")
    document_url = serializers.URLField(required=False, allow_blank=True, default="")
    group_id = serializers.CharField(required=False, allow_null=True, default=None)


class PostSerializer(serializers.Serializer):
    """Read serializer for a MongoDB post document."""
    id = serializers.CharField(read_only=True)
    author_id = serializers.IntegerField(read_only=True)
    author_username = serializers.CharField(read_only=True)
    author_avatar = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    body = serializers.CharField(read_only=True)
    post_type = serializers.CharField(read_only=True)
    image_url = serializers.CharField(read_only=True)
    video_url = serializers.CharField(read_only=True)
    document_url = serializers.CharField(read_only=True)
    group_id = serializers.CharField(read_only=True, allow_null=True)
    likes_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class CommentSerializer(serializers.Serializer):
    """Read serializer for a MongoDB comment document."""
    id = serializers.CharField(read_only=True)
    post_id = serializers.CharField()
    author_id = serializers.IntegerField(read_only=True)
    author_username = serializers.CharField(read_only=True)
    parent_id = serializers.CharField(allow_null=True, required=False)
    body = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)


# ─────────────────────────────────────────────
#  PostgreSQL-backed serializers (ORM)
# ─────────────────────────────────────────────

class ReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)

    class Meta:
        model = Report
        fields = ["id", "reporter", "reason", "details", "resolved", "created_at",
                  "post_mongo_id", "comment_mongo_id"]
        read_only_fields = ["id", "reporter", "resolved", "created_at"]
