import AuctionItemsDisplay from "../Components/AuctionItems/AuctionItemsDisplay";
import './../Styles/auctionList.css';
import { useState, useEffect } from "react";
function MyAuctionsPage(){

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 2000); // Simulacija učitavanja
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <img src="/assets/logo1-1.png" alt="Loading..." className="loading-gif" />
            </div>
        );
    }
    
    return(
        <div className="auction-list-container">
            <h1 className="title-h1">Moje Aukcije</h1>
            <div className="auction-items"><AuctionItemsDisplay/></div>
        </div>
    );
}

export default MyAuctionsPage;