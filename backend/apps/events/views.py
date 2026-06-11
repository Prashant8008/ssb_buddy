from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from config.permissions import IsOwnerOrReadOnly
from .models import Event, RSVP
from .serializers import EventSerializer, RSVPSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.select_related('host', 'group').prefetch_related('rsvps').all()
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filterset_fields = ['event_type', 'city', 'state', 'group']
    search_fields = ['title', 'description', 'city', 'state']
    ordering_fields = ['starts_at', 'created_at']

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rsvp(self, request, pk=None):
        event = self.get_object()
        rsvp, _ = RSVP.objects.update_or_create(
            event=event,
            user=request.user,
            defaults={'status': request.data.get('status', 'GOING')},
        )
        return Response(RSVPSerializer(rsvp).data)


class RSVPViewSet(viewsets.ModelViewSet):
    serializer_class = RSVPSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['event', 'status']

    def get_queryset(self):
        return RSVP.objects.filter(user=self.request.user).select_related('event', 'user')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Create your views here.
