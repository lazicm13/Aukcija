# import json
# from channels.generic.websocket import AsyncWebsocketConsumer
# from asgiref.sync import sync_to_async
# from .models import Message, ChatRoom
# from .serializers import MessageSerializer

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.chatroom_id = self.scope['url_route']['kwargs']['chatroom_id']
#         self.room_group_name = f'chat_{self.chatroom_id}'

#         # Join room group
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )

#         # Accept WebSocket connection
#         await self.accept()

#         # Send initial messages to WebSocket (optional)
#         messages = await self.get_messages()
#         for message in messages:
#             await self.send(text_data=json.dumps({
#                 'sender': message['sender'],
#                 'content': message['content'],
#                 'timestamp': message['timestamp'],
#             }))

#     async def disconnect(self, close_code):
#         # Leave room group
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#     async def receive(self, text_data):
#         # Receive message from WebSocket
#         text_data_json = json.loads(text_data)
#         message_content = text_data_json['content']
#         sender = self.scope['user']  # Assume user is authenticated

#         # Save message to database
#         await self.save_message(message_content, sender)

#         # Send message to WebSocket
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'sender': sender.username,
#                 'content': message_content,
#                 'timestamp': str(message_content.timestamp),
#             }
#         )

#     async def chat_message(self, event):
#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'sender': event['sender'],
#             'content': event['content'],
#             'timestamp': event['timestamp'],
#         }))

#     @sync_to_async
#     def save_message(self, content, sender):
#         chatroom = ChatRoom.objects.get(id=self.chatroom_id)
#         message = Message.objects.create(
#             chatroom=chatroom,
#             sender=sender,
#             content=content,
#         )
#         return message

#     @sync_to_async
#     def get_messages(self):
#         chatroom = ChatRoom.objects.get(id=self.chatroom_id)
#         messages = Message.objects.filter(chatroom=chatroom).order_by('timestamp')[:50]  # Last 50 messages
#         return MessageSerializer(messages, many=True).data
