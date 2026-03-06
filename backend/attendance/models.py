from django.db import models
from members.models import Member

class Service(models.Model):
    SERVICE_TYPES = [
        ('sunday_service', 'Sunday Service'),
        ('small_group', 'Small Group'),
        ('special_event', 'Special Event'),
        ('midweek_service', 'Midweek Service'),
    ]

    name = models.CharField(max_length=255)
    service_type = models.CharField(max_length=50, choices=SERVICE_TYPES)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.date})"

class AttendanceRecord(models.Model):
    CHECK_IN_METHODS = [
        ('manual', 'Manual'),
        ('qr', 'QR Code'),
        ('self', 'Self Check-in'),
    ]

    service = models.ForeignKey(Service, related_name='attendance_records', on_delete=models.CASCADE)
    member = models.ForeignKey(Member, related_name='attendance_records', on_delete=models.CASCADE)
    check_in_time = models.DateTimeField(auto_now_add=True)
    check_in_method = models.CharField(max_length=20, choices=CHECK_IN_METHODS, default='manual')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('service', 'member')

    def __str__(self):
        return f"{self.member} at {self.service}"
