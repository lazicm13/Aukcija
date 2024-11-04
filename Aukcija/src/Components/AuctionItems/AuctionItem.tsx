import React, { useState } from 'react';
import './../../Styles/auction.css';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { AxiosError } from 'axios';

interface AuctionItemProps {
    auction: {
        id: number;
        title: string;
        description: string;
        current_price: number;
        city: string;
        images: {
            id: number;
            image: string;
        }[];
    };
    onDelete: (id: number) => void;
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction, onDelete }) => {
    const { id, title, current_price, images, description, city } = auction;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [new_offer, setNewOffer] = useState<number>(0);
    const navigate = useNavigate();
    const [currentPrice, setCurrentPrice] = useState<number>(current_price);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    };
    const handleDelete = () => {
        onDelete(id);
    };

    const getFirstWords = (text: string, wordCount: number) => {
        return text.split(' ').slice(0, wordCount).join(' ') + (text.split(' ').length > wordCount ? '...' : '');
    };
    
    const handleOpenAd = () => {
        navigate(`/aukcija/${auction.id}`);
    };

    interface ErrorResponse {
        detail?: string; // ili dodajte druge potrebne atribute
    }

    const handleNewBid = async () => {
        if (new_offer && new_offer > current_price) {
            console.log(id);
            try {
                const response = await api.post('/api/bids/', {
                    auction_item_id: id,
                    amount: new_offer,
                });
                setNewOffer(0);
                setCurrentPrice(new_offer);
                console.log('New bid submitted:', response.data);
    
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;
    
                if (axiosError.response) {
                    // Server responded with a status other than 2xx
                    console.error('Error submitting bid:', axiosError.response.data);
                    alert(`Error: ${axiosError.response.data.detail || 'Something went wrong!'}`);
                } else if (axiosError.request) {
                    console.error('No response from server:', axiosError.request);
                    alert('No response from server. Please try again later.');
                } else {
                    console.error('Error', axiosError.message);
                    alert('An error occurred while submitting your bid.');
                }
            }
        } else {
            alert('Please enter a valid offer greater than the current price.');
        }
    };

    return (
        <div className="auction-item">
            {/* City in the top-right corner */}    
            <span className="auction-city">🧭{city}</span>
            <h3>{title}</h3>
            <button className="open-ad-btn" onClick={handleOpenAd}>Otvori oglas</button>
            <div className="slideshow-container">
                {images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={title} style={{ width: '100%', height: 'auto' }} className='auction-img' />
                        <p className="slide-description">{getFirstWords(description, 10)}</p>
                    </div>
                ))}
                <a className="prev" onClick={prevSlide}>&#10094;</a>
                <a className="next" onClick={nextSlide}>&#10095;</a>
            </div>
            <p className='current-price-par'>
                <b>Trenutna cena: {Number(currentPrice).toFixed(0)} Din.</b>
            </p>

            {location.pathname !== '/moje-aukcije' && <div className='new-offer-container'>
                <input
                    type='number'
                    name='new_offer'
                    id='new_offer'
                    value={new_offer}
                    onChange={(e) => {
                        const value = e.target.value === "" ? NaN : Math.floor(Number(e.target.value));
                        setNewOffer(value);
                    }}
                    placeholder='Licitiraj ovde...'
                    />
                <button type='submit' className='new-offer-btn' onClick={handleNewBid}>Licitiraj</button>
            </div>
            }
            {location.pathname === '/moje-aukcije' && <button className="delete-btn" onClick={handleDelete}>Obriši aukciju</button>}
        </div>
    );
};

export default AuctionItem;
