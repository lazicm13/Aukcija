
import AuctionItemsDisplay from "../Components/AuctionItems/AuctionItemsDisplay";
import { useEffect, useState } from "react";


function Home() {
    

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 3000); // Simulacija učitavanja
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <img src="/assets/logo1-1.png" alt="Loading..." className="loading-gif" />
            </div>
        );
    }

    return (
        <div>
            <AuctionItemsDisplay/>
        </div>
    );
}

export default Home;
