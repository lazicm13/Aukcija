import { useState, useEffect } from "react";
import api from "../../api";
import './../../Styles/createAuction.css';
import axios from "axios";
import { useNavigate } from "react-router-dom";

function CreateAuction() {
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [current_price, setCurrentPrice] = useState<string>('');
    const [images, setImages] = useState<File[]>([]);
    const [auctionDuration, setAuctionDuration] = useState<number>(4);
    const [city, setCity] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/current_user_data');
                setPhoneNumber(response.data.phone_number);
                setCity(response.data.city);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const createAuctionItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Reset errors before validation
        setErrors({});

        let isValid = true;

        // Basic validations
        const newErrors: { [key: string]: string } = {};

        if (!title.trim()) {
            newErrors.title = "Naslov je obavezan.";
            isValid = false;
        }

        if (!description.trim()) {
            newErrors.description = "Opis je obavezan.";
            isValid = false;
        }

        if (Number(current_price) <= 0) {
            newErrors.current_price = "Početna cena mora biti pozitivna.";
            isValid = false;
        }

        if (city === '') {
            newErrors.city = "Grad je obavezan.";
            isValid = false;
        }

        if (phoneNumber === '' || !/^\d{10}$/.test(phoneNumber)) {
            newErrors.phoneNumber = "Broj telefona nije validan. Mora imati 10 cifara.";
            isValid = false;
        }
        

        // Validate image count and size
        if (images.length === 0) {
            newErrors.images = "Morate odabrati barem jednu sliku.";
            isValid = false;
        }

        if (images.length > 6) {
            newErrors.images = "Maksimalno možete odabrati 6 slika.";
            isValid = false;
        }

        const fileSizeLimit = 5 * 1024 * 1024; // 5 MB
        for (const image of images) {
            if (image.size > fileSizeLimit) {
                newErrors.images = `${image.name} prelazi ograničenje veličine od 5 MB.`;
                isValid = false;
                break;
            }
        }

        setErrors(newErrors);

        if (!isValid) return;

        // Create auction item
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("current_price", Math.floor(Number(current_price)).toString());
        formData.append("auction_duration", auctionDuration.toString());
        formData.append("city", city);
        formData.append("phone_number", phoneNumber);

        try {
            const response = await api.post("/api/auctionItems/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                try {
                    const auctionItemId = response.data.id;

                    const imageFormData = new FormData();
                    images.forEach((image) => {
                        imageFormData.append('image', image);
                    });

                    const imageResponse = await api.post(`/api/auction-items/${auctionItemId}/images/`, imageFormData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    if (imageResponse.status === 201) {
                        alert("Aukcija i slike uspešno kreirani!");
                        setTitle("");
                        setDescription("");
                        setCurrentPrice('');
                        setImages([]);
                        navigate('/');
                    } else {
                        alert("Neuspešno učitavanje slika.");
                    }
                } catch (err) {
                    console.error("Greška pri dodavanju slika:", err);
                    alert("Greška pri dodavanju slika.");
                }
            } else {
                alert("Neuspešno kreiranje aukcije.");
            }
        } catch (err) {
            console.error("Greška pri kreiranju aukcije:", err);
            alert("Greška pri kreiranju aukcije.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const { value } = e.target;
        
        // Remove the error for the specific field when the user changes the value
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));

        if (field === 'title') setTitle(value);
        if (field === 'current_price') setCurrentPrice(value);
        if (field === 'city') setCity(value);
        if (field === 'phoneNumber') setPhoneNumber(value);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = e.target;
        setErrors((prevErrors) => ({ ...prevErrors, description: "" }));
        setDescription(value);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        
        if (selectedFiles.length + images.length > 6) {
            alert("Možete odabrati maksimalno 6 slika.");
            return;
        }

        const fileSizeLimit = 5 * 1024 * 1024; // 5 MB limit
        for (const file of selectedFiles) {
            if (file.size > fileSizeLimit) {
                alert(`${file.name} prelazi veličinu ograničenja od 5 MB.`);
                return;
            }
        }
        setImages(prevImages => [...prevImages, ...selectedFiles]);
        e.target.value = ''; // Reset input to allow same file to be selected again
    };

    const removeImage = (index: number) => {
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
    };

    return (
        <div className="formContainer">
            <form onSubmit={createAuctionItem} style={{ display: 'flex' }}>
                <div className="formLeft">
                    <div className="title-container">
                        <label htmlFor="title">Naslov:</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            onChange={(e) => handleInputChange(e, 'title')}
                            value={title}
                            maxLength={50}
                            className="naslov"
                        />
                        {errors.title && <p className="error-message">{errors.title}</p>}
                    </div>
                    <div className="price-duration-container">
                        <div className="price-input-container">
                            <label htmlFor="current_price">Početna cena:</label>
                            <input
                                type="number"
                                id="current_price"
                                name="current_price"
                                value={current_price}
                                onChange={(e) => handleInputChange(e, 'current_price')}
                            />
                            <span id="din-span">Din.</span>
                            {errors.current_price && <p className="error-message">{errors.current_price}</p>}
                        </div>

                        <div className="auction-duration">
                            <label htmlFor="auction_duration">Trajanje aukcije</label>
                            <select
                                className="duration"
                                id="auction_duration"
                                value={auctionDuration}
                                onChange={(e) => setAuctionDuration(Number(e.target.value))}
                            >
                                <option value={4}>4 dana</option>
                                <option value={3}>3 dana</option>
                                <option value={2}>2 dana</option>
                                <option value={1}>1 dan</option>
                            </select>
                        </div>
                    </div>
                    <hr />
                    <br />
                    <label htmlFor="description">Opis oglasa:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={description}
                        onChange={handleDescriptionChange}
                    />
                    {errors.description && <p className="error-message">{errors.description}</p>}
                </div>

                <div className="formRight">
                    <label htmlFor="images">Odaberi slike (maksimalno 6):</label>
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

                    <div className="contact-info">
                        <label htmlFor="city">Grad:</label>
                        <input
                            type="text"
                            id="city"
                            value={city || ''}
                            onChange={(e) => handleInputChange(e, 'city')}
                        />
                    </div>
                    {errors.city && <p className="error-message">{errors.city}</p>}
                    <div className="contact-info">
                        <label htmlFor="phone">Broj telefona:</label>
                        <input
                            type="text"
                            id="phone"
                            value={phoneNumber || ''}
                            onChange={(e) => handleInputChange(e, 'phoneNumber')}
                        />
                    </div>
                    {errors.phoneNumber && <p className="error-message">{errors.phoneNumber}</p>}

                    <input type="submit" value="Završi" />
                </div>
            </form>
        </div>
    );
}

export default CreateAuction;
