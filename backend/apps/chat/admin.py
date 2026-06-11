from django.contrib import admin

from .models import ClearedConversation, Conversation, Message

admin.site.register(Conversation)
admin.site.register(Message)
admin.site.register(ClearedConversation)

# Register your models here.
