from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Fund, Donation
from .serializers import FundSerializer, DonationSerializer

class FundViewSet(viewsets.ModelViewSet):
    queryset = Fund.objects.all()
    serializer_class = FundSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active']
    search_fields = ['name']

class DonationViewSet(viewsets.ModelViewSet):
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['member', 'fund', 'payment_method', 'date']
    search_fields = ['transaction_ref', 'notes']
    ordering_fields = ['date', 'amount']
