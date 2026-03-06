from django.db import models
from members.models import Member

class Fund(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Donation(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('momo', 'Mobile Money'),
        ('bank', 'Bank Transfer'),
    ]

    member = models.ForeignKey(Member, related_name='donations', on_delete=models.SET_NULL, null=True, blank=True)
    guest_name = models.CharField(max_length=255, null=True, blank=True)
    fund = models.ForeignKey(Fund, related_name='donations', on_delete=models.PROTECT)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    transaction_ref = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        donor = self.member if self.member else (self.guest_name or "Anonymous")
        return f"{donor} - GH₵{self.amount} to {self.fund}"
