import React from 'react';
import './../../Styles/auction.css';
import { useLocation } from 'react-router-dom';

interface AuctionItemProps {
    auction: {
        id: number;
        title: string;
        description: string;
        current_price: number;
        //endDate: string; // You can use the Date type here, but it's a string for simplicity
        //Image
    };
    onDelete: (id: number) => void; // Add the delete function type
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction, onDelete }) => {
    const { id, title, description, current_price } = auction;
    const location = useLocation();

    const handleDelete = () => {
        onDelete(id); // Call the delete function with the auction id
    };

    return (
        <div className="auction-item">
            {/* <img src={imageUrl} alt={title} className="auction-image" /> */}
            <h3>{title}</h3>
            <img src='./src/assets/auctionItem.png' alt={title} />
            <p><b>Trenutna cena: {current_price} RSD</b></p>
            {/* <p><b>Opis predmeta:</b> {description}</p> */}
            {/* <p>Do kraja: {new Date(endDate).toLocaleString()}</p> */}
            {location.pathname === '/moje-aukcije' && <button className="delete-btn" onClick={handleDelete}>Obriši aukciju</button>}
        </div>
    );
};

export default AuctionItem;
