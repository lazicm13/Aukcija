import AuctionItemsDisplay from "../Components/AuctionItems/AuctionItemsDisplay";
import './../Styles/auctionList.css';
function MyAuctionsPage(){
    return(
        <div className="auction-list-container">
            <h1 className="title-h1">Moje Aukcije</h1>
            <div className="auction-items"><AuctionItemsDisplay/></div>
        </div>
    );
}

export default MyAuctionsPage;