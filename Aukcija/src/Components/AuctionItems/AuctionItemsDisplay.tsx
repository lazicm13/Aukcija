import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../api";
import AuctionItem from "../../Components/AuctionItems/AuctionItem";
import './../../Styles/auctionList.css';
import { AxiosError } from "axios";

interface AuctionItem {
    id: number;
    title: string;
    description: string;
    current_price: number;
    city: string;
    category: string;
    images: {
        id: number;
        image: string;
    }[];
    end_date: string;
    seller: number;
}

function AuctionItemsDisplay() {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOption, setSortOption] = useState("priceAsc");
    const [page, setPage] = useState(1); // Current page
    const pageLimit = 20; // Limit to 20 items per page
    const [category, setCategory] = useState('');
    const [auctions, setAuctions] = useState<AuctionItem[]>([]); // Type update here
    const [placeholder, setPlaceholder] = useState('Pretražite aukcije...');
    const [auctionCount, setAuctionCount] = useState(1);

    useEffect(() => {
        if (location.pathname === '/' || location.pathname === '/admin/dashboard') {
            getAuctionItems();
        } else if (location.pathname === '/moje-aukcije') {
            getMyAuctionItems();
        }else if(location.pathname === '/moje-licitacije'){
            getMyBiddings();
        }
        
    }, [location.pathname]); // Add location.pathname as dependency

    const getAuctionItems = async () => {
        try {
            const response = await api.get("api/all-auction-items/");
            setAuctions(response.data);
            setAuctionCount(response.data.length);
            console.log(auctionCount);
        } catch (err) {
            console.log(err);
        }
    };

    const getMyAuctionItems = async () => {
        try {
            const response = await api.get("api/auctionItems/");
            setAuctions(response.data);
            setAuctionCount(response.data.length);
        } catch (err) {
            console.log(err);
        }
    };

    const getMyBiddings = async () => {
        try{
            const response = await api.get("api/all-my-biddings/");
            setAuctions(response.data);
            setAuctionCount(response.data.length);
        }catch(err){
            console.log(err);
        }
    }

    

const deleteAuctionItem = async (id: number) => {
    try {
        const res = await api.delete(`api/auctionItems/delete/${id}/`);
        
        // Provera statusa odgovora
        if (res.status === 204) {
            alert("Auction item deleted!");
            setAuctions((prevItems) => prevItems.filter((item) => item.id !== id));
        } else {
            alert("Failed to delete auction item");
        }
    } catch (error) {
        // Provera tipa greške i dodela precizne poruke
        if (error instanceof AxiosError) {
            // Ako je greška vezana za Axios
            if (error.response) {
                // Ako server vraća odgovor sa statusom
                const statusCode = error.response.status;
                const errorMessage = error.response.data?.detail || "An unexpected error occurred";

                // Prikazivanje greške prema statusnom kodu
                switch (statusCode) {
                    case 400:
                        alert(`Bad Request: ${errorMessage}`);
                        break;
                    case 403:
                        alert(`Forbidden: ${errorMessage}`);
                        break;
                    case 404:
                        alert(`Not Found: ${errorMessage}`);
                        break;
                    case 500:
                        alert(`Server Error: ${errorMessage}`);
                        break;
                    default:
                        alert(`Unexpected Error: ${errorMessage}`);
                        break;
                }
            } else {
                // Ako nema odgovora (npr. mrežna greška)
                alert("Network error: Please check your internet connection.");
            }
        } else {
            // Ako greška nije vezana za Axios
            console.error('Error deleting item:', error);
            alert("Error deleting auction item. Please try again later.");
        }
    }
};


    const fetchAuctionsByCategory = async (selectedCategory: string) => {
        try {
            if(selectedCategory === 'all-auctions')
            {
                await getAuctionItems();
                return;
            }
            const response = await api.get(`/api/auctions?category=${selectedCategory}`);
            
            if (response.status === 200) {
                setAuctions(response.data);
                setAuctionCount(response.data.length);
            } else {
                console.error('Failed to fetch auctions:', response.status);
            }
        } catch (error) {
            console.error('Error fetching auctions:', error);
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedCategory = e.target.value;
        setCategory(selectedCategory);
        fetchAuctionsByCategory(selectedCategory); // Fetch auctions based on new category
    };

    // Filter and sort items
    const filteredAndSortedItems = (category ? auctions : auctions)
        .filter((item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOption === "priceAsc") return a.current_price - b.current_price;
            if (sortOption === "priceDesc") return b.current_price - a.current_price;
            if (sortOption === "endDateAsc") return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
            if (sortOption === "endDateDesc") return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
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

    const handleFocusChange = () => {
        setPlaceholder('');
    }

    const handleBlur = () => {
        setPlaceholder('Pretražite aukcije...');
    }

    return (
        <div className="auction-container">
            <div className="search-sort-container">
                
                <input
                    type="text"
                    placeholder={placeholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                    onFocus={handleFocusChange}
                    onBlur={handleBlur}
                />
                {location.pathname === '/' &&
                    <select 
                        id="product-category" 
                        value={category}
                        onChange={handleCategoryChange}
                    >
                        <option value="" disabled>Izaberite kategoriju</option>
                        <option value="all-auctions">Sve aukcije</option>
                        <option value="electronics">Elektronika</option>
                        <option value="appliances">Kućni aparati</option>
                        <option value="jewelry">Nakit i Satovi</option>
                        <option value="clothing">Odeća i Obuća</option>
                        <option value="toys">Igračke i Video igre</option>
                        <option value="furniture">Nameštaj</option>
                        <option value="sports">Sport i Oprema</option>
                        <option value="collectibles">Kolekcionarstvo i Antikviteti</option>
                        <option value="media">Knjige, Filmovi i Muzika</option>
                        <option value="tools">Alati i Oprema za rad</option>
                        <option value="vehicles">Automobili i Motocikli</option>
                        <option value="real-estate">Nekretnine</option>
                        <option value="food">Hrana i Piće</option>
                        <option value="other">Ostalo</option>
                    </select>
                }
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="sort-select"
                >
                    <option value="priceAsc">Sortiraj po ceni: Niže ka višim</option>
                    <option value="priceDesc">Sortiraj po ceni: Više ka nižim</option>
                    <option value="endDateAsc">Sortiraj po vremenu isteka: Prve ističu</option>
                    <option value="endDateDesc">Sortiraj po vremenu isteka: Poslednje ističu</option>
                </select>
            </div>
            <div className="auction-list">
                {auctionCount === 0 && <h1>Trenutno nema aukcija za izabranu kategoriju!</h1>}
                <div className="auction-list-inner">
                    {paginatedItems.map((item) => (
                        <AuctionItem
                            auction={item}
                            key={item.id}
                            onDelete={deleteAuctionItem}
                        />
                    ))}
                </div>
            </div>
            <div className="pagination-controls">
                <button onClick={handlePrevPage} disabled={page === 1}>
                    Prethodna
                </button>
                <span>Stranica {page}</span>
                <button onClick={handleNextPage} disabled={endIndex >= filteredAndSortedItems.length}>
                    Sledeća
                </button>
            </div>
        </div>
    );
}

export default AuctionItemsDisplay;
