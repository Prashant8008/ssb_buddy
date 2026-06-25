from django.db.models import Max
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from .services import clear_messages_for_user, messages_for_user


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['title', 'participants__username']

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(participants=self.request.user)
            .annotate(last_msg_at=Max('messages__created_at'))
            .order_by('-last_msg_at', '-created_at')
            .prefetch_related('participants')
        )

    def destroy(self, request, *args, **kwargs):
        """Clear message history for the current user; chat stays in the list."""
        conv = self.get_object()
        clear_messages_for_user(request.user, conv)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        conversation = serializer.save(created_by=self.request.user)
        conversation.participants.add(self.request.user)

    def update(self, request, *args, **kwargs):
        if 'participant_ids' in request.data:
            return Response(
                {'detail': 'Cannot modify participants via this endpoint.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if 'participant_ids' in request.data:
            return Response(
                {'detail': 'Cannot modify participants via this endpoint.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def messages(self, request, pk=None):
        """GET /api/conversations/<id>/messages/ — fetch visible messages and mark as read."""
        conv = self.get_object()
        msgs = messages_for_user(request.user, conv).select_related('sender').order_by('created_at')
        unread = msgs.exclude(read_by=request.user).exclude(sender=request.user)
        for m in unread:
            m.read_by.add(request.user)
        serializer = MessageSerializer(msgs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def with_user(self, request):
        """GET /api/conversations/with_user/?user_id=<id> — find or create a 1:1 conversation."""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            from django.contrib.auth import get_user_model
            other = get_user_model().objects.get(pk=user_id)
        except Exception:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        conv = (
            Conversation.objects
            .filter(participants=request.user, is_group_chat=False)
            .filter(participants=other)
            .first()
        )
        if not conv:
            conv = Conversation.objects.create(
                title=f'{request.user.username} & {other.username}',
                is_group_chat=False,
                created_by=request.user,
            )
            conv.participants.add(request.user, other)

        serializer = self.get_serializer(conv, context={'request': request})
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['conversation', 'sender']
    search_fields = ['body']

    def get_queryset(self):
        return (
            Message.objects
            .filter(conversation__participants=self.request.user)
            .select_related('conversation', 'sender')
        )

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        if not conversation.participants.filter(pk=self.request.user.pk).exists():
            raise PermissionDenied('You are not a participant in this conversation.')
        message = serializer.save(sender=self.request.user)
        message.read_by.add(self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.sender_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own messages.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.sender_id != self.request.user.id and not self.request.user.is_staff:
            raise PermissionDenied('You can only delete your own messages.')
        instance.delete()
