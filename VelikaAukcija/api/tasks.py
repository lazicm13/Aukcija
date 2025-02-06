from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
import importlib
from celery import shared_task
from .models import Notification

@shared_task
def check_auctions_status():
    Auction = importlib.import_module('api.models').AuctionItem
    Bid = importlib.import_module('api.models').Bid
    now = datetime.now()

    auctions = Auction.objects.filter(end_date__lte=now, is_finished=False)

    for auction in auctions:
        # Pronađi ponudu sa najvećim iznosom za ovu aukciju
        winning_bid = Bid.objects.filter(auction_item=auction).order_by('-amount').first()

        if winning_bid:
            # Ako postoji pobednička ponuda, označi pobednika
            winner = winning_bid.bidder
            auction.winner = winner
            auction.is_finished = True
            auction.is_sold = True
            auction.save()

            subject = "Vaša aukcija je završena!"
            message = f"Vaša aukcija '{auction.title}' je završena!\nPobednik je {winner.first_name} {winner.last_name} sa ponudom od {auction.current_price} RSD.\n🏆 Kupca možete kontaktirati na:\n📞 Broj telefona: {winner.phone_number}\n📧 Email: {winner.email}"
            recipient = auction.seller.email
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient])

            # Obavesti pobednika putem mejla
            subject_winner = "Čestitamo, pobedili ste u aukciji!"
            message_winner = f"Čestitamo! Osvojili ste aukciju '{auction.title}' sa ponudom od {auction.current_price} RSD.\nProdavca možete kontaktirati na:\n📞 Broj telefona: {auction.seller.phone_number}\n📧 Email: {auction.seller.email}"
            send_mail(subject_winner, message_winner, settings.DEFAULT_FROM_EMAIL, [winner.email])
            
            Notification.objects.create(
                recipient=winner,
                auction_item = auction,
                message=
                f"Čestitamo! Osvojili ste aukciju '{auction.title}' sa ponudom od {auction.current_price} RSD.\n"
                f"Prodavca možete kontaktirati na:\n"
                f"📞 Broj telefona: {auction.seller.phone_number}\n"
                f"📧 Email: {auction.seller.email}"
            )

            # Kreiranje notifikacije za prodavca (vlasnika aukcije)
            Notification.objects.create(
                recipient=auction.seller,
                auction_item = auction,
                message=
                f"Vaša aukcija '{auction.title}' je završena!\n"
                f"Pobednik je {winner.first_name} {winner.last_name} sa ponudom od {auction.current_price} RSD.\n"
                f"🏆 Kupca možete kontaktirati na:\n"
                f"📞 Broj telefona: {winner.phone_number}\n"
                f"📧 Email: {winner.email}",
                notification_type="auction_end"
            )

        else:
            # Ako nema ponuda, označi aukciju kao neuspešnu i obavesti prodavca
            auction.is_finished = True
            auction.is_sold = False  # Dodaj ovo polje u model ako nije već prisutno
            auction.save()

            subject = "Vaša aukcija nije uspela!"
            message = f"Vaša aukcija '{auction.title}' nije uspela jer nije bilo ponuda."
            recipient = auction.seller.email
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient])

            Notification.objects.create(
            recipient=auction.seller,
            auction_item=auction,
            message=f"Vaša aukcija '{auction.title}' nije uspela jer nije bilo ponuda.",
            notification_type="auction_end"
            )
