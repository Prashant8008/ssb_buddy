from django.conf import settings
from django.db import models


class Conversation(models.Model):
    title = models.CharField(max_length=140, blank=True)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    group = models.ForeignKey('groups.StudyGroup', on_delete=models.CASCADE, null=True, blank=True, related_name='conversations')
    is_group_chat = models.BooleanField(default=False)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or f'Conversation {self.pk}'


class ClearedConversation(models.Model):
    """Per-user message clear: messages before cleared_at are hidden for this user."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cleared_conversations',
    )
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='cleared_by',
    )
    cleared_at = models.DateTimeField()

    class Meta:
        unique_together = ('user', 'conversation')

    def __str__(self):
        return f'{self.user_id} cleared {self.conversation_id}'


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='messages')
    body = models.TextField(blank=True)
    image = models.ImageField(upload_to='chat/images/', blank=True)
    document = models.FileField(upload_to='chat/documents/', blank=True)
    note = models.ForeignKey('resources.Note', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name='read_messages')

    class Meta:
        ordering = ['created_at']

# Create your models here.
