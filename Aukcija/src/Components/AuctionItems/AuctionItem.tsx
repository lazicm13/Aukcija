import React from 'react';
import './../../Styles/auction.css';

interface AuctionItemProps {
    auction: {
        id: number;
        title: string;
        description: string;
        currentPrice: number;
        //endDate: string; // Možeš koristiti Date tip, ali ovde je string radi jednostavnosti
        //Image
    };
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction }) => {
    const { title, description, currentPrice} = auction;

    return (
        <div className="auction-item">
            {/* <img src={imageUrl} alt={title} className="auction-image" /> */}
            <h3>{title}</h3>
            <img src='./src/assets/auctionItem.png'></img>
            <p><b>Trenutna cena: ${currentPrice.toFixed(2)}</b></p>
            <p>${description}</p>
            {/* <p>Do kraja: {new Date(endDate).toLocaleString()}</p> */}
            <button className="bid-button">Učestvuj</button>
        </div>
    );
};

export default AuctionItem;
