from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from .models import Member


def _build_photo_url(request, member):
    """Return the absolute URL for a member's photo, or None."""
    if member and member.photo:
        return request.build_absolute_uri(member.photo.url)
    return None


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        """Embed custom claims INSIDE the JWT so jwtDecode() can read them."""
        token = super().get_token(user)
        token['username'] = user.username
        token['is_superuser'] = user.is_superuser
        
        member = Member.objects.filter(user=user).first()
        if member:
            token['role'] = member.role
            token['member_id'] = member.id
            token['first_name'] = member.first_name
            token['last_name'] = member.last_name
        else:
            token['role'] = 'admin' if user.is_superuser else 'member'
            token['member_id'] = None
            token['first_name'] = user.first_name
            token['last_name'] = user.last_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Also expose these in the response body for convenience
        data['username'] = self.user.username
        data['is_superuser'] = self.user.is_superuser
        
        member = Member.objects.filter(user=self.user).first()
        if member:
            data['role'] = member.role
            data['member_id'] = member.id
            data['first_name'] = member.first_name
            data['last_name'] = member.last_name
            # Include photo URL in login response
            if member.photo:
                request = self.context.get('request')
                data['photo_url'] = request.build_absolute_uri(member.photo.url) if request else member.photo.url
            else:
                data['photo_url'] = None
        else:
            data['role'] = 'admin' if self.user.is_superuser else 'member'
            data['member_id'] = None
            data['first_name'] = self.user.first_name
            data['last_name'] = self.user.last_name
            data['photo_url'] = None
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')

        # Convert empty string to None so unique constraint isn't violated by multiple empty emails
        email = email.strip() if email else None

        if not username or not password or not first_name or not last_name:
            return Response({'error': 'Please provide all required fields.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if email and Member.objects.filter(email=email).exists():
            return Response({'error': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create the user
        user = User.objects.create_user(username=username, password=password, email=email or '', first_name=first_name, last_name=last_name)

        # Create the Member profile
        member = Member.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            email=email,
            role='member',
            status='active'
        )

        return Response({'success': 'User registered successfully.'}, status=status.HTTP_201_CREATED)


class ProfileView(APIView):
    """
    GET  /api/v1/auth/profile/  — return the current user's member profile
    PATCH /api/v1/auth/profile/  — update name, email, or upload a new photo
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_member(self, request):
        return Member.objects.filter(user=request.user).first()

    def get(self, request):
        member = self._get_member(request)
        photo_url = _build_photo_url(request, member)
        return Response({
            'username': request.user.username,
            'first_name': member.first_name if member else request.user.first_name,
            'last_name': member.last_name if member else request.user.last_name,
            'email': member.email if member else request.user.email,
            'role': member.role if member else ('admin' if request.user.is_superuser else 'member'),
            'photo_url': photo_url,
            'member_id': member.id if member else None,
        })

    def patch(self, request):
        member = self._get_member(request)
        data = request.data

        # If it's a superuser (or external user) without a Member profile, create one on the fly
        if not member:
            member = Member.objects.create(
                user=request.user,
                first_name=request.user.first_name,
                last_name=request.user.last_name,
                email=request.user.email,
                role='admin' if request.user.is_superuser else 'member',
                status='active'
            )

        # Update photo if provided in request.FILES or request.data
        photo = request.FILES.get('photo') or request.data.get('photo')
        if photo and not isinstance(photo, str):
            # Delete old photo to save space
            if member.photo:
                member.photo.delete(save=False)
            member.photo = photo

        # Update name/email fields
        if 'first_name' in data:
            member.first_name = data['first_name']
            request.user.first_name = data['first_name']
        if 'last_name' in data:
            member.last_name = data['last_name']
            request.user.last_name = data['last_name']
        if 'email' in data:
            member.email = data['email']
            request.user.email = data['email']
        
        member.save()
        request.user.save()

        # Build absolute URL after saving
        photo_url = _build_photo_url(request, member)
        
        return Response({
            'success': True,
            'username': request.user.username,
            'first_name': member.first_name,
            'last_name': member.last_name,
            'email': member.email,
            'role': member.role,
            'photo_url': photo_url,
            'member_id': member.id,
        })
