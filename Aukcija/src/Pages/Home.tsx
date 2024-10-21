import { useState, useEffect } from "react";
import api from "../api";
import AuctionItem from "../Components/AuctionItems/AuctionItem";

function Home(){
    const [items, setItems] = useState([]);

    useEffect(() => {
        getAuctionItems();
    }, []);

    const getAuctionItems = () => {
        api.get("api/auctionItems/")
        .then((res) => res.data)
        .then((data) => {setItems(data); console.log(data)})
        .catch((err) => alert((err)));
    };

    const deleteAuctionItem = (id: number) => {
        api.delete(`api/auctionItems/delete/${id}/`).then((res) => {
            if(res.status === 204) alert("Auction item deleted!")
            else alert("Failed to delete auction item");
            getAuctionItems(); // IZMENITI DA SE OBRISE PREKO JAVASCRIPTA!!!!
        }).catch((error) => alert(error));
    }                                                                       

    

    return (
        <div>
            <h2>Aktivne aukcije</h2>
        </div>
    );
}

export default Home;