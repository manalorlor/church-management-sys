from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Service, AttendanceRecord
from .serializers import ServiceSerializer, AttendanceRecordSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_type', 'date']
    search_fields = ['name', 'location']
    ordering_fields = ['date', 'start_time']

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        service = self.get_object()
        member_id = request.data.get('member_id')
        method = request.data.get('check_in_method', 'manual')
        
        if not member_id:
            return Response({"error": "member_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        record, created = AttendanceRecord.objects.get_or_create(
            service=service,
            member_id=member_id,
            defaults={'check_in_method': method}
        )
        
        if not created:
            return Response({"message": "Member already checked in"}, status=status.HTTP_200_OK)
            
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'member', 'check_in_method']
    ordering_fields = ['check_in_time']
