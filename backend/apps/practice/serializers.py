from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from .models import PracticePrompt, PracticeReview, PracticeSubmission


class PracticePromptSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = PracticePrompt
        fields = [
            'id', 'prompt_type', 'title', 'text', 'image', 'image_url',
            'is_daily', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class PracticeSubmissionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    prompt_title = serializers.CharField(source='prompt.title', read_only=True, default=None)

    class Meta:
        model = PracticeSubmission
        fields = [
            'id', 'prompt', 'prompt_title', 'user', 'practice_type', 'response',
            'attachment', 'metadata', 'evaluation', 'peer_review_requested', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'created_at']


class PracticeReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)

    class Meta:
        model = PracticeReview
        fields = '__all__'
        read_only_fields = ['id', 'reviewer', 'created_at']
