import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './../../Styles/auctionPage.css';
import api from '../../api';
import { AxiosError } from 'axios';
import Modal from 'react-modal';
import ConfirmationModal from '../Modals/ConfirmationModal'; // Import your modal component
import CommentSection from './CommentSection';
// import ReportModal from '../Modals/ReportModal';
import Confetti from 'react-confetti';
import InfoModal from '../Modals/infoModal';

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
    seller: number;
}

const Auction: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newOffer, setNewOffer] = useState<string>('');
    const [currentPrice, setCurrentPrice] = useState<number>(0); // Dodano stanje za trenutnu cenu
    const [bidCount, setBidCount] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bids, setBids] = useState<Bid[]>([]);
    const [seller, setSeller] = useState(0);
    const [auctionOwner, setAuctionOwner] = useState<string>('');
    const [usernames, setUsernames] = useState<string[]>([]);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [bidError, setBidError] = useState('');
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
    // const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    const [placeholder, setPlaceholder] = useState('Unesite novu ponudu...');
    const [successMessage, setSuccessMessage] = useState('');
    const [isConfettiVisible, setIsConfettiVisible] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [auctionOwnerId, setAuctionOwnerId] = useState();
    const [currentUser, setCurrentUser] = useState('');
    
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
                setAuctionOwner(response.data.first_name);
                setAuctionOwnerId(response.data.id);
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
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/current_user_data');
                setCurrentUser(response.data.id);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setCurrentUser('');
            }
        };
  
        fetchUserData();
    }, []);

    useEffect(() => {
        // Fetch auction data by ID
        const fetchAuction = async () => {
            try {
                const response = await api.get(`/api/auction/${id}/`);
                if (response.status === 200) {
                    setAuction(response.data);
                    setCurrentPrice(response.data.current_price); // Ažuriranje trenutne cene
                    setSeller(response.data.seller);

                    if (response.data.end_date) {
                        setEndDate(new Date(response.data.end_date)); // Set end date
                        console.log('Datum:' + response.data.end_date);
                    }
                    else
                        console.log('nisam ni dobio vrednost datuma');
                    

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

    useEffect(() => {
        let countdownInterval: number;
    
        const updateCountdown = () => {
            if (endDate) {
                const now = new Date();
                const timeRemaining = endDate.getTime() - now.getTime();
    
                if (timeRemaining <= 0) {
                    setTimeLeft(0); // Aukcija je završena
                    clearInterval(countdownInterval);
                } else {
                    setTimeLeft(timeRemaining); // Postavi preostalo vreme u milisekundama
                }
            }
        };
    
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    
        return () => clearInterval(countdownInterval);
    }, [endDate]);

    const formattedTimeLeft = () => {
        if (timeLeft === null || timeLeft <= 0) {
            return "Aukcija je završena";
        }
    
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
        if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };
    
    
        // Pozivamo funkciju odmah da bismo izbegli čekanje
    // const openReportModal = () => {
    //     setIsReportModalOpen(true);
    // }

    // const closeReportModal = () => {
    //     setIsReportModalOpen(false);
    // };

    


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
        amount?: string[];
    }

    // const handleReportConfirmation = async (reportText: string) => {
    //     try {
    //         const response = await api.post('/api/report-auction/', { id: auction.id, reportText }, {
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             }
    //         });
    
    //         setIsReportModalOpen(false);
    //         console.log(response.data);
    //     } catch (error) {
    //         console.error("Error reporting auction:", error);
    //     }
    // };
    

    const handleNewBid = async () => {
        if (newOffer && Number(newOffer) > currentPrice) {
            try {   
                const response = await api.post('/api/bids/', {
                    auction_item_id: id,
                    amount: newOffer,
                });
                setNewOffer('');
                setCurrentPrice(Number(newOffer)); // Update the current price
                console.log('New bid submitted:', response.data);
                setIsConfirmDialogOpen(false);
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;
    
                if (axiosError.response) {
                    console.error('Error submitting bid:', axiosError.response.data);
                    const errorMessage = axiosError.response.data.amount?.[0];
                    if (errorMessage) {
                        alert(errorMessage); // Display the specific error message in an alert
                    } else {
                        alert('An error occurred. Please try again.');
                    }
                } else if (axiosError.request) {
                    console.error('No response from server:', axiosError.request);
                    alert('No response from server. Please try again later.');
                } else {
                    console.error('Error', axiosError.message);
                    alert('An error occurred while submitting your bid.');
                }
            }
        } else {
            alert('Please enter a valid bid amount greater than the current price.');
        }
    };
    
    const handleBidConfirmation = () => {
        handleNewBid();
        setIsConfirmDialogOpen(false); // Zatvori modal nakon potvrde
        setIsConfettiVisible(true); // Pokretanje konfeta animacije
        setIsInfoModalOpen(true);
        setSuccessMessage('Uspesna licitacija!')
        
        setTimeout(() => {
            setIsConfettiVisible(false); // Sakrij konfete nakon 5 sekundi
            setIsInfoModalOpen(false);
        }, 4000); // Konfete će trajati 5 sekundi
    };

    const openConfirmationModal = () => {
        if(newOffer !== '' && Number(newOffer) > (Number(currentPrice) + 9)){
            setIsConfirmDialogOpen(true)
            setBidError('');
        }
        else{
            let cena = Number(currentPrice) + 10;
            setBidError(`Minimalna ponuda je ${cena} din`);
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

    const handleFocus = () => {
        setPlaceholder('');
    }

    const handleBlur = () => {
        setPlaceholder('Unesite novu ponudu...')
    }
    
    const handleCancel = () => {
        setIsInfoModalOpen(false);
    }

    return (
        <>
            {isConfettiVisible && <Confetti width={window.innerWidth} height={window.innerHeight} />} {/* Konfeti */}
        <div className="auction-details">
            <div className="auction-header">
                {/* <button className="report-auction-btn" onClick={openReportModal}>Prijavi aukciju</button> */}
                <p className="auction-city">🧭 {auction.city}</p>
                <h2>{auction.title}</h2>
            </div>
    
            <div className="slideshow-container-large">
                {auction.images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={auction.title} className="large-image" />
                    </div>
                ))}
                <a className="prev1" onClick={prevSlide}>&#10094;</a>
                <a className="next1" onClick={nextSlide}>&#10095;</a>
            </div>
            {timeLeft && timeLeft > 0 && currentUser !== auctionOwnerId && (
                <div className="bid-section">
                    <div className="new-bid-container">
                        <input
                            type="number"
                            name="new_offer"
                            value={newOffer}
                            onChange={(e) => setNewOffer(e.target.value)}
                            placeholder={placeholder}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                        />
                        <button className="new-bid-btn" onClick={openConfirmationModal}>Potvrdi</button>
                    </div>
                    <span className="bid-error">{bidError}</span>
                </div>
            )}
                <p className="current-price">
                    <b>Trenutna cena: {new Intl.NumberFormat('sr-RS').format(Number(currentPrice))} RSD</b>
                </p>
            <Modal isOpen={isModalOpen} onRequestClose={closeModal} className="ReactModal_Content" overlayClassName="ReactModal__Overlay">
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
    
            

                <div className="countdown-container">
                    <p className="countdown-timer">Završava se za: {formattedTimeLeft()}</p>
                </div>
            <a onClick={openModal} className="bid-history-link">Broj ponuda: {bidCount}</a>
    
            
    
            <hr />
            <h3><u>Opis</u></h3>
            <p className="full-description">{auction.description}</p>
            <ConfirmationModal
                isOpen={isConfirmDialogOpen}
                onConfirm={handleBidConfirmation}
                onCancel={() => setIsConfirmDialogOpen(false)}
                title='Potvrda licitacije'
                message={`Da li ste sigurni da želite da licitirate ${newOffer} dinara za ovu aukciju?`}
            />
           
    
            <div className="contact-info">
                <p className='phone-number'>
                    Broj telefona: <a href={`tel:${auction.phone_number}`}><b>{auction.phone_number}</b></a>
                </p>
                <p className='auction-owner'>Prodavac: <a><b>{auctionOwner}</b></a></p>
            </div>
            {/* <ReportModal
                isOpen={isReportModalOpen}
                onConfirm={handleReportConfirmation}  // Pass the function reference here
                onCancel={closeReportModal}
                title="Prijavi aukciju"
                message="Unesite razlog za prijavu ove aukcije."
            /> */}

            <InfoModal
                isOpen={isInfoModalOpen}
                title='Čestitamo!'
                message={successMessage}
                onCancel={handleCancel}
            />
            
            
            <CommentSection auctionItemId={auction.id} ownerId={seller}/>
        </div>
        </>
    );
    
};

export default Auction;
