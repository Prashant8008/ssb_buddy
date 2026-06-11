from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = Note
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'saved_by', 'downloads', 'created_at']
