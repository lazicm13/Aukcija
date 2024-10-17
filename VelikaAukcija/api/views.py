from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, AuctionItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

# Create your views here.

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

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
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({"detail": "Logged in successfully"}, status=status.HTTP_200_OK)
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)

@login_required
def user_status(request):
    return JsonResponse({'is_authenticated': True, 'username': request.user.username})