from rest_framework import generics, status, serializers
from .serializers import UserSerializer, AuctionItemSerializer, AuctionImageSerializer, BidSerializer, UserUpdateSerializer, CommentSerializer, NotificationSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem, AuctionImage, Bid, Comment, Notification
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
from rest_framework.exceptions import AuthenticationFailed
from datetime import timedelta
from django.utils.timezone import now
from celery import shared_task


User = get_user_model()
NOTIFICATION_DELAY = timedelta(hours=2) 
#region authentication

def verify_email(request, code):
    try:
        user = get_user_model().objects.get(verification_code=code)
        user.is_verified = True
        user.verification_code = None  # Očisti verifikacioni kod
        user.save()
        messages.success(request, "Uspešno ste verifikovali svoj nalog.")
        
        # Redirect na login stranicu klijentskog sajta
        return redirect(f'http://192.168:5173/login')
    except get_user_model().DoesNotExist:
        messages.error(request, "Verifikacioni kod nije validan.")
        return redirect(f'http://192.168.0.34:5173/login')

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
            
            if user.is_blocked:
                return Response({"detail": "Vaš nalog je blokiran. Ne možete se ulogovati."}, status=status.HTTP_403_FORBIDDEN)
            
            login(request, user)

            if user.is_superuser:
                return Response({"redirect_url": "http://192.168.0.34:5173/admin/dashboard"}, status=status.HTTP_200_OK)
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
                user.is_verified = True      # Set is_verified to True for new users
                user.save()
            else:
                # Update the is_verified field for existing users
                if not user.is_verified:
                    user.is_verified = True
                    user.save()
            
            if user.is_blocked:
                return JsonResponse({"detail": "Vaš nalog je blokiran. Ne možete se ulogovati."}, status=status.HTTP_403_FORBIDDEN)

            login(request, user)
            return JsonResponse({
                'message': 'Login successful!',
                'email': email,
                'name': name,
                'is_new_user': created  # This will indicate if the user is new or existing
            }, status=200)


        except ValueError as e:
            return JsonResponse({'error': 'Invalid token', 'details': str(e)}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': 'An error occurred', 'details': str(e)}, status=500)

    return JsonResponse({'error': 'Method not allowed'}, status=405)
#endregion

#region auctions
class AuctionItemListCreate(generics.ListCreateAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user

    def send_email_new_auction(self, id, user):
        auction_link = f"http://192.168.0.34:5173/aukcija/{id}"

        subject = 'Čestitamo, uspešno ste postavili aukciju!'
        message = f'Pogledajte oglas ovde: {auction_link}'
        send_email_task.delay(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        

    def perform_create(self, serializer):
        try:
            auction_item = serializer.save(seller=self.request.user)
            self.send_email_new_auction(auction_item.id, self.request.user)
        except serializers.ValidationError as e:
            print("Validation error:", e.detail)
            raise e

class AuctionItemDelete(generics.DestroyAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user  # Get the authenticated user
        if not user.is_superuser:
            return AuctionItem.objects.filter(seller=user)  # Return all auctions for the current user
        else:
            return AuctionItem.objects

    def delete(self, request, *args, **kwargs):
        auction_item = self.get_object()  # Get the auction item to delete

        if Bid.objects.filter(auction_item=auction_item).exists() and not request.user.is_superuser:
            return Response({"detail": "You cannot delete the auction because there are bids on it."}, status=status.HTTP_400_BAD_REQUEST)

        return super().delete(request, *args, **kwargs)



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

class AuctionCountView(APIView):
    permission_classes = [AllowAny]
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
        
class FetchAuctionOwnerView(generics.RetrieveAPIView):
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get(self, request, auction_id):
        try:
            auction_item = AuctionItem.objects.get(id=auction_id)
            first_name = auction_item.seller.first_name  # Assuming 'seller' is a ForeignKey to User
            user_id = auction_item.seller.id
            return Response({'first_name': first_name, 'id': user_id}, status=status.HTTP_200_OK)
        except AuctionItem.DoesNotExist:
            return Response({'detail': 'Auction item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
class AllAuctionItemsList(generics.ListAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return AuctionItem.objects.all()

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

class FetchAuctionWinner(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, auction_id):
        try:
            # Pronađi aukciju prema ID-u
            auction_item = AuctionItem.objects.get(id=auction_id)
            
            # Pronađi sve ponude za ovu aukciju
            bids = Bid.objects.filter(auction_item_id=auction_item.id).order_by('-amount')  # Sortiraj po iznosu u opadajućem redosledu

            if not bids:
                return Response({'error': 'No bids for this auction'}, status=status.HTTP_404_NOT_FOUND)
            
            # Pobednik je korisnik sa najvećom ponudom
            winner_bid = bids.first()  # Najveća ponuda
            winner = winner_bid.bidder  # Korisnik koji je dao najveću ponudu

            # Vratimo podatke o pobedniku
            winner_data = {
                'id': winner.id,
                'first_name': winner.first_name,
                'amount': winner_bid.amount,  # Najveća ponuda
            }

            return Response(winner_data, status=status.HTTP_200_OK)
        except AuctionItem.DoesNotExist:
            return Response({'error': 'Auction not found'}, status=status.HTTP_404_NOT_FOUND)
        

class FinishAuction(APIView):
    permission_classes = [IsAuthenticated]

    
        
        
#endregion


        
#region bids

class BidCreateView(generics.CreateAPIView):
    queryset = Bid.objects.all()
    serializer_class = BidSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can bid

    def perform_create(self, serializer):
        # Učitaj podatke o aukciji
        auction_item_id = serializer.validated_data['auction_item_id']
        auction_item = AuctionItem.objects.get(id=auction_item_id)

        # Proveri da li je aukcija završena
        if auction_item.end_date <= now():
            raise ValidationError({"detail": "Cannot place a bid. The auction has ended."})

        # Sačuvaj novu ponudu
        bid = serializer.save(bidder=self.request.user)

        # Proveri da li je ponuda validna (veća od trenutne cene)
        if bid.amount > (auction_item.current_price + 9):
            auction_item.current_price = bid.amount
            auction_item.save()

            # Pošalji obaveštenje vlasniku aukcije
            auction_owner = auction_item.seller
            if self.request.user != auction_owner:  # Vlasnik ne dobija obaveštenje za svoje ponude
                time_since_last_notification = (
                    now() - auction_item.last_bid_notified if auction_item.last_bid_notified else None
                )
                if not time_since_last_notification or time_since_last_notification > NOTIFICATION_DELAY:
                    # Pozovi funkciju za slanje obaveštenja
                    Notification.objects.create(
                        recipient=auction_owner,  # Korisnik koji je vlasnik aukcije
                        auction_item=auction_item,
                        message=f"Nova ponuda na vašoj aukciji '{auction_item.title}'! "
                                f"Ponuda je sada {auction_item.current_price} RSD.\n"
                    )

                    # Ažuriraj vreme poslednjeg obaveštenja
                    auction_item.last_bid_notified = now()
                    auction_item.save()
        else:
            raise ValidationError({"detail": "Bid must be higher than the current price."})




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
    
class FetchAllMyBiddings(generics.ListAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        my_biddings = Bid.objects.filter(bidder_id=user.id)

        bidded_auctions = AuctionItem.objects.filter(id__in=my_biddings.values('auction_item_id'))
        
        return bidded_auctions
    
#endregion

#region user
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(selft, request):
        if request.user.is_authenticated:
            return Response({'username': request.user.first_name}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
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
    
def admin_required(view_func):
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return JsonResponse({'error': 'Access denied'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

class CurrentUserDataView(APIView):
    permission_classes = [IsAuthenticated]  # Ensure only authenticated users can access

    def get(self, request):
        if request.user.is_authenticated:
            # Return the user's data as a response
            user_data = {
                #'email': request.user.email,
                'id': request.user.id,
                'first_name': request.user.first_name,
                'city': request.user.city,
                'phone_number': request.user.phone_number,
                'is_superuser': request.user.is_superuser,
                'email': request.user.email,
                #'username': request.user.username,
                #'is_verified': request.user.is_verified,
                #'date_joined': request.user.date_joined,
            }
            return Response(user_data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'User is not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)

class FetchUserDataByUsername(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, username):
        try:
            user = User.objects.get(username=username)

            user_data = {
                'username': user.username,
                'first_name': user.first_name,
                'is_active': user.is_active,
                'city': user.city,
                'phone_number': user.phone_number,
                'is_verified': user.is_verified,
                'is_blocked': user.is_blocked,
            }

            return Response(user_data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]  # Samo admin može blokirati korisnike

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=400)

        try:
            user = User.objects.get(username=username)
            if user.is_blocked:
                return Response({'message': 'User is already blocked'}, status=400)
            
            user.is_blocked = True
            user.save()
            return Response({'message': 'User successfully blocked'}, status=200)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

class UnblockUserView(APIView):
    permission_classes = [IsAuthenticated]  # Samo admin može blokirati korisnike

    def post(self, request):
        username = request.data.get('username')
        if not username:
            return Response({'error': 'Username is required'}, status=400)

        try:
            user = User.objects.get(username=username)
            if not user.is_blocked:
                return Response({'message': 'User cannot be unblocked because it is not blocked.'}, status=400)
            
            user.is_blocked = False
            user.save()
            return Response({'message': 'User successfully unblocked'}, status=200)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
#endregion

#region comments
class CommentListView(generics.ListAPIView):
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]  # Adjust this based on your app's permissions
    
    def get_queryset(self):
        auction_item_id = self.kwargs['auction_item_id']
        return Comment.objects.filter(auction_item__id=auction_item_id).order_by('-created_at')

# View to create a new comment for a specific auction item
class CommentCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def send_new_comment_email(self, id, user):
        auction_link = f"http://192.168.0.34:5173/aukcija/{id}"
        
        subject = "Novi komentar na vašoj aukciji"
        message = f'Pogledajte novi komentar ovde: {auction_link}'
        send_email_task.delay(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

    def post(self, request, *args, **kwargs):
        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            # Sačuvaj komentar
            comment = serializer.save()
            
            # Pristupi povezanoj aukciji
            auction_item = comment.auction_item
            
            # Pretpostavljam da `AuctionItem` ima polje `owner` koje referencira korisnika (vlasnika aukcije)
            auction_owner = auction_item.seller
            
            # Pošalji email vlasniku aukcije
            if comment.user != auction_owner:  # Vlasnik ne dobija obaveštenje za svoje komentare
                time_since_last_notification = now() - auction_item.last_notified if auction_item.last_notified else None
                
                if not time_since_last_notification or time_since_last_notification > NOTIFICATION_DELAY:
                    self.send_new_comment_email(auction_item.id, auction_owner)
                    auction_item.last_notified = now()  # Ažuriraj vreme poslednjeg obaveštenja
                    auction_item.save()

            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    
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

#endregion

        
#region emails
def send_verification_email(user):
    verification_code = secrets.token_urlsafe(20)
    
    # Spremaj kod u korisnikov model (ako želiš)
    user.verification_code = verification_code
    user.save()
    
    # Kreiraj link za potvrdu
    verification_link = f"http://192.168.0.34:8000/api/verify/{verification_code}/"
    
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




def send_report_email(id, reportText):
    send_mail(
        'Nova prijava aukcije',
        f"Prijavljena aukcija: http://192.168.0.34:5173/aukcija/{id}\n\n Tekst prijave: {reportText}",
        settings.DEFAULT_FROM_EMAIL,
        ["taxitracker2024@gmail.com"],
        fail_silently=False,
    )

# def send_auction_finished_email(auction_id, winnerId, amount):
#     # Priprema podataka za mejl
#     auction_link = f"http://localhost:5173/aukcija/{auction_id}"

#     # Dohvat korisnika koji je pobedio na aukciji
#     auction = AuctionItem.objects.get(id=auction_id);

#     User = get_user_model()
#     try:
#         winner = User.objects.get(id=winnerId)
#     except User.DoesNotExist:
#         raise NotFound("Pobednik aukcije nije pronađen.")

#     subject = f"Čestitamo {winner.first_name}. Pobedili ste na aukciji \"{auction.title}\"!"
#     message = f"Aukciju možete pogledati ovde: {auction_link}\nProdavca možete kontaktirati na broj telefona: {auction.phone_number}"
#     # Validacija da korisnik ima e-mail
#     if not winner.email:
#         raise ValueError("Pobednik nema podešenu e-mail adresu.")

#     # Asinkrono slanje mejla koristeći Celery task
#     send_email_task.delay(subject, message, settings.DEFAULT_FROM_EMAIL, [winner.email])

    

@shared_task
def send_email_task(subject, message, from_email, recipient_list):
    send_mail(subject, message, from_email, recipient_list, fail_silently=False)
#endregion

        
#region Notifications

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filtriraj notifikacije prema korisniku (prikazuje samo notifikacije koje su vezane za korisnika)
        return Notification.objects.filter(recipient=self.request.user).order_by('-created_at')

class CreateNotificationView(generics.CreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save()    

class MarkAsReadNotificationView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Notification.objects.all()

    http_method_names = ['get', 'patch']  # Ensure 'patch' is allowed if needed

    def get_object(self):
        notification = super().get_object()
        if notification.recipient != self.request.user:
            raise PermissionDenied("You do not have permission to mark this notification as read.")
        return notification

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        notification.mark_as_read()
        return Response(NotificationSerializer(notification).data, status=status.HTTP_200_OK)

class UnreadNotificationsCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Prebroj nepregledane notifikacije za trenutnog korisnika
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()

        return Response({"unread_notifications_count": unread_count}, status=status.HTTP_200_OK)

#endregion

# #region Messages
# class MessageView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, chatroom_id):
#         messages = Message.objects.filter(chatroom_id=chatroom_id)
#         serializer = MessageSerializer(messages, many=True)
#         return Response(serializer.data)

#     def post(self, request, chatroom_id):
#         content = request.data.get('content')
#         chatroom = ChatRoom.objects.get(id=chatroom_id)
#         message = Message.objects.create(
#             chatroom=chatroom,
#             sender=request.user,
#             content=content
#         )
#         serializer = MessageSerializer(message)
#         return Response(serializer.data)
# #endregion