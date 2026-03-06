from django.contrib import admin
from .models import Event, VolunteerSlot

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'start_datetime', 'end_datetime', 'location', 'recurrence', 'is_published')
    list_filter = ('is_published', 'recurrence')
    search_fields = ('title', 'description', 'location')
    ordering = ('-start_datetime',)

@admin.register(VolunteerSlot)
class VolunteerSlotAdmin(admin.ModelAdmin):
    list_display = ('role_name', 'event', 'slots_needed', 'member')
    list_filter = ('event',)
    search_fields = ('role_name',)
