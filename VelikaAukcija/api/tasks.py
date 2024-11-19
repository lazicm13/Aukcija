from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime
import importlib
from celery import shared_task

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
            message = f"Vaša aukcija '{auction.title}' je završena. Pobednik je {winner.first_name}.\n Možete ga kontaktirati na broj telefona: {winner.phone_number}"
            recipient = auction.seller.email
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient])

            # Obavesti pobednika putem mejla
            subject_winner = "Čestitamo, pobedili ste u aukciji!"
            message_winner = f"Čestitamo! Pobedili ste u aukciji '{auction.title}'."
            send_mail(subject_winner, message_winner, settings.DEFAULT_FROM_EMAIL, [winner.email])

        else:
            # Ako nema ponuda, označi aukciju kao neuspešnu i obavesti prodavca
            auction.is_finished = True
            auction.is_sold = False  # Dodaj ovo polje u model ako nije već prisutno
            auction.save()

            subject = "Vaša aukcija nije uspela!"
            message = f"Vaša aukcija '{auction.title}' nije uspela jer nije bilo ponuda."
            recipient = auction.seller.email
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient])
