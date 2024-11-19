import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from api.consumers import ChatConsumer  # Import consumer iz api aplikacije
from django.urls import path

# Postavljanje okruženja za Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'VelikaAukcija.settings')

# Glavna ASGI aplikacija
application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Upravlja HTTP zahtevima
    "websocket": AuthMiddlewareStack(  # Povezivanje WebSocket-a sa consumer-om
        URLRouter([
            path("ws/chat/<int:chatroom_id>/", ChatConsumer.as_asgi()),  # WebSocket ruta
        ])
    ),
})
