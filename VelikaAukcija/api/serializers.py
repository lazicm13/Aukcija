from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AuctionItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]    
        extra_kwargs = {"password": {"write_only": True}} #We're accepting password but we are not returning it

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
        
class AuctionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionItem
        fields = ["id", "title", "description", "created_at", "seller"]
        extra_kwargs = {"seller": {"read_only": True}}

    