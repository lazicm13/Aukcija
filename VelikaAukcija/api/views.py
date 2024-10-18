from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, AuctionItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse


# Create your views here.

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
            serializer.save(seller=self.request.user)
        else:
            print(serializer.errors)

class AuctionItemDelete(generics.DestroyAPIView):
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user #getting user that is authenticated and is interacting with this route
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


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    print("dosao sam do ovde")
    
    def post(self, request):
        try:
            print("CSRF Token:", request.META.get('CSRF_COOKIE'))
            print("CSRF from header:", request.META.get('HTTP_X_CSRFTOKEN'))
            if(request.user.is_authenticated):
                return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Error logging out: " + str(e)}, status=status.HTTP_400_BAD_REQUEST)


def user_status(request):
    if request.user.is_authenticated:
        return JsonResponse({'is_authenticated': True, 'username': request.user.username})
    else:
        return JsonResponse({'is_authenticated': False, 'username': None})
