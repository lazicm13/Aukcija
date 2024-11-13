from rest_framework import generics, status, serializers
from .serializers import UserSerializer, AuctionItemSerializer, AuctionImageSerializer, BidSerializer, UserUpdateSerializer, CommentSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem, AuctionImage, Bid, Comment
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
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.viewsets import ModelViewSet
from django.db import models

# Create your views here.

User = get_user_model()

def send_verification_email(user):
    verification_code = secrets.token_urlsafe(20)
    
    # Spremaj kod u korisnikov model (ako želiš)
    user.verification_code = verification_code
    user.save()
    
    # Kreiraj link za potvrdu
    verification_link = f"http://127.0.0.1:8000/api/verify/{verification_code}/"
    
    # Kreiraj HTML sadržaj email-a
    html_message = f'''
        <p>Hvala što ste se registrovali! Da biste potvrdili svoju registraciju, kliknite na sledeći link:</p>
        <p><a href="{verification_link}" target="_blank">Kliknite ovde za verifikaciju naloga</a></p>
    '''
    
    # Pošaljite email
    send_mail(
        'Verifikacija naloga',
        'Kliknite na sledeći link da biste potvrdili svoju registraciju.',  # plain-text verzija, može ostati kao fallback
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
        html_message=html_message  # Prosleđivanje HTML sadržaja
    )

def send_email_new_auction(id, user):
    auction_link = f"http://localhost:5173/aukcija/{id}"

    send_mail(
        'Čestitamo, uspešno ste postavili aukciju!',
        f'Pogledajte oglas ovde: {auction_link}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def send_report_email(id, reportText):
    send_mail(
        'Nova prijava aukcije',
        f"Prijavljena aukcija: http://localhost:5173/aukcija/{id}\n\n Tekst prijave: {reportText}",
        settings.DEFAULT_FROM_EMAIL,
        ["taxitracker2024@gmail.com"],
        fail_silently=False,
    )


def report_auction_view(request):
    if request.method != "POST":
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)
    
    try:
        data = json.loads(request.body)  # Parse JSON data from request body
        id = data.get('id')
        reportText = data.get('reportText')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)

    if not id or not reportText:
        return JsonResponse({'error': 'Missing auction ID or report text'}, status=400)
    
    send_report_email(id, reportText)
    return JsonResponse({'status': 'Report sent successfully'})

def verify_email(request, code):
    try:
        user = get_user_model().objects.get(verification_code=code)
        user.is_verified = True
        user.verification_code = None  # Očisti verifikacioni kod
        user.save()
        messages.success(request, "Uspešno ste verifikovali svoj nalog.")
        
        # Redirect na login stranicu klijentskog sajta
        return redirect(f'http://localhost:5173/login')
    except get_user_model().DoesNotExist:
        messages.error(request, "Verifikacioni kod nije validan.")
        return redirect(f'http://localhost:5173/login')

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


from django.utils import timezone
from rest_framework import serializers

class AuctionItemListCreate(generics.ListCreateAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user

    def perform_create(self, serializer):
        try:
            auction_item = serializer.save(seller=self.request.user)
            send_email_new_auction(auction_item.id, self.request.user)
        except serializers.ValidationError as e:
            print("Validation error:", e.detail)
            raise e



class AuctionItemDelete(generics.DestroyAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user

    def delete(self, request, *args, **kwargs):
        auction_item = self.get_object()  # Get the auction item to delete
        # Proveri da li aukcija ima ponude
        if Bid.objects.filter(auction_item=auction_item).exists():
            return Response({"detail": "You cannot delete the auction because there are bids on it."}, status=status.HTTP_400_BAD_REQUEST)

        # Ako nema ponuda, dozvoliti brisanje
        return super().delete(request, *args, **kwargs)



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
                return Response({"detail": "Vaš nalog nije verifikovan. Proverite vaš email."}, status=status.HTTP_403_FORBIDDEN)
            
            login(request, user)
            return Response({"detail": "Uspešno ste se ulogovali"}, status=status.HTTP_200_OK)
        
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
        
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

class BidCreateView(generics.CreateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can bid

    def perform_create(self, serializer):
        bid = serializer.save(bidder=self.request.user)
        auction_item_id = serializer.validated_data['auction_item_id']  # Use auction_item_id here
        auction_item = AuctionItem.objects.get(id=auction_item_id)

        if bid.amount > (auction_item.current_price + 9):
            auction_item.current_price = bid.amount
            auction_item.save()
        else:
            raise serializers.ValidationError({"detail": "Bid must be higher than the current price."})

    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            raise AuthenticationFailed("You must be logged in to place a bid.")
        return super().create(request, *args, **kwargs)


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
            first_name = auction_item.seller.first_name  # Assuming 'seller' is a ForeignKey to User
            return Response({'first_name': first_name}, status=status.HTTP_200_OK)
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
    
class AuctionCountView(APIView):
    def get(self, request, *args, **kwargs):
        # Get the auction_item_id from the URL parameters
        auction_item_id = self.kwargs.get('auction_item_id', None)
        print(auction_item_id)

        # If no specific auction_item_id is provided, return an error or count all bids
        if auction_item_id is None:
            return Response({"error": "Auction item ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if the auction item exists
            auction_item = AuctionItem.objects.get(id=auction_item_id)

            # Count the number of bids associated with the auction item
            bid_count = Bid.objects.filter(auction_item=auction_item).count()

            # Return the bid count in the response
            return Response({"bid_count": bid_count}, status=status.HTTP_200_OK)
        
        except AuctionItem.DoesNotExist:
            return Response({"error": "Auction item not found."}, status=status.HTTP_404_NOT_FOUND)

class CurrentUserDataView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure only authenticated users can access

    def get(self, request):
        # Check if the user is authenticated
        if request.user.is_authenticated:
            # Return the user's data as a response
            user_data = {
                #'email': request.user.email,
                'id': request.user.id,
                'first_name': request.user.first_name,
                'city': request.user.city,
                'phone_number': request.user.phone_number,
                #'username': request.user.username,
                #'is_verified': request.user.is_verified,
                #'date_joined': request.user.date_joined,
            }
            return Response(user_data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

class UpdateUserProfileView(generics.UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)  
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # View to list all comments for a specific auction item
class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]  # Adjust this based on your app's permissions
    
    def get_queryset(self):
        auction_item_id = self.kwargs['auction_item_id']
        return Comment.objects.filter(auction_item__id=auction_item_id).order_by('-created_at')

# View to create a new comment for a specific auction item
class CommentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = CommentSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AllAuctionItemsList(generics.ListAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return AuctionItem.objects.filter(end_date__gt=timezone.now())

class FetchAuctionsByCategory(generics.ListAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Get the 'category' parameter from the query string (if it exists)
        category = self.request.query_params.get('category', None)
        
        if category:
            # Filter auctions by category if it is provided
            return AuctionItem.objects.filter(category=category, end_date__gt=timezone.now())
        else:
            # If no category is provided, return all auctions
            return AuctionItem.objects.all()
        
    
class CommentDeleteView(generics.DestroyAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Pristupanje komentaru bilo kao autor ili kao vlasnik povezane aukcije
        user = self.request.user
        return Comment.objects.filter(user=user) | Comment.objects.filter(auction_item__seller=user)


    def delete(self, request, *args, **kwargs):
        comment_id = kwargs.get('pk')  # Retrieve comment ID from URL
        try:
            # Get the comment instance
            comment = self.get_queryset().get(id=comment_id)
            comment.delete()
            return Response({"detail": "Comment deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
        except Comment.DoesNotExist:
            raise NotFound({"detail": "Comment not found."})
