import React, { Fragment, useState, useEffect } from 'react';
import './../Styles/authentication.css';
import './../Styles/userpage.css';
import api from '../api';
import { useNavigate } from 'react-router-dom';

function UserPage() {
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        first_name: '',
        phone_number: '',
        city: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/api/current_user_data');
                setUserData({
                    first_name: response.data.first_name || '',
                    phone_number: response.data.phone_number || '',
                    city: response.data.city || ''
                });
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await api.put('/api/update-profile/', userData);
            setSuccessMessage('Podaci su uspešno ažurirani.');
            setErrorMessage('');
            console.log(response.data);
            
            setTimeout(() => {
                navigate('/');
            }, 1300);
        } catch (error) {
            console.error('Error updating user data:', error);
            setErrorMessage('Greška pri ažuriranju podataka.');
            setSuccessMessage('');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Korisnička stranica</h2>

                <form onSubmit={handleSubmit}>
                    <div className="userpage-form">
                        <div className="form-group">
                            <label htmlFor="name">Ime i prezime</label>
                            <input
                                type="text"
                                id="name"
                                name="first_name"
                                value={userData.first_name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Broj telefona</label>
                            <input
                                type="phone"
                                id="phone_number"
                                name="phone_number"
                                value={userData.phone_number}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">Grad</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={userData.city}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button type="submit">Ažurirajte podatke</button>
                </form>

                {successMessage && (
                    <div className="success-animation">
                        <p className="success-message">{successMessage}</p>
                        <div className="checkmark"></div>
                    </div>
                )}
                {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
        </Fragment>
    );
}

export default UserPage;
