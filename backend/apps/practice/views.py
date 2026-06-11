from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .models import PracticePrompt, PracticeReview, PracticeSubmission
from .serializers import PracticePromptSerializer, PracticeReviewSerializer, PracticeSubmissionSerializer

IMAGE_TYPES = ('PPDT', 'TAT')
TEXT_TYPES = ('WAT', 'SRT')


class PracticePromptViewSet(viewsets.ModelViewSet):
    queryset = PracticePrompt.objects.all()
    serializer_class = PracticePromptSerializer
    filterset_fields = ['prompt_type', 'is_daily']
    search_fields = ['title', 'text']
    ordering_fields = ['created_at']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def random(self, request):
        """GET /api/practice-prompts/random/?type=PPDT|TAT|WAT|SRT"""
        prompt_type = request.query_params.get('type', '').upper()
        all_types = IMAGE_TYPES + TEXT_TYPES
        if prompt_type not in all_types:
            return Response(
                {'detail': f'Query param type must be one of: {", ".join(all_types)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = PracticePrompt.objects.filter(prompt_type=prompt_type)
        if prompt_type in IMAGE_TYPES:
            qs = qs.exclude(image='')
        else:
            qs = qs.exclude(text='')

        prompt = qs.order_by('?').first()
        if not prompt:
            return Response(
                {'detail': f'No {prompt_type} prompts found. Run: python manage.py seed_wat_srt'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(prompt, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def random_set(self, request):
        """GET /api/practice-prompts/random_set/?type=WAT|SRT&count=10"""
        prompt_type = request.query_params.get('type', '').upper()
        if prompt_type not in TEXT_TYPES:
            return Response(
                {'detail': 'random_set supports type=WAT or type=SRT only.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            count = min(20, max(1, int(request.query_params.get('count', 10))))
        except ValueError:
            count = 10

        prompts = list(
            PracticePrompt.objects
            .filter(prompt_type=prompt_type)
            .exclude(text='')
            .order_by('?')[:count]
        )
        if not prompts:
            return Response(
                {'detail': f'No {prompt_type} prompts found. Run: python manage.py seed_wat_srt'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(prompts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def stats(self, request):
        counts = {}
        for prompt_type in IMAGE_TYPES + TEXT_TYPES:
            qs = PracticePrompt.objects.filter(prompt_type=prompt_type)
            if prompt_type in IMAGE_TYPES:
                counts[prompt_type] = qs.exclude(image='').count()
            else:
                counts[prompt_type] = qs.exclude(text='').count()
        return Response(counts)


class PracticeSubmissionViewSet(viewsets.ModelViewSet):
    queryset = PracticeSubmission.objects.all()
    serializer_class = PracticeSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    filterset_fields = ['prompt', 'practice_type', 'peer_review_requested']
    search_fields = ['response']

    def get_queryset(self):
        return (
            PracticeSubmission.objects
            .filter(user=self.request.user)
            .select_related('prompt', 'user')
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PracticeReviewViewSet(viewsets.ModelViewSet):
    queryset = PracticeReview.objects.select_related('submission', 'reviewer').all()
    serializer_class = PracticeReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['submission', 'reviewer', 'rating']

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)
