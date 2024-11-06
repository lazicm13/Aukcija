import React, { useState, useEffect } from 'react';
import './../../Styles/auction.css';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { AxiosError } from 'axios';
import ConfirmationModal from '../ConfirmationModal';

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
        end_date: string; // Add end_date to the auction prop
    };
    onDelete: (id: number) => void;
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction, onDelete }) => {
    const { id, title, current_price, images, description, city, end_date } = auction;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newOffer, setNewOffer] = useState<string>('');
    const navigate = useNavigate();
    const [currentPrice, setCurrentPrice] = useState<number>(current_price);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false); // State for confirmation dialog
    const location = useLocation();
    const [bidError, setBidError] = useState('');
    

    useEffect(() => {
        const endTime = new Date(end_date).getTime();
        
        // Declare interval before using it
        let interval: number;
    
        const updateRemainingTime = () => {
            const now = Date.now();
            const distance = endTime - now;
            setTimeLeft(distance);
    
            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft(0);
            }
        };
    
        // Calculate remaining time immediately
        updateRemainingTime();
    
        // Set the interval for further updates
        interval = setInterval(updateRemainingTime, 1000);
    
        return () => clearInterval(interval);
    }, [end_date]);
    

    const formatTimeLeft = (time: number) => {
        const seconds = Math.floor((time / 1000) % 60);
        const minutes = Math.floor((time / 1000 / 60) % 60);
        const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
        const days = Math.floor(time / (1000 * 60 * 60 * 24));
    
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };
    

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
        detail?: string;
        amount?: string[];
    }

    const handleNewBid = async () => {
        if (newOffer && Number(newOffer) > currentPrice) {
            try {
                const response = await api.post('/api/bids/', {
                    auction_item_id: id,
                    amount: newOffer,
                });
                setNewOffer('');
                setCurrentPrice(Number(newOffer)); // Update the current price
                console.log('New bid submitted:', response.data);
                setIsConfirmDialogOpen(false); // Close confirmation dialog after successful bid
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>; // Explicitly type the error
    
                if (axiosError.response) {
                    console.error('Error submitting bid:', axiosError.response.data);
                    const errorMessage = axiosError.response.data.amount?.[0]; // Access with correct type
                    if (errorMessage) {
                        alert(errorMessage);
                    } else {
                        alert('An error occurred. Please try again.');
                    }
                } else if (axiosError.request) {
                    console.error('No response from server:', axiosError.request);
                    alert('No response from server. Please try again later.');
                } else {
                    console.error('Error', axiosError.message);
                    alert('An error occurred while submitting your bid.');
                }
            }
        } else {
            alert('Unesite cenu vecu od trenutne!');
        }
    };
    

    const handleBidConfirmation = () => {
        handleNewBid();
        setIsConfirmDialogOpen(false); // Zatvori modal nakon potvrde
    };

    const openModal = () => {
        if (newOffer !== '' && Number(newOffer) > (Number(currentPrice) + 9)) {
            setIsConfirmDialogOpen(true);
            setBidError('');
        } else {
            setBidError(`Minimalna ponuda je ${Number(currentPrice) + 10} din`);
        }
    };
    

    return (
        <>
        <div className="auction-item">
            <span className="auction-city">🧭{city}</span>
            <h3 className='title'>{title}</h3>
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
            <div className="timer">
                {timeLeft > 0 ? '⌛ ' + formatTimeLeft(timeLeft) : 'Auction ended'}
            </div>
            <hr />
            <p className='current-price-par'>
                <b>Trenutna cena: {Number(currentPrice).toFixed(0)} Din.</b>
            </p>

            {location.pathname !== '/moje-aukcije' && (
                <div className='new-offer-container'>
                    <input
                        type='number'
                        name='new_offer'
                        id='new_offer'
                        value={newOffer}
                        onChange={(e) => setNewOffer(e.target.value)}
                        placeholder='Licitiraj ovde...'
                    />
                    <button
                        type='button'
                        className='new-offer-btn'
                        onClick={openModal} // Open confirmation dialog
                    >
                        Licitiraj
                    </button>
                </div>
            )}
            <span>{bidError}</span>
            {location.pathname === '/moje-aukcije' && (
                <button className="delete-btn" onClick={handleDelete}>Obriši aukciju</button>
            )}
            {/* Modal za potvrdu licitacije */}
            
        </div>
        <ConfirmationModal
        isOpen={isConfirmDialogOpen}
        onConfirm={handleBidConfirmation}
        onCancel={() => setIsConfirmDialogOpen(false)}
    />
    </>
    );
};

export default AuctionItem;
