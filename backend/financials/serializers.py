from rest_framework import serializers
from .models import Fund, Donation

class FundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fund
        fields = '__all__'

class DonationSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    fund_name = serializers.CharField(source='fund.name', read_only=True)
    
    class Meta:
        model = Donation
        fields = '__all__'

    def get_donor_name(self, obj):
        if obj.member:
            return str(obj.member)
        return obj.guest_name or "Anonymous"
