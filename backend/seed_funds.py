from financials.models import Fund

Fund.objects.get_or_create(name='Yearly Dues', defaults={'description': 'Annual member dues', 'is_active': True})
Fund.objects.get_or_create(name='Welfare Dues', defaults={'description': 'Welfare contributions', 'is_active': True})
print("Funds seeded successfully")
