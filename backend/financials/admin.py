from django.contrib import admin
from .models import Fund, Donation

@admin.register(Fund)
class FundAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('member', 'fund', 'amount', 'date', 'payment_method')
    list_filter = ('payment_method', 'fund', 'date')
    search_fields = ('member__first_name', 'member__last_name', 'transaction_ref')
    ordering = ('-date',)
