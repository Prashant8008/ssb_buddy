from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Conversation, Message
from .services import messages_for_user


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'body', 'image', 'created_at', 'read_by']
        read_only_fields = ['id', 'sender', 'created_at', 'read_by']


class ConversationSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True, read_only=True)
    participant_ids = serializers.PrimaryKeyRelatedField(
        many=True, write_only=True, queryset=__import__('django.contrib.auth', fromlist=['get_user_model']).get_user_model().objects.all(),
        source='participants'
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'is_group_chat', 'participants', 'participant_ids',
            'created_by', 'created_at', 'last_message', 'unread_count'
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_last_message(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            msg = obj.messages.last()
        else:
            msg = messages_for_user(request.user, obj).order_by('created_at').last()
        if msg:
            return {
                'body': msg.body,
                'sender': msg.sender.username,
                'created_at': msg.created_at.isoformat(),
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return (
            messages_for_user(request.user, obj)
            .exclude(read_by=request.user)
            .exclude(sender=request.user)
            .count()
        )
