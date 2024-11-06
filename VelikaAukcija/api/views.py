from rest_framework import generics, status, serializers
from .serializers import UserSerializer, AuctionItemSerializer, AuctionImageSerializer, BidSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem, AuctionImage, Bid
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from django.utils import timezone
from backend import settings
from google.oauth2 import id_token
from google.auth.transport import requests
import json
from rest_framework.exceptions import NotFound
import secrets
from django.core.mail import send_mail
from django.shortcuts import redirect
from django.contrib import messages
from django.contrib.auth import get_user_model

# Create your views here.

User = get_user_model()

def send_verification_email(user):
    verification_code = secrets.token_urlsafe(20)
    
    # Spremaj kod u korisnikov model (ako želiš)
    user.verification_code = verification_code
    user.save()
    
    # Kreiraj link za potvrdu
    verification_link = f"http://127.0.0.1:8000/api/verify/{verification_code}/"
    
    # Pošaljite email
    send_mail(
        'Verifikacija naloga',
        f'Kliknite na sledeći link da biste potvrdili svoju registraciju: {verification_link}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def verify_email(request, code):
    try:
        user = get_user_model().objects.get(verification_code=code)
        user.is_verified = True
        user.verification_code = None  # Očisti verifikacioni kod
        user.save()
        messages.success(request, "Uspešno ste verifikovali svoj nalog.")
    except get_user_model().DoesNotExist:
        messages.error(request, "Verifikacioni kod nije validan.")
    
    return redirect('login')

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

    def perform_create(self, serializer):
        user = serializer.save()  
        send_verification_email(user)  


class AuctionItemListCreate(generics.ListCreateAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user

    def perform_create(self, serializer):
        active_auctions_count = AuctionItem.objects.filter(end_date__gt=timezone.now()).count()

        if active_auctions_count >= 1000:
            raise serializers.ValidationError({"detail": "You cannot create more than 1000 active auctions."})
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
        
        # Pronađite korisnika prema email-u
        user = authenticate(username=email, password=password)
        
        if user is not None:
            # Provera da li je korisnik verifikovan
            if not user.is_verified:
                return Response({"detail": "User account is not verified"}, status=status.HTTP_403_FORBIDDEN)
            
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
        return AuctionItem.objects.filter(end_date__gt=timezone.now())



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

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(selft, request):
        if request.user.is_authenticated:
            return Response({'username': request.user.first_name}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
class BidCreateView(generics.CreateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]  # Samo prijavljeni korisnici mogu licitirati

    def perform_create(self, serializer):
        bid = serializer.save(bidder=self.request.user)
        auction_item_id = serializer.validated_data['auction_item_id']  # Use auction_item_id here
        auction_item = AuctionItem.objects.get(id=auction_item_id)

        if bid.amount > (auction_item.current_price + 9):
            auction_item.current_price = bid.amount
            auction_item.save()
        else:
            raise serializers.ValidationError({"detail": "Bid must be higher than the current price."})

class BidListView(generics.ListAPIView):
    serializer_class = BidSerializer
    permission_classes = [AllowAny]  # Adjust as needed

    def get_queryset(self):
        auction_item_id = self.kwargs.get('auction_item_id')
        # Fetch bids related to the specific auction item
        return Bid.objects.filter(auction_item_id=auction_item_id)

    def get(self, request, *args, **kwargs):
        auction_item_id = self.kwargs.get('auction_item_id')
        # Check if auction_item_id is valid
        if not AuctionItem.objects.filter(id=auction_item_id).exists():
            return Response({"error": "Auction item not found."}, status=404)

        # Proceed to get bids for the auction item
        return super().get(request, *args, **kwargs)
    

class FetchAuctionOwnerView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get(self, request, auction_id):
        try:
            auction_item = AuctionItem.objects.get(id=auction_id)
            username = auction_item.seller.username  # Assuming 'seller' is a ForeignKey to User
            return Response({'username': username}, status=status.HTTP_200_OK)
        except AuctionItem.DoesNotExist:
            return Response({'detail': 'Auction item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class FetchUsernamesView(APIView):
    permission_classes = [AllowAny]  # Možeš prilagoditi dozvole prema potrebama

    def post(self, request):
        user_ids = request.data.get('ids', [])
        print(user_ids)
        
        # Validacija ulaznih podataka
        if not isinstance(user_ids, list):
            return Response({'error': 'Invalid input, expected a list of user IDs.'}, status=status.HTTP_400_BAD_REQUEST)
        
        usernames = []
        
        # Pronađi korisnike na osnovu ID-jeva
        for user_id in user_ids:
            try:
                user = User.objects.get(id=user_id)
                usernames.append(user.first_name)
            except User.DoesNotExist:
                continue  # Ignoriši nepostojeće korisnike
        
        return Response(usernames, status=status.HTTP_200_OK)
