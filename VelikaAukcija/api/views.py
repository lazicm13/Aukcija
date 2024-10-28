from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, AuctionItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect, csrf_exempt
from django.utils.decorators import method_decorator
from backend import settings
from google.oauth2 import id_token
from google.auth.transport import requests
from rest_framework.decorators import api_view
import json



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

class AuctionItemListCreate(generics.ListCreateAPIView): #Has two functions
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated] 

    def get_queryset(self):
        user = self.request.user #getting user that is authenticated and is interacting with this route
        return AuctionItem.objects.filter(seller=user) # returning all auctions for current user
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(seller=self.request.user)  # Ensure to save the seller
        else:
            print(serializer.errors)  # Log validation errors
            raise serializer.ValidationError(serializer.errors)

class AuctionItemDelete(generics.DestroyAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user #getting user that is authenticated and is interacting with this route
        return AuctionItem.objects.filter(seller=user)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # csrf_token = request.META.get('CSRF_COOKIE')
        # print("CSRF Token (login):", csrf_token)
        # print("CSRF from header (login):", request.META.get('HTTP_X_CSRFTOKEN'))
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
    print("dosao sam do ovde")
    def post(self, request):
        try:
            print('evo me')
            print("CSRF Token:", request.META.get('CSRF_COOKIE'))
            print("CSRF from header:", request.META.get('HTTP_X_CSRFTOKEN'))
            if(request.user.is_authenticated):
                logout(request)
                return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Error logging out: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)


def user_status(request):
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True, 'username': request.user.username})
    else:
        return JsonResponse({'is_authenticated': False, 'username': None})


# @csrf_exempt  # Consider security implications when using this
def google_login(request):
    if request.method == 'POST':
        try:
            # Load the JSON body from the request
            body = json.loads(request.body)

            # Extract the id_token from the body
            token = body.get('id_token')

            if not token:
                return JsonResponse({'error': 'No token provided'}, status=400)

            # Verify the token
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_OAUTH2_CLIENT_ID)

            # Extract user information from the token
            email = idinfo.get('email')
            name = idinfo.get('name', '')

            # Check if the user already exists
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'username': email, 'first_name': name}
            )

            if created:
                user.set_unusable_password()  # Disable password for Google-created users
                user.save()

            # Log the user in
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