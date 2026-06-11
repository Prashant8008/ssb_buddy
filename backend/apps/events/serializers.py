from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import Event, RSVP


class EventSerializer(serializers.ModelSerializer):
    host = UserSerializer(read_only=True)
    rsvp_count = serializers.IntegerField(source='rsvps.count', read_only=True)

    class Meta:
        model = Event
        fields = '__all__'
        read_only_fields = ['id', 'host', 'created_at']


class RSVPSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    event = EventSerializer(read_only=True)

    class Meta:
        model = RSVP
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at']
