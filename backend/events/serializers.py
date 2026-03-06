from rest_framework import serializers
from .models import Event, VolunteerSlot

class VolunteerSlotSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.__str__', read_only=True)
    
    class Meta:
        model = VolunteerSlot
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    volunteer_slots = VolunteerSlotSerializer(many=True, read_only=True)
    
    class Meta:
        model = Event
        fields = '__all__'
