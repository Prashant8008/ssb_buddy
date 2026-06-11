from django.utils import timezone

from .models import ClearedConversation, Conversation, Message


def get_cleared_at(user, conversation_id: int):
    row = ClearedConversation.objects.filter(
        user=user, conversation_id=conversation_id
    ).values_list('cleared_at', flat=True).first()
    return row


def messages_for_user(user, conversation: Conversation):
    """Messages visible to user (after their last clear, if any)."""
    qs = Message.objects.filter(conversation=conversation)
    cleared_at = get_cleared_at(user, conversation.id)
    if cleared_at:
        qs = qs.filter(created_at__gt=cleared_at)
    return qs


def clear_messages_for_user(user, conversation: Conversation):
    """Hide all current messages for this user; conversation stays in their list."""
    ClearedConversation.objects.update_or_create(
        user=user,
        conversation=conversation,
        defaults={'cleared_at': timezone.now()},
    )
