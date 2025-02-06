from .models import CustomUser
from rest_framework import serializers
from .models import AuctionItem, AuctionImage, Comment, Notification
from datetime import timedelta
from django.utils import timezone

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'phone_number','email', 'password']  
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_email(self, value):
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Korisnik sa ovim emailom već postoji.")
        return value
    
    def validate_phone(self, value):
        if CustomUser.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError("Korisnik sa ovim brojem telefona već postoji.")
        return value

    def create(self, validated_data):
        user = CustomUser(
            first_name = validated_data['first_name'],
            email=validated_data['email'],
            phone_number = validated_data['phone_number'],
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
    auction_duration = serializers.IntegerField(write_only=True)

    class Meta:
        model = AuctionItem
        fields = [
            "id", "title", "description", "current_price", 
            "auction_duration", "city", "category", "phone_number", 
            "created_at", "end_date", "images", "seller", 
        ]
        read_only_fields = ["id", "created_at", "end_date", "seller"]

    def validate_title(self, value):
        # Check if an auction with the same title exists for the same user
        user = self.context['request'].user
        if AuctionItem.objects.filter(title=value, seller=user).exists():
            raise serializers.ValidationError("You already have an auction with this title.")
        return value

    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        auction_duration = validated_data.pop('auction_duration', 1)  # Default to 1 day if not specified
        current_time = timezone.now()
        owner = self.context['request'].user  # Get the current user from the request context

        # Ensure 'seller' is not in validated_data to avoid conflict
        validated_data['seller'] = owner

        # Create auction item and set the end_date based on the auction_duration
        auction_item = AuctionItem.objects.create(
            **validated_data,
            created_at=current_time,
            end_date=current_time + timedelta(hours=auction_duration)
        )

        # Save images associated with this auction item
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

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['first_name', 'phone_number', 'city']
        
class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()  # Use a method to display full name
    auction_item_id = serializers.IntegerField(write_only=True)
    userId = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'auction_item_id', 'user', 'content', 'created_at', 'userId']
        read_only_fields = ['id', 'user', 'created_at']

    def get_user(self, obj):
        # Retrieve the full name or a placeholder if the name is not available
        return f"{obj.user.first_name}"

    def create(self, validated_data):
        user = self.context['request'].user
        auction_item_id = validated_data.pop('auction_item_id')
        auction_item = AuctionItem.objects.get(id=auction_item_id)

        # Create the comment associated with the user and auction item
        comment = Comment.objects.create(
            user=user,
            auction_item=auction_item,
            **validated_data
        )
        return comment

    def validate(self, attrs):
        if not attrs.get('content'):
            raise serializers.ValidationError({'content': 'Komentar ne sme biti prazan.'})
        return attrs
    
class NotificationSerializer(serializers.ModelSerializer):
    auction_item_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'auction_item', 'notification_type', 'message', 'is_read', 'created_at', 'auction_item_id']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        auction_item_id = validated_data.pop('auction_item_id', None)
        if auction_item_id:
            auction_item = AuctionItem.objects.get(id=auction_item_id)
            validated_data['auction_item'] = auction_item

        return super().create(validated_data)

# class MessageSerializer(serializers.ModelSerializer):
#     sender = serializers.StringRelatedField()

#     class Meta:
#         model = Message
#         fields = ['sender', 'content', 'timestamp']

# class ChatRoomSerializer(serializers.ModelSerializer):
#     users = serializers.StringRelatedField(many=True)

#     class Meta:
#         model = ChatRoom
#         fields = ['users']