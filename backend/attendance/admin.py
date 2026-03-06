from django.contrib import admin
from .models import Service, AttendanceRecord

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'service_type', 'date', 'start_time', 'location')
    list_filter = ('service_type', 'date')
    search_fields = ('name', 'location')
    ordering = ('-date',)

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ('member', 'service', 'check_in_method', 'check_in_time')
    list_filter = ('check_in_method', 'service')
    search_fields = ('member__first_name', 'member__last_name')
    ordering = ('-check_in_time',)
