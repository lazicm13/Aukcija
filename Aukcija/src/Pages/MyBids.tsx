
import AuctionItemsDisplay from "../Components/AuctionItems/AuctionItemsDisplay";
import './../Styles/auctionList.css';

function MyBids() {

    return (
        <div className="my-bids-container">
            <h1 className="title-h1">Moje Licitacije</h1>
            <div className="auction-items"><AuctionItemsDisplay/></div>
        </div>
    );
}

export default MyBids;
