import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './../../Styles/auctionPage.css';
import api from '../../api';
import { AxiosError } from 'axios';
import Modal from 'react-modal';

interface AuctionImage {
    id: number;
    image: string;
}

interface Bid {
    amount: number;
    created_at: string;
    bidder: number;
}

interface Auction {
    id: number;
    title: string;
    description: string;
    current_price: number;
    city: string;
    phone_number: string;
    images: AuctionImage[];
    bids: Bid[];
}

const Auction: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newOffer, setNewOffer] = useState<number>(NaN);
    const [currentPrice, setCurrentPrice] = useState<number>(0); // Dodano stanje za trenutnu cenu
    const [bidCount, setBidCount] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bids, setBids] = useState<Bid[]>([]);
    const [auctionOwner, setAuctionOwner] = useState<string>('');
    const [usernames, setUsernames] = useState<string[]>([]);
    
    const fetchUsernames = async (userIds: number[]) => {
        try {
            const response = await api.post('/api/users/', { ids: userIds }); // Adjust the endpoint accordingly
            console.log("Fetched usernames response:", response.data);
            if (response.status === 200) {
                console.log(response.data);
                return response.data; // Assume the response is an array of usernames
            } else {
                console.error("Failed to fetch usernames!");
            }
        } catch (error) {
            console.error("Error fetching usernames: ", error);
        }
    };

    const fetchBids = async () => {
        try {
            const response = await api.get(`/api/bids/${id}/`); // Adjust the endpoint as necessary
            if (response.status === 200) {
                // Assuming response.data is an array of bids
                const bids: Bid[] = response.data; // Adjust this if your data structure is different
                setBidCount(bids.length); // Update the bid count
                setBids(bids); // Set the bids state

                const userIds = bids.map(bid => bid.bidder);
                const usernames = await fetchUsernames(userIds);
                setUsernames(usernames); // Store usernames in state
                return bids; // Return the bids if needed
            } else {
                console.error("Failed to fetch bids data");
            }
        } catch (error) {
            console.error("Error fetching bids data:", error);
        }
    };
    const fetchAuctionOwner = async (id: number) => {
        try{
            const response = await api.get(`api/user/username/${id}/`);
            
            if(response.status === 200){
                console.log('Username fetched successfully!');
                setAuctionOwner(response.data.username);
            }
            else{
                console.error("Failed to fetch username!");
            }
        }catch(error)
        {
            console.error("Error fetching username: ", error);
        }
    } 

    useEffect(() => {
        // Fetch auction data by ID
        const fetchAuction = async () => {
            try {
                const response = await api.get(`/api/auction/${id}/`);
                if (response.status === 200) {
                    setAuction(response.data);
                    setCurrentPrice(response.data.current_price); // Ažuriranje trenutne cene

                    await fetchBids();
                } else {
                    console.error("Failed to fetch auction data");
                }
            } catch (error) {
                console.error("Error fetching auction data:", error);
            }
        };

        fetchAuction();
        fetchAuctionOwner(Number(id));
    }, [id]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (auction && auction.images.length > 0) ? (prev + 1) % auction.images.length : 0);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (auction && auction.images.length > 0) ? (prev - 1 + auction.images.length) % auction.images.length : 0);
    };

    if (!auction) {
        return <div>Loading auction details...</div>;
    }

    interface ErrorResponse {
        detail?: string; // ili dodajte druge potrebne atribute
    }

    const handleNewBid = async () => {
        if (newOffer && newOffer > currentPrice) { // Koristi currentPrice umesto auction.current_price
            try {
                const response = await api.post('/api/bids/', {
                    auction_item_id: id,
                    amount: newOffer,
                });
                setNewOffer(0);
                setCurrentPrice(newOffer); // Ažuriraj trenutnu cenu ovde
                console.log('New bid submitted:', response.data);
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;

                if (axiosError.response) {
                    console.error('Error submitting bid:', axiosError.response.data);
                    alert(`Error: ${axiosError.response.data.detail || 'Something went wrong!'}`);
                } else if (axiosError.request) {
                    console.error('No response from server:', axiosError.request);
                    alert('No response from server. Please try again later.');
                } else {
                    console.error('Error', axiosError.message);
                    alert('An error occurred while submitting your bid.');
                }
            }
        } else {
            alert('Please enter a valid offer greater than the current price.');
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    // Function to handle closing the modal
    const closeModal = () => {
        setIsModalOpen(false);
    };

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return date.toLocaleString(); // Adjust locale and options as needed
    };

    return (
        <div className="auction-details">
            
            <p className='auction-city'>🧭 {auction.city}</p>
            <h2>{auction.title}</h2>
            <div className="slideshow-container-large">
                {auction.images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={auction.title} className="large-image" />
                    </div>
                ))}
                <a className="prev1" onClick={prevSlide}>&#10094;</a>
                <a className="next1" onClick={nextSlide}>&#10095;</a>
            </div>
            <hr />
            <p className="full-description">{auction.description}</p>
            <div>
                <a onClick={openModal} style={{ cursor: 'pointer' }}><u>Broj ponuda: {bidCount}</u></a>
                <p className='phone-number'>
                    Broj telefona: <a href={`tel:${auction.phone_number}`}><b>{auction.phone_number}</b></a>
                </p>
                <p className='auction-owner'>Prodavac: {auctionOwner}</p>
            </div>

            <hr />
            <p className='current-price'>
                <b>Trenutna cena: {Number(currentPrice).toFixed(0)} Dinara</b> {/* Prikazuje ažuriranu trenutnu cenu */}
            </p>
            
            <Modal isOpen={isModalOpen} onRequestClose={closeModal} className="ReactModel_Content" overlayClassName="ReactModal__Overlay">
            <button className="close-button" onClick={closeModal}>&times;</button>
                <h2>Ponude za {auction.title}</h2>
                <ul>
                    {bids.map((bid, index) => (
                        <li key={index}>
                            <b>{usernames[index] || 'Unknown User'}</b>: {Number(bid.amount).toFixed(0)} Din. | {formatDateTime(bid.created_at)}
                        </li>
                    ))}
                </ul>
                <button onClick={closeModal}>Close</button>
            </Modal>

            <div className="new-bid-container">
                <input
                    type="number"
                    name="new_offer"
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value ? Math.floor(Number(e.target.value)) : NaN)}
                    placeholder="Unesite novu ponudu..."
                />
                <button className="new-bid-btn" onClick={handleNewBid}>Potvrdi</button> {/* Dodato onClick */}
            </div>
        </div>
    );
};

export default Auction;
