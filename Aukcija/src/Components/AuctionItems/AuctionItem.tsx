import React, { useState } from 'react';
import './../../Styles/auction.css';

interface AuctionItemProps {
    auction: {
        id: number;
        title: string;
        description: string;
        current_price: number;
        images: {
            id: number;
            image: string;
        }[];
    };
    onDelete: (id: number) => void;
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction, onDelete }) => {
    const { id, title, current_price, images, description} = auction;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [new_offer, setNewOffer] = useState<number>(NaN);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    };
    const handleDelete = () => {
        onDelete(id); // Call the delete function with the auction id
    };

    const getFirstWords = (text: string, wordCount: number) => {
        return text.split(' ').slice(0, wordCount).join(' ') + (text.split(' ').length > wordCount ? '...' : '');
    };

    return (
        <div className="auction-item">
            <h3>{title}</h3>
            <button className="open-ad-btn">Otvori oglas</button> {/* Dugme za otvaranje */}
            <div className="slideshow-container">
                {images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={title} style={{ width: '100%', height: 'auto' }} />
                        <p className="slide-description">{getFirstWords(description, 10)}</p> {/* Prikaz prvih 10 reči */}
                    </div>
                ))}
                <a className="prev" onClick={prevSlide}>&#10094;</a>
                <a className="next" onClick={nextSlide}>&#10095;</a>
            </div>
            <p className='current-price-par'><b>Trenutna cena: {current_price} RSD</b></p>
            <div className='new-offer-container'>
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
                <button type='submit' className='new-offer-btn'>Potvrdi</button>
            </div>
            {location.pathname === '/moje-aukcije' && <button className="delete-btn" onClick={handleDelete}>Obriši aukciju</button>}
        </div>
    );
};

export default AuctionItem;
