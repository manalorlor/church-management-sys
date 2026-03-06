from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Event, VolunteerSlot
from .serializers import EventSerializer, VolunteerSlotSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published', 'recurrence']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['start_datetime']

class VolunteerSlotViewSet(viewsets.ModelViewSet):
    queryset = VolunteerSlot.objects.all()
    serializer_class = VolunteerSlotSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['event', 'member']
    ordering_fields = ['created_at']

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        slot = self.get_object()
        member_id = request.data.get('member_id')
        if not member_id:
            return Response({"error": "member_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        slot.member_id = member_id
        slot.save()
        return Response(self.get_serializer(slot).data)

    @action(detail=True, methods=['delete'], url_path='unassign')
    def unassign(self, request, pk=None):
        slot = self.get_object()
        slot.member = None
        slot.save()
        return Response(self.get_serializer(slot).data)
