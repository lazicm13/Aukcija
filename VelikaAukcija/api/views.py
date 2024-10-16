from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer, AuctionItemSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import AuctionItem
# Create your views here.

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class NoteListCreate(generics.ListCreateAPIView): #Has two functions
    serializer_class = AuctionItemSerializer
    permission_classes = [IsAuthenticated] #

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
