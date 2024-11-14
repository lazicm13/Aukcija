import { useState, useEffect } from "react";
import api from "../api";
import AuctionItem from "../Components/AuctionItems/AuctionItem";
import AuctionItemsDisplay from "../Components/AuctionItems/AuctionItemsDisplay";


function Home() {
    

    

    return (
        <div>
            <AuctionItemsDisplay/>
        </div>
    );
}

export default Home;
