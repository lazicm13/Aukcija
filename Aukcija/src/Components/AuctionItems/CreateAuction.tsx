import { useState, useEffect } from "react";
import api from "../../api";
import './../../Styles/createAuction.css';
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import InfoModal from '../Modals/infoModal';

function CreateAuction() {
    const [description, setDescription] = useState("");
    const [title, setTitle] = useState("");
    const [current_price, setCurrentPrice] = useState<string>('');
    const [images, setImages] = useState<File[]>([]);
    const [auctionDuration, setAuctionDuration] = useState<number>(4);
    const [city, setCity] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [category, setCategory] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const navigate = useNavigate();
    const [successMessage] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/current_user_data/');
                setPhoneNumber(response.data.phone_number);
                setCity(response.data.city);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);


    // interface ApiResponse {
    //     id: number;
    // }

    interface ApiErrorResponse {
        message: string;
        // Dodajte ostale relevantne informacije koje očekujete od servera
    }

    const createAuctionItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setErrors({});
        let isValid = true;
        const newErrors: { [key: string]: string } = {};

        if (!title.trim()) {
            newErrors.title = "Naslov je obavezan.";
            isValid = false;
        }

        if (!description.trim()) {
            newErrors.description = "Opis je obavezan.";
            isValid = false;
        }

        if (Number(current_price) < 100) {
            newErrors.current_price = "Minimalna cena je 100 dinara.";
            isValid = false;
        }

        if (city === '') {
            newErrors.city = "Grad je obavezan.";
            isValid = false;
        }

        if (phoneNumber === '' || !/^0\d{8,}$/.test(phoneNumber)) {
            newErrors.phoneNumber = "Broj telefona nije validan. Mora počinjati sa 0 i imati najmanje 9 cifara.";
            isValid = false;
        }
        if (!category) {
            newErrors.category = "Kategorija je obavezna.";
            isValid = false;
        }

        // if (images.length === 0) {
        //     newErrors.images = "Morate odabrati barem jednu sliku.";
        //     isValid = false;
        // }

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

        setLoading(true);

        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("current_price", Math.floor(Number(current_price)).toString());
        formData.append("auction_duration", auctionDuration.toString());
        formData.append("city", city);
        formData.append("phone_number", phoneNumber);
        formData.append("category", category);
        console.log("Category:", category);

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
                        setLoading(false);
                        setIsInfoModalOpen(true);
                        setTimeout(() => { 
                            setIsInfoModalOpen(false);
                            navigate('/')
                        }, 4000);
                    } else {
                        console.error("Greška pri učitavanju slika: ", imageResponse);
                        alert("Neuspešno učitavanje slika.");
                        setLoading(false);
                    }
                } catch (err: unknown) {
                    console.error("Greška pri dodavanju slika:", err);
                    if (err instanceof AxiosError && err.response) {
                        const errorResponse: ApiErrorResponse = err.response.data;
                        console.error("Server error details:", errorResponse);
                        alert(`Greška pri dodavanju slika: ${errorResponse.message}`);
                    } else {
                        alert("Greška pri dodavanju slika.");
                    }
                }
            } else {
                console.error("Greška pri kreiranju aukcije: ", response);
                alert("Neuspešno kreiranje aukcije.");
                setLoading(false);
            }
        } catch (err: unknown) {
            console.error("Greška pri kreiranju aukcije:", err);
            if (err instanceof AxiosError && err.response) {
                const errorResponse: ApiErrorResponse = err.response.data;
                console.error("Server error details:", errorResponse);
                alert(`Greška pri kreiranju aukcije: ${errorResponse.message}`);
            } else {
                alert("Greška pri kreiranju aukcije.");
            }
        }
    };

    const handleCancel = () => {
        setIsInfoModalOpen(false);
        navigate('/')
    }

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
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCategory(e.target.value);
        setErrors(prevErrors => ({ ...prevErrors, category: "" }));
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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <img src="/assets/logo1-1.png" alt="Loading..." className="loading-gif" />
            </div>
        );
    }

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
                    </div>
                    {errors.title && <p className="error-message">{errors.title}</p>}
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
                            <span id="din-span">RSD</span>
                            {errors.current_price && <p className="error-message">{errors.current_price}</p>}
                        </div>

                        <div className="auction-duration">
                            <label htmlFor="auction_duration">Trajanje aukcije:</label>
                            <select
                                className="duration"
                                id="auction_duration"
                                value={auctionDuration}
                                onChange={(e) => setAuctionDuration(Number(e.target.value))}
                            >
                                <option value={1}>1 dan</option>
                                <option value={3}>3 dana</option>
                                <option value={4}>4 dana</option>
                                <option value={7}>7 dana</option>
                                <option value={10} disabled>10 dana - uskoro</option>
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
                    <div className="select-container">
                        <label>Izaberite kategoriju proizvoda:</label>
                            <select 
                                id="product-category" 
                                value={category}
                                onChange={handleCategoryChange}
                                >
                                <option value="" disabled>Izaberite kategoriju</option>
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
                            {errors.category && <p className="error-message">{errors.category}</p>}
                        </div>
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
                        <button type="button" onClick={() => document.getElementById("images")?.click()}>Odaberi slike</button>
                        <span className="fajl">{images.length > 0 ? `${images.length} odabranih fajlova` : "Nijedan fajl nije odabran"}</span>
                    </div>
                    <div className="selected-images">
                        {images.map((image, index) => (
                            <div key={index} className="image-preview">
                                <img src={URL.createObjectURL(image)} alt={`Selected ${index}`} />
                                <button type="button" className="remove-image" onClick={() => removeImage(index)}>X</button>
                            </div>
                        ))}
                    </div>
                    {errors.images && <p className="error-images">{errors.images}</p>}

                    <div className="contact-info">
                        <label htmlFor="city">Grad:</label>
                        <input
                            type="text"
                            id="city"
                            value={city || ''}
                            onChange={(e) => handleInputChange(e, 'city')}
                        />
                    </div>
                    {errors.city && <p className="error-images">{errors.city}</p>}
                    <div className="contact-info">
                        <label htmlFor="phone">Broj telefona:</label>
                        <input
                            type="text"
                            id="phone"
                            value={phoneNumber || ''}
                            onChange={(e) => handleInputChange(e, 'phoneNumber')}
                        />
                    </div>
                    {errors.phoneNumber && <p className="error-images">{errors.phoneNumber}</p>}
                    
                    <input type="submit" value="Završi" id="submit-btn" />
                        {successMessage && (
                        <div className="success-anim">
                            <p className="success-message">{successMessage}</p>
                            <div className="checkmark"></div>
                        </div>
                )}
                </div>
            </form>
            <InfoModal
            isOpen={isInfoModalOpen}
            title='Čestitamo!'
            message='Uspešno ste postavili aukciju.'
            onCancel={handleCancel}
        />
        </div>
    );
}

export default CreateAuction;
