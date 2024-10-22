import { useState} from "react";
import api from "../../api";
import './../../Styles/createAuction.css'

function CreateAuction(){
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");

    const createAuctionItem = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        api.post("/api/auctionItems/", {content: String, title: String}).then((res) => {
            if(res.status === 201) alert("Auction item created!");
            else alert("Failed to make the auction item");
        })
        .catch((err: unknown) => alert(err));
    }
    
    return (
        <div className="formContainer">
            <h2>NOVA AUKCIJA</h2>
            <form onSubmit={createAuctionItem}>
                <label htmlFor="title">Naslov:</label>
                <br/>
                <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    onChange={(e) => setTitle(e.target.value)}
                    value={title}
                />
                <label htmlFor="description">Opis oglasa:</label>
                <br/>
                <textarea 
                    id="description"
                    name="description" 
                    required 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}>
                </textarea>
                <br/>
                <input 
                    type="submit"
                    value="Submit">
                </input>
            </form>
        </div>
    );
}

export default CreateAuction;