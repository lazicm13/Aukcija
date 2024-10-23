import { useState, useEffect } from "react";
import api from "../../api";
import AuctionItem from "../../Components/AuctionItems/AuctionItem";
import './../../Styles/auctionList.css'
// Define the interface for auction items here if not defined elsewhere
interface AuctionItem {
    id: number;
    title: string;
    description: string;
    currentPrice: number;
}
function AuctionItemsDisplay(){
    const [items, setItems] = useState<AuctionItem[]>([]); // Specify type

    useEffect(() => {
        getAuctionItems();
    }, []);

    const getAuctionItems = async () => {
        try {
            const response = await api.get("api/auctionItems/");
            const data: AuctionItem[] = response.data; // Specify type
            setItems(data);
            console.log(data);
        } catch (err) {
            alert(err);
        }
    };
    
    const deleteAuctionItem = async (id: number) => {
        try {
            const res = await api.delete(`api/auctionItems/delete/${id}/`);
            if (res.status === 204) {
                alert("Auction item deleted!");
                // Remove the deleted item from the state
                setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            } else {
                alert("Failed to delete auction item");
            }
        } catch (error) {
            alert(error);
        }
    };

    return(
        <div className="auction-list">
            {items.map((item) => (
                <AuctionItem 
                    auction={item} 
                    key={item.id} 
                />
            ))}
        </div>
    );
}

export default AuctionItemsDisplay;