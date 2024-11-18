import { useState } from 'react';
import AuctionItemsDisplay from '../Components/AuctionItems/AuctionItemsDisplay';
import './../Styles/admin.css'
import api from '../api';

function AdminPage(){
    const [showAuctions, setShowAuctions] = useState(false);
    const [buttonText, setButtonText] = useState('Prikazi sve aukcije');
    const [showUser, setShowUser] = useState(false);
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isVerified, setIsVerified] = useState(true);
    const [city, setCity] = useState('');
    const [phone_number, setPhoneNumber] = useState('');
    const [isBlocked, setIsBlocked] = useState(false);
    
    const handleShowAuctions = () => {
        setShowAuctions(!showAuctions);
        setButtonText(showAuctions ? 'Prikazi sve aukcije' : 'Sakrij aukcije');
    }

    const handleFetchUserByUsername = async () => {
        try{
            const response = await api.get(`/api/fetchUser/${username}`);
            setFirstName(response.data.first_name);
            setIsVerified(response.data.is_verified);
            setCity(response.data.city);
            setPhoneNumber(response.data.phone_number);
            setIsBlocked(response.data.is_blocked);

            setShowUser(true);
        }catch(error)
        {
            console.error(error);
            alert("Korisnik nije pronađen ili je došlo do greške.");
        }
    }

    const handleBlockUser = async (username: string) => {
        try {
            const response = await api.post('/api/blockUser/', { username });
            if (response.status === 200) {
                alert('Korisnik je uspešno blokiran!');
                setIsBlocked(true);
            } else {
                alert('Došlo je do greške prilikom blokiranja korisnika.');
            }
        } catch (error) {
            console.error('Greška prilikom blokiranja korisnika:', error);
            alert('Greška prilikom blokiranja korisnika.');
        }
    };

    const handleUnblockUser = async (username: string) => {
        try{
            const response = await api.post('/api/unblockUser/', {username});
            if(response.status === 200){
                alert('Korisnik je uspesno odblokiran!');
                setIsBlocked(false);
            }else{
                alert('Doslo je do greske prilikom odblokiranja korisnika.');
            }
        }catch(error){
            console.error('Greska prilikom odblokiranja korisnika:', error);
            alert('Greska prilikom odblokiranja korisnika.');
        }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUsername(event.target.value);
    };

    return(
        <>
            <button className='all-auctions-button' onClick={handleShowAuctions}>{buttonText}</button>
            <div className='find-user-container'>
                <input 
                    className='find-user-input'
                    name='username'
                    onChange={handleInputChange}
                    value={username}
                    >
                </input>
                <button className='show-user-btn' onClick={handleFetchUserByUsername}>Prikazi korisnika</button>
            </div>
            { showAuctions && <AuctionItemsDisplay/>}

            {showUser && 
                <div className='show-user-container'>
                    <h1>{username}</h1>
                    <p>Ime i prezime: {firstName}</p>
                    <p>Grad: {city}</p>
                    <p>Broj telefona: {phone_number}</p>
                    {isVerified && <p>Korisnik je verifikovan</p>}
                    {!isVerified && <p>Korisnik nije verifikovan</p>}
                    {isBlocked && <p>Korisnik je vec blokiran</p>}
                    {!isBlocked && <button className='block-user-button' onClick={() => handleBlockUser(username)}>Blokiraj korisnika</button>}
                    {isBlocked && <button className='unblock-user-button' onClick={() => handleUnblockUser(username)}>Odblokiraj korisnika</button>}
                </div>}
        </>
    );
}

export default AdminPage;