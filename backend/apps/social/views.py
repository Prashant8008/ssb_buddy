"""
Social API views backed by MongoDB (posts, comments, likes).
Report stays in PostgreSQL for admin/moderation tools.
"""
from pymongo.errors import PyMongoError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.network.services import get_feed_author_ids, get_friend_user_ids
from config.permissions import IsOwnerOrReadOnly
from .models import Report
from .serializers import (
    CommentSerializer, PostSerializer, ReportSerializer, PostCreateSerializer
)
from . import mongo_models as mm


# ─────────────────────────────────────────────
#  Posts  (MongoDB)
# ─────────────────────────────────────────────

class PostViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def list(self, request):
        """GET /api/posts/  — paginated feed (?feed=friends for connected aspirants)"""
        page = int(request.query_params.get("page", 1))
        post_type = request.query_params.get("post_type")
        author_id = request.query_params.get("author")
        group_id = request.query_params.get("group")
        feed_mode = (request.query_params.get("feed") or "all").lower()

        author_ids = None
        parsed_author_id = int(author_id) if author_id else None
        feed_meta = None

        if feed_mode == "friends":
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Log in to view your friends feed."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if not parsed_author_id:
                author_ids = get_feed_author_ids(request.user)
                friend_ids = get_friend_user_ids(request.user)
                feed_meta = {
                    "mode": "friends",
                    "connected_count": len(friend_ids),
                    "author_count": len(author_ids),
                }

        try:
            posts = mm.get_feed(
                page=page,
                post_type=post_type,
                author_id=parsed_author_id,
                group_id=group_id,
                author_ids=author_ids,
            )
            total = mm.count_posts(
                post_type=post_type,
                author_id=parsed_author_id,
                group_id=group_id,
                author_ids=author_ids,
            )
        except PyMongoError:
            return Response(
                {"detail": "Feed is temporarily unavailable. Check that MongoDB is running."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payload = {"count": total, "results": posts}
        if feed_meta is not None:
            payload["feed"] = feed_meta
        return Response(payload)

    def create(self, request):
        """POST /api/posts/"""
        serializer = PostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data

        user = request.user
        avatar = ""
        if hasattr(user, "profile") and user.profile.profile_picture:
            avatar = request.build_absolute_uri(user.profile.profile_picture.url)

        post = mm.create_post(
            author_id=user.id,
            author_username=user.username,
            author_avatar=avatar,
            body=d["body"],
            title=d.get("title", ""),
            post_type=d.get("post_type", "TEXT"),
            image_url=d.get("image_url", ""),
            video_url=d.get("video_url", ""),
            document_url=d.get("document_url", ""),
            group_id=d.get("group_id"),
        )
        return Response(post, status=status.HTTP_201_CREATED)

    def retrieve(self, request, pk=None):
        """GET /api/posts/<id>/"""
        post = mm.get_post(pk)
        if not post:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(post)

    def update(self, request, pk=None):
        """PUT/PATCH /api/posts/<id>/"""
        post = mm.update_post(pk, request.user.id, request.data)
        if not post:
            return Response({"detail": "Not found or not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return Response(post)

    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    def destroy(self, request, pk=None):
        """DELETE /api/posts/<id>/"""
        deleted = mm.delete_post(pk, request.user.id)
        if not deleted:
            return Response({"detail": "Not found or not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        """POST /api/posts/<id>/like/"""
        try:
            result = mm.toggle_like(pk, request.user.id)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        """POST /api/posts/<id>/save/"""
        try:
            result = mm.toggle_save(pk, request.user.id)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def comments(self, request, pk=None):
        """GET /api/posts/<id>/comments/"""
        return Response(mm.get_comments(pk))


# ─────────────────────────────────────────────
#  Comments  (MongoDB)
# ─────────────────────────────────────────────

class CommentViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def create(self, request):
        """POST /api/comments/"""
        post_id = request.data.get("post_id", "")
        body = request.data.get("body", "").strip()
        parent_id = request.data.get("parent_id")
        if not post_id or not body:
            return Response({"detail": "post_id and body are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            comment = mm.add_comment(
                post_id=post_id,
                author_id=request.user.id,
                author_username=request.user.username,
                body=body,
                parent_id=parent_id,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(comment, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        """DELETE /api/comments/<id>/"""
        post_id = request.data.get("post_id", "")
        deleted = mm.delete_comment(pk, request.user.id, post_id)
        if not deleted:
            return Response({"detail": "Not found or not authorized."}, status=status.HTTP_403_FORBIDDEN)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
#  Reports  (PostgreSQL — kept for admin tools)
# ─────────────────────────────────────────────

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ["reason", "resolved"]

    def get_queryset(self):
        qs = Report.objects.select_related("reporter")
        if self.request.user.is_staff:
            return qs
        return qs.filter(reporter=self.request.user)

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
