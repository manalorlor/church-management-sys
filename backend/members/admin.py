from django.contrib import admin
from .models import Family, Member

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ('family_name', 'created_at')
    search_fields = ('family_name',)
    ordering = ('family_name',)

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'phone', 'status', 'gender')
    list_filter = ('status', 'gender')
    search_fields = ('first_name', 'last_name', 'email', 'phone')
    ordering = ('last_name', 'first_name')
