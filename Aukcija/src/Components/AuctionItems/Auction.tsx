import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './../../Styles/auction.css';
import api from '../../api';

interface AuctionImage {
    id: number;
    image: string;
}

interface Bid {
    user: string;
    amount: number;
    date: string;
}

interface Auction {
    id: number;
    title: string;
    description: string;
    current_price: number;
    images: AuctionImage[];
    bids: Bid[];
}

const Auction: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newOffer, setNewOffer] = useState<number>(NaN);

    useEffect(() => {
        // Fetch auction data by ID
        const fetchAuction = async () => {
            try {
                const response = await api.get(`/api/auction/${id}/`);
                if (response.status === 200) { // Provera da li je status 200 za uspešan odgovor
                    setAuction(response.data);
                } else {
                    console.error("Failed to fetch auction data");
                }
            } catch (error) {
                console.error("Error fetching auction data:", error);
            }
        };

        fetchAuction();
    }, [id]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (auction && auction.images.length > 0) ? (prev + 1) % auction.images.length : 0);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (auction && auction.images.length > 0) ? (prev - 1 + auction.images.length) % auction.images.length : 0);
    };

    if (!auction) {
        return <div>Loading auction details...</div>;
    }

    return (
        <div className="auction-details">
            <h2>{auction.title}</h2>
            <div className="slideshow-container-large">
                {auction.images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={auction.title} className="large-image" />
                    </div>
                ))}
                <a className="prev" onClick={prevSlide}>&#10094;</a>
                <a className="next" onClick={nextSlide}>&#10095;</a>
            </div>
            <p className="full-description">{auction.description}</p>
            <p className="current-price"><b>Trenutna cena: {auction.current_price} RSD</b></p>
            
            <div className="new-offer-container">
                <input
                    type="number"
                    name="new_offer"
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value ? Math.floor(Number(e.target.value)) : NaN)}
                    placeholder="Unesite novu ponudu..."
                />
                <button className="new-offer-btn">Potvrdi</button>
            </div>

            {/* <div className="bid-history">
                <h3>Istorija ponuda</h3>
                {auction.bids.map((bid, index) => (
                    <div className="bid" key={index}>
                        <p><b>Korisnik:</b> {bid.user}</p>
                        <p><b>Ponuda:</b> {bid.amount} RSD</p>
                        <p><b>Datum:</b> {bid.date}</p>
                    </div>
                ))}
            </div> */}
        </div>
    );
};

export default Auction;
