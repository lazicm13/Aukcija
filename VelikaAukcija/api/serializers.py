from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AuctionItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'password']  # Uklonjeno confirm_password
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        user = User(
            email=validated_data['email'],
            username=validated_data['email']  # Koristimo email kao username
        )
        user.set_password(validated_data['password'])  # Hashujemo lozinku
        user.save()
        return user
    

class AuctionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionItem
        fields = ["id", "title", "description", "created_at", "seller", "currentPrice"]
        extra_kwargs = {"seller": {"read_only": True}}

    