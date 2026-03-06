from django.db import models
from members.models import Member

class Event(models.Model):
    RECURRENCE_CHOICES = [
        ('none', 'None'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    location = models.CharField(max_length=255, null=True, blank=True)
    recurrence = models.CharField(max_length=20, choices=RECURRENCE_CHOICES, default='none')
    is_published = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class VolunteerSlot(models.Model):
    event = models.ForeignKey(Event, related_name='volunteer_slots', on_delete=models.CASCADE)
    role_name = models.CharField(max_length=100)
    slots_needed = models.PositiveIntegerField(default=1)
    member = models.ForeignKey(Member, related_name='volunteer_assignments', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role_name} for {self.event}"
