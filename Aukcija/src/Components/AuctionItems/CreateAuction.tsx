import { useState } from "react";
import api from "../../api";
import './../../Styles/createAuction.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateAuction() {
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [current_price, setCurrentPrice] = useState<number>(NaN);
    const [images, setImages] = useState<File[]>([]);
    const [auctionDuration, setAuctionDuration] = useState<number>(1);
    const [city, setCity] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const navigate = useNavigate();

    const createAuctionItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        if (current_price <= 0) { 
            alert("Please enter a valid positive integer price.");
            return;
        }
    
        if (images.length > 5) { // Maksimalno 5 slika
            alert("You can upload a maximum of 5 images.");
            return;
        }
    
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("current_price", Math.floor(current_price).toString());
        formData.append("auction_duration", auctionDuration.toString());
        formData.append("city", city);
        formData.append("phone_number", phoneNumber);
    
        try {
            // Step 1: Create the auction item
            const response = await api.post("/api/auctionItems/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
    
            if (response.status === 201) {
                try {
                    const auctionItemId = response.data.id;
                    // Step 2: Prepare to upload images
                    const imageFormData = new FormData();
                    images.forEach((image) => {
                        imageFormData.append('image', image);  // Append each image to FormData
                    });
                    console.log("ImageFormData:", [...images.entries()]);
                
                    // Step 3: Upload images to the newly created auction item
                    const imageResponse = await api.post(`/api/auction-items/${auctionItemId}/images/`, imageFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                
                    if (imageResponse.status === 201) {
                        alert("Auction item and images created successfully!");
                        // Reset form fields
                        setTitle("");
                        setDescription("");
                        setCurrentPrice(NaN);
                        setImages([]); // Reset images
                        navigate('/');
                    } else {
                        alert("Failed to upload images");
                    }
                } catch (err) {
                    if (axios.isAxiosError(err)) {
                        const errorMessage = err.response?.data || 'An unknown error occurred';
                        console.error("Error response:", errorMessage);
                        alert(`Error: ${JSON.stringify(errorMessage)}`);
                    } else {
                        alert('An unknown error occurred');
                    }
                }
            } else {
                alert("Failed to create the auction item");
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
    

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        
        // Check if the total number of images exceeds the limit
        if (selectedFiles.length + images.length > 5) {
            alert("You can upload a maximum of 5 images.");
            return;
        }
    
        // Optionally, check file size here
        const fileSizeLimit = 5 * 1024 * 1024; // 5 MB example limit
        for (const file of selectedFiles) {
            if (file.size > fileSizeLimit) {
                alert(`${file.name} exceeds the size limit of 5 MB.`);
                return;
            }
        }
        setImages(prevImages => [...prevImages, ...selectedFiles]);
    
        // Clear the input (optional)
        e.target.value = ''; // This allows the same file to be selected again if needed
    };
    

    const removeImage = (index: number) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index)); // Uklanja sliku sa odabranog indeksa
    };

    return (
        <>
        <div className="formContainer">
            <form onSubmit={createAuctionItem} style={{ display: 'flex' }}>
                <div className="formLeft">
                    <label htmlFor="title">Naslov:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        onChange={(e) => setTitle(e.target.value)}
                        value={title}
                    />
                    <br></br>
                    <br></br>
                    <label htmlFor="current_price">Početna cena:</label>
                    <input
                        type="number"
                        id="current_price"
                        name="current_price"
                        required
                        value={current_price}
                        onChange={(e) => {
                            const value = e.target.value === "" ? NaN : Math.floor(Number(e.target.value));
                            setCurrentPrice(value);
                        }}
                    />
                    <br></br>
                    <br></br>
                    <label htmlFor="description">Opis oglasa:</label>
                    <textarea 
                        id="description"
                        name="description" 
                        required 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <div className="auction-duration">
                        <label htmlFor="auction_duration">Trajanje aukcije (dani):</label>
                        <select
                            className="duration"
                            id="auction_duration"
                            value={auctionDuration}
                            onChange={(e) => setAuctionDuration(Number(e.target.value))}>
                            <option value={1}>1 dan</option>
                            <option value={2}>2 dana</option>
                            <option value={3}>3 dana</option>
                            <option value={4}>4 dana</option>
                        </select>
                    </div>
                </div>
    
                <div className="formRight">
                    
                    <label htmlFor="images">Odaberi slike (maksimalno 5):</label>
                    <input
                        type="file"
                        id="images"
                        name="images"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: "none" }}
                    />
                    <div className="custom-file-upload">
                        <button type="button" onClick={() => document.getElementById("images")?.click()}>Odaberi fajl</button>
                        <span>{images.length > 0 ? `${images.length} odabranih fajlova` : "Nijedan fajl nije odabran"}</span>
                    </div>
                    <div className="selected-images">
                        {images.map((image, index) => (
                            <div key={index} className="image-preview">
                                <img src={URL.createObjectURL(image)} alt={`Selected ${index}`} />
                                <button type="button" className="remove-image" onClick={() => removeImage(index)}>X</button>
                            </div>
                        ))}
                    </div>
                    

                    {/* Dodaj div za grad i broj telefona */}
                    <div className="contact-info">
                        <label htmlFor="city">Grad:</label>
                        <input
                            type="text"
                            id="city"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                        </div>
                        <div className="contact-info">
                        <label htmlFor="phone">Broj telefona:</label>
                        <input
                            type="text"
                            id="phone"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                    </div>

                    <input 
                        type="submit"
                        value="Završi"
                    />
                </div>
            </form>
        </div>
        </>
    );
    
}

export default CreateAuction;
