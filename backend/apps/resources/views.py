from django.db.models import F
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .models import Note
from .serializers import NoteSerializer


class NoteViewSet(viewsets.ModelViewSet):
    queryset = Note.objects.select_related('uploaded_by').all()
    serializer_class = NoteSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['category', 'uploaded_by']
    search_fields = ['title', 'description', 'uploaded_by__username']
    ordering_fields = ['created_at', 'downloads']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def save(self, request, pk=None):
        note = self.get_object()
        if request.user in note.saved_by.all():
            note.saved_by.remove(request.user)
            saved = False
        else:
            note.saved_by.add(request.user)
            saved = True
        return Response({'saved': saved})

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        note = self.get_object()
        Note.objects.filter(pk=note.pk).update(downloads=F('downloads') + 1)
        return Response({'file': request.build_absolute_uri(note.file.url), 'downloads': note.downloads + 1})

# Create your views here.
