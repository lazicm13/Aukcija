import { useState, useEffect } from "react";
import api from "../../api";
import AuctionItem from "../../Components/AuctionItems/AuctionItem";
import './../../Styles/auctionList.css';

interface AuctionItem {
    id: number;
    title: string;
    description: string;
    current_price: number;
    images: {
        id: number;
        image: string;
    }[]; 
}

function AuctionItemsDisplay() {
    const [items, setItems] = useState<AuctionItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("priceAsc");
    const [page, setPage] = useState(1); // Current page
    const pageLimit = 20; // Limit to 20 items per page

    useEffect(() => {
        if(location.pathname === '/')
            getAuctionItems();
        else if(location.pathname === '/moje-aukcije')
            getMyAuctionItems();
    }, []);

    const getAuctionItems = async () => {
        try {
            const response = await api.get("api/all-auction-items/");
            const data: AuctionItem[] = response.data;
            setItems(data);
        } catch (err) {
            alert(err);
        }
    };
    const getMyAuctionItems = async () => {
        try {
            const response = await api.get("api/auctionItems/");
            const data: AuctionItem[] = response.data;
            setItems(data);
        } catch (err) {
            alert(err);
        }
    };

    const deleteAuctionItem = async (id: number) => {
        try {
            const res = await api.delete(`api/auctionItems/delete/${id}/`);
            if (res.status === 204) {
                alert("Auction item deleted!");
                setItems((prevItems) => prevItems.filter((item) => item.id !== id));
            } else {
                alert("Failed to delete auction item");
            }
        } catch (error) {
            alert(error);
        }
    };

    // Filter and sort items
    const filteredAndSortedItems = items
        .filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOption === "priceAsc") return a.current_price - b.current_price;
            if (sortOption === "priceDesc") return b.current_price - a.current_price;
            return 0;
        });

    // Pagination logic
    const startIndex = (page - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

    const handleNextPage = () => {
        if (endIndex < filteredAndSortedItems.length) setPage(page + 1);
    };

    const handlePrevPage = () => {
        if (page > 1) setPage(page - 1);
    };

    return (
        <div className="auction-container">
            <div className="search-sort-container">
                <input
                    type="text"
                    placeholder="Pretraži aukcije..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="sort-select"
                >
                    <option value="priceAsc">Sortiraj po ceni: Niže ka višim</option>
                    <option value="priceDesc">Sortiraj po ceni: Više ka nižim</option>
                </select>
            </div>
            <div className="auction-list">
                {paginatedItems.map((item) => (
                    <AuctionItem
                        auction={item}
                        key={item.id}
                        onDelete={deleteAuctionItem}
                    />
                ))}
            </div>
            <div className="pagination-controls">
                <button onClick={handlePrevPage} disabled={page === 1}>
                    Prethodna
                </button>
                <span>Page {page}</span>
                <button onClick={handleNextPage} disabled={endIndex >= filteredAndSortedItems.length}>
                    Sledeća
                </button>
            </div>
        </div>
    );
}

export default AuctionItemsDisplay;
