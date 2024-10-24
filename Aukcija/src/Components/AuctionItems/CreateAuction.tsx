import { useState } from "react";
import api from "../../api";
import './../../Styles/createAuction.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateAuction() {
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [current_price, setCurrentPrice] = useState<number>(0); // Postavljeno na number
    const navigate = useNavigate();

    const createAuctionItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        // Proveravamo da li je currentPrice validan broj
        if (current_price <= 0) { // Uveri se da je cena pozitivna
            alert("Please enter a valid positive integer price.");
            return;
        }
    
        try {
            console.log(current_price);
            const response = await api.post("/api/auctionItems/", {
                title,
                description,
                current_price: Math.floor(current_price), // Uveri se da šalješ kao ceo broj
            });
    
            if (response.status === 201) {
                alert("Auction item created!");
                // Očisti formu nakon uspešnog kreiranja
                setTitle("");
                setDescription("");
                setCurrentPrice(0); // Resetovanje vrednosti
                navigate('/');
            } else {
                alert("Failed to make the auction item");
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const errorMessage = err.response?.data?.detail || 'An unknown error occurred';
                const statusCode = err.response?.status;
    
                alert(`Error ${statusCode}: ${errorMessage}`);
            } else {
                alert('An unknown error occurred');
            }
        }
    };
    

    return (
        <div className="formContainer">
            <h2>NOVA AUKCIJA</h2>
            <form onSubmit={createAuctionItem}>
                <label htmlFor="title">Naslov:</label>
                <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                />
                <label htmlFor="description">Opis oglasa:</label>
                <textarea 
                    id="description"
                    name="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                />
                <label htmlFor="currentPrice">Početna cena:</label>
                <input
                    type="number"
                    id="current_price"
                    name="current_price"
                    required
                    value={current_price}
                    onChange={(e) => {
                        const value = e.target.value === "" ? NaN: Math.floor(Number(e.target.value)); // Uveri se da je ceo broj
                        setCurrentPrice(value);
                    }} // Update only if not empty
                />
                <input 
                    type="submit"
                    value="Završi"
                />
            </form>
        </div>
    );
}

export default CreateAuction;
