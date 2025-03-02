import { useState, useEffect } from 'react';
import './../../Styles/auction.css';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api';
import { AxiosError } from 'axios';
import ConfirmationModal from '../Modals/ConfirmationModal';
import Confetti from 'react-confetti';
import InfoModal from '../Modals/infoModal';


interface AuctionItemProps {
    auction: {
        id: number;
        title: string;
        description: string;
        current_price: number;
        city: string;
        images: {
            id: number;
            image: string;
        }[];
        end_date: string; // Add end_date to the auction prop
        seller: number;
    };
    onDelete: (id: number) => void;
}

const AuctionItem: React.FC<AuctionItemProps> = ({ auction, onDelete }) => {
    const { id, title, current_price, images, description, city, end_date } = auction;
    const [currentSlide, setCurrentSlide] = useState(0);
    const [newOffer, setNewOffer] = useState<string>('');
    const navigate = useNavigate();
    const [currentPrice, setCurrentPrice] = useState<number>(current_price);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false); // State for confirmation dialog
    const location = useLocation();
    const [bidError, setBidError] = useState('');
    const [placeholder, setPlaceholder] = useState('Licitiraj ovde...');
    const [offerCount, setOfferCount] = useState<number>(0);
    const [isDeleteConfirmDialogOpen, setIsDeleteConfirmDialogOpen] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isConfettiVisible, setIsConfettiVisible] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState('');
    
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
        const fetchOfferCount = async () => {
            try {
                const response = await api.get(`/api/auctions/${id}/offer_count`); // Pretpostavljeni API endpoint
                setOfferCount(response.data.bid_count); // Postavljanje broja ponuda
            } catch (error) {
                console.error('Error fetching offer count:', error);
            }
        };

        fetchOfferCount();
    }, [id]);

    const handleFocus = () => {       
        setPlaceholder('');
    };

    const handleBlur = () => {
        if (newOffer === '') {
            setPlaceholder('Licitiraj ovde...');
        }
    };

    // const handleAuctionEnded = () => {
    //     api.get(`/api/auctions/${id}/winner`).then((response) => {
    //         const winner = response.data;

    //         if(offerCount > 0){
    //             setSuccessMessage(`Aukcija je završena! Pobednik je ${winner.first_name} sa ponudom od ${winner.amount} RSD.`);
    //             setWinner(winner.first_name);
    //             setWinnerPrice(winner.amount);
    //             // handleFinishAuction(winner.id);
    //         }
    //         else{
    //             setSuccessMessage('Vaša aukcija nažalost nije prodata! Možete je postaviti ponovo!');
    //             // handleEndAuction();
    //         }
    //     }).catch((error) => {
    //         console.error('Error fetching winner:', error);
    //     });

        
    // };

    // const handleFinishAuction = (winnerId: number) => {
    //     try{
    //         const response = api.post(`/api/finish-auction/`, {
    //             auction_id: id,
    //             winnerId: winnerId,
    //             amount: winnerPrice,
    //         });
    //         console.log(response);
    //     }catch(error){
    //         console.error(error);
    //     }
    // }

    // const handleEndAuction = () => {
    //     try{
    //         const response = api.post(`/api/end-auction/${id}`);
    //         console.log(response);
    //     }catch(error){
    //         console.error(error);
    //     }
    // }

    useEffect(() => {
        const endTime = new Date(end_date).getTime(); // Ensure it's in UTC
    
        let interval: number;
    
        const updateRemainingTime = () => {
          const now = new Date().getTime(); // Local time
          const distance = endTime - now;
          setTimeLeft(distance);
    
          if (distance < 0) {
            clearInterval(interval);
            setTimeLeft(0);
            // handleAuctionEnded();
          }
        };
    
        updateRemainingTime();
    
        interval = setInterval(updateRemainingTime, 1000);
    
        return () => clearInterval(interval);
      }, [end_date]);
    
    
    
    const formatTimeLeft = (time: number) => {
        const seconds = Math.floor((time / 1000) % 60);
        const minutes = Math.floor((time / 1000 / 60) % 60);
        const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
        const days = Math.floor(time / (1000 * 60 * 60 * 24));
    
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    };
    

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleDelete = () => {
        setIsDeleteConfirmDialogOpen(true); // Open delete confirmation modal
    };

    const confirmDelete = () => {
        onDelete(id);
        setIsDeleteConfirmDialogOpen(false); // Close the modal after confirming deletion
    };

    const getFirstWords = (text: string, wordCount: number) => {
        return text.split(' ').slice(0, wordCount).join(' ') + (text.split(' ').length > wordCount ? '...' : '');
    };

    const handleOpenAd = () => {
        navigate(`/aukcija/${auction.id}`);
    };

    interface ErrorResponse {
        detail?: string;
        amount?: string[];
    }

    const handleNewBid = async () => {
        if (newOffer && Number(newOffer) > currentPrice) {
            try {
                const response = await api.post('/api/bids/', {
                    auction_item_id: id,
                    amount: newOffer,
                });
    
                // Handle successful bid submission
                setNewOffer(''); // Clear the input field
                setPlaceholder('Licitiraj ovde...')
                setCurrentPrice(Number(newOffer)); // Update the current price with the new bid
                console.log('New bid submitted:', response.data);
                setIsConfirmDialogOpen(false); // Close confirmation dialog
                setOfferCount(offerCount + 1)
    
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>; // Explicitly type the error
    
                // Handle 403 Unauthorized Error (user is not logged in)
                if (axiosError.response && axiosError.response.status === 403) {
                    navigate('/login'); // Redirect to login page
                    return; // Exit the function after redirection
                }
    
                // Handle API errors based on response
                if (axiosError.response) {
                    console.error('Error submitting bid:', axiosError.response.data);
                    const errorMessage = axiosError.response.data.amount?.[0]; // Access error message if present
                    if (errorMessage) {
                        alert(errorMessage); // Display the error message from the server
                    } else {
                        alert('An error occurred. Please try again.'); // Generic error message
                    }
                } else if (axiosError.request) {
                    console.error('No response from server:', axiosError.request);
                    alert('No response from the server. Please try again later.');
                } else {
                    console.error('Error', axiosError.message);
                    alert('An error occurred while submitting your bid.');
                }
            }
        } else {
            alert('Please enter a bid amount greater than the current price!');
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

    const openModal = () => {
        if (newOffer !== '' && Number(newOffer) > (Number(currentPrice) + 9)) {
            setIsConfirmDialogOpen(true);
            setBidError('');
        } else {
            setBidError(`Minimalna ponuda je ${Number(currentPrice) + 10} din`);
        }
    };
    
    const handleCancel = () => {
        setIsInfoModalOpen(false);
    }

    return (
        <>
        <div className="auction-item">
        {isConfettiVisible && <Confetti width={window.innerWidth} height={window.innerHeight} />} {/* Konfeti */}
            
            <span className="auction-city">🧭{city}</span>
            <h3 className='title'>{title}</h3>
            <button className="open-ad-btn" onClick={handleOpenAd}>Otvori oglas</button>
            <div className="slideshow-container">
                {images.map((image, index) => (
                    <div className={`slide ${index === currentSlide ? 'active' : ''}`} key={image.id}>
                        <img src={image.image} alt={title} style={{ width: '100%', height: 'auto' }} className='auction-img' />
                        <p className="slide-description">{getFirstWords(description, 10)}</p>
                    </div>
                ))}
                <a className="prev" onClick={prevSlide}>&#10094;</a>
                <a className="next" onClick={nextSlide}>&#10095;</a>
            </div>
            <div className="timer-bidding">
                <span title='broj ponuda' className="offer-count"> ponude: {offerCount} |     </span>
                {timeLeft > 0 ? formatTimeLeft(timeLeft) + '⌛ ': 'Završena aukcija'}
            </div>
            <hr />
            <p className='current-price-par'>
                <b>Trenutna cena: {new Intl.NumberFormat('sr-RS').format(Number(currentPrice))} RSD</b>
            </p>

            {((currentUser != auction.seller.toString()) && location.pathname !== '/moje-aukcije' && location.pathname !== '/admin/dashboard' && timeLeft > 0) && (
                <div className='new-offer-container'>
                    <input
                        type='number'
                        name='new_offer'
                        id='new_offer'
                        value={newOffer}
                        onChange={(e) => setNewOffer(e.target.value)}
                        placeholder={placeholder}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />
                    <button
                        type='button'
                        className='new-offer-btn'
                        onClick={openModal} // Open confirmation dialog
                    >
                        Licitiraj
                    </button>
                </div>
            )}
            <span>{bidError}</span>
            {((location.pathname === '/moje-aukcije' && offerCount === 0) || location.pathname === '/admin/dashboard') && (
                <button className="delete-btn" onClick={handleDelete}>Obriši aukciju</button>
            )}
            {/* Modal za potvrdu licitacije */}

            {timeLeft === 0 && <><b>{successMessage}</b></>}
            
        </div>
        <ConfirmationModal
            isOpen={isConfirmDialogOpen}
            onConfirm={handleBidConfirmation}
            onCancel={() => setIsConfirmDialogOpen(false)}
            title='Potvrdi licitaciju'
            message={`Da li ste sigurni da želite da licitirate ${newOffer} dinara za ovu aukciju?`}
        />
        <InfoModal
            isOpen={isInfoModalOpen}
            title='Čestitamo!'
            message={successMessage}
            onCancel={handleCancel}
        />

        {/* Confirmation modal for deleting the auction */}
        <ConfirmationModal
                isOpen={isDeleteConfirmDialogOpen}
                onConfirm={confirmDelete}
                onCancel={() => setIsDeleteConfirmDialogOpen(false)}
                title='Obriši aukciju'
                message="Da li ste sigurni da želite da obrišete ovu aukciju?"
            />
    </>
    );
};

export default AuctionItem;
