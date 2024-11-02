from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, AuctionItemSerializer, AuctionImageSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem, AuctionImage
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from backend import settings
from google.oauth2 import id_token
from google.auth.transport import requests
import json
from rest_framework.exceptions import NotFound

# Create your views here.

@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFTokenView(APIView):
    def get(self, request):
        csrf_token = get_token(request)
        print(f"CSRF token generated for request: {csrf_token}")  # Log token on the server
        return JsonResponse({'csrftoken': csrf_token})


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class AuctionItemListCreate(generics.ListCreateAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)  # Ensure to save the seller


class AuctionItemDelete(generics.DestroyAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        user = authenticate(username=email, password=password)
        if user is not None:
            login(request, user)
            return Response({"detail": "Logged in successfully"}, status=status.HTTP_200_OK)
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


@method_decorator(csrf_protect, name='dispatch')
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.is_authenticated:
            logout(request)
            return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        return Response({"detail": "User is not authenticated"}, status=status.HTTP_400_BAD_REQUEST)


def user_status(request):
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True, 'username': request.user.username})
    else:
        return JsonResponse({'is_authenticated': False, 'username': None})


def google_login(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            token = body.get('id_token')

            if not token:
                return JsonResponse({'error': 'No token provided'}, status=400)

            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_OAUTH2_CLIENT_ID)
            email = idinfo.get('email')
            name = idinfo.get('name', '')

            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email, 'first_name': name}
            )

            if created:
                user.set_unusable_password()  # Disable password for Google-created users
                user.save()

            login(request, user)
            return JsonResponse({'message': 'Login successful!', 'email': email, 'name': name}, status=200)

        except ValueError as e:
            return JsonResponse({'error': 'Invalid token', 'details': str(e)}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An error occurred', 'details': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)


class AllAuctionItemsList(generics.ListAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return AuctionItem.objects.all()



class AuctionImageListCreate(generics.ListCreateAPIView):
    serializer_class = AuctionImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        auction_item_id = self.kwargs.get('auction_item_id')
        return AuctionImage.objects.filter(auction_item_id=auction_item_id)

    def perform_create(self, serializer):
        auction_item_id = self.kwargs.get('auction_item_id')
        try:
            auction_item = AuctionItem.objects.get(id=auction_item_id)
        except AuctionItem.DoesNotExist:
            return Response({"error": "Auction item not found."}, status=status.HTTP_404_NOT_FOUND)

        images = self.request.FILES.getlist('image')  # Adjust based on the actual field name
        if not images:
            return Response({"error": "No images were provided."}, status=status.HTTP_400_BAD_REQUEST)

        for image in images:
            image_serializer = AuctionImageSerializer(data={'image': image, 'auction_item': auction_item.id})
            if image_serializer.is_valid():
                image_serializer.save(auction_item_id=auction_item.id)
            else:
                print("Serializer errors:", image_serializer.errors)
                return Response({"error": image_serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Images uploaded successfully'}, status=status.HTTP_201_CREATED)

class AuctionItemDetail(generics.RetrieveAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return AuctionItem.objects.all()

    def get_object(self):
        auction_id = self.kwargs.get("pk")  # preuzima 'pk' iz URL-a
        try:
            return AuctionItem.objects.get(id=auction_id)
        except AuctionItem.DoesNotExist:
            raise NotFound({"error": "Auction item not found."})
