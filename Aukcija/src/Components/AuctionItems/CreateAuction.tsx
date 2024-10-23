import { useState} from "react";
import api from "../../api";
import './../../Styles/createAuction.css'
import Cookies from "js-cookie";
import axios from "axios";

function CreateAuction(){
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [currentPrice, setCurrentPrice] = useState(0);

    

    const createAuctionItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const response = await api.post("/api/auctionItems/", {
                title,   // Osigurajte da ovo zamenite stvarnim naslovom
                description, // Osigurajte da ovo zamenite stvarnim sadržajem
            });
            

            if (response.status === 201) {
                alert("Auction item created!");
            } else {
                alert("Failed to make the auction item");
            }
        } catch (err) {
            // Proveravamo da li je greška Axios greška
            if (axios.isAxiosError(err)) {
                const errorMessage = err.response?.data?.detail || 'An unknown error occurred';
                const statusCode = err.response?.status;
                
                // Prikazujemo detaljnu poruku greške
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
                    onChange={(e) => setDescription(e.target.value)}>
                </textarea>
                <label htmlFor="currentPrice">Početna cena:</label>
                <input
                    type="text"
                    id="currentPrice"
                    name="currentPrice"
                    required
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(Number(e.target.value))}
                />
                <input 
                    type="submit"
                    value="Submit">
                </input>
            </form>
        </div>
    );
}

export default CreateAuction;