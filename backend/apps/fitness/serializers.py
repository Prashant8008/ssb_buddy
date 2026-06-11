from rest_framework import serializers

from .models import RunSession


class RunSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RunSession
        fields = [
            'id', 'started_at', 'ended_at', 'distance_m', 'duration_sec',
            'avg_pace', 'route_points', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
