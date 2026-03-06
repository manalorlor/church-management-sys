from rest_framework import serializers
from .models import Service, AttendanceRecord

class AttendanceRecordSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = '__all__'

class ServiceSerializer(serializers.ModelSerializer):
    attendance_count = serializers.IntegerField(source='attendance_records.count', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'service_type', 'date', 'start_time',
            'end_time', 'location', 'notes', 'created_at', 'attendance_count',
        ]
