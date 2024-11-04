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

from .models import Bid

class BidSerializer(serializers.ModelSerializer):
    auction_item_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Bid
        fields = ['id', 'auction_item_id', 'bidder', 'amount', 'created_at']
        read_only_fields = ['id', 'created_at', 'bidder']

    def create(self, validated_data):
        user = self.context['request'].user
        auction_item_id = validated_data.pop('auction_item_id')  # Use auction_item_id from validated data
        auction_item = AuctionItem.objects.get(id=auction_item_id)
        validated_data['auction_item'] = auction_item
        validated_data['bidder'] = user
        return super().create(validated_data)

    def validate(self, attrs):
        auction_item_id = attrs['auction_item_id']
        print("Validating auction_item_id:", auction_item_id)  # Debugging line
        try:
            auction_item = AuctionItem.objects.get(id=auction_item_id)
        except AuctionItem.DoesNotExist:
            raise serializers.ValidationError({
                'auction_item_id': 'Aukcija sa datim ID-om ne postoji.'
            })
        
        user = self.context['request'].user

        if auction_item.seller == user:
            raise serializers.ValidationError({
                'amount': 'Ne možete licitirati na svoj proizvod.'
            })

        if attrs['amount'] <= auction_item.current_price:
            raise serializers.ValidationError({
                'amount': 'Vaša ponuda mora biti veća od trenutne cene.'
            })

        attrs['auction_item'] = auction_item
        return attrs
