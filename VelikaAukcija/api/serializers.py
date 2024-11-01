from django.contrib.auth.models import User
from rest_framework import serializers
from .models import AuctionItem, AuctionImage

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


class AuctionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuctionImage
        fields = ['id', 'image', 'auction_item_id'] 

        def validate(self, attrs):
            if 'image' not in attrs:
                raise serializers.ValidationError({"image": "This field is required."})
            return attrs
        


class AuctionItemSerializer(serializers.ModelSerializer):
    images = AuctionImageSerializer(many=True, required=False)

    class Meta:
        model = AuctionItem
        fields = [
            "id", "title", "description", "current_price", 
            "auction_duration", "city", "phone_number", 
            "created_at", "images",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        auction_item = AuctionItem.objects.create(**validated_data)

        # Sačuvaj slike
        for image_data in images_data:
            AuctionImage.objects.create(auction_item=auction_item, **image_data)

        return auction_item

