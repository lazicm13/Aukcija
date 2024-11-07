import React, { Fragment, useState } from 'react';
import api from '../../api';
import './../../Styles/authentication.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

function RegistrationComponent() {
    const [formData, setFormData] = useState({
        first_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userEmail, setUserEmail] = useState('');

    // Funkcija za rukovanje promenama u input poljima
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Funkcija za validaciju lozinki
    const validatePassword = () => {
        const { password, confirmPassword } = formData;
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/; // Minimum 8 znakova, barem jedan broj i jedan specijalni znak

        if (password !== confirmPassword) {
            setError('Lozinke se ne poklapaju.');
            return false;
        }

        if (!passwordRegex.test(password)) {
            setError('Lozinka mora imati minimum 8 znakova, barem jedan broj i jedan specijalni znak.');
            return false;
        }

        setError(''); // Resetovanje greške ako je sve u redu
        return true;
    };

    // Funkcija za slanje forme
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validacija lozinki
        if (!validatePassword()) {
            return; // Ako validacija ne uspe, ne šaljemo zahtev
        }

        try {
            // Slanje POST zahteva ka API-u za registraciju
            const response = await api.post('/api/user/register/', {
                first_name: formData.first_name,
                email: formData.email,
                password: formData.password
            });

            if (response.status === 201) {
                setSuccessMessage('Registracija je uspešna!');
                setIsModalOpen(true); // Otvori modal
                // Resetovanje forme
                setUserEmail(formData.email);
                setFormData({
                    first_name: '',
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error("Registracija nije uspela:", error);
            setError('Došlo je do greške prilikom registracije.');
            setSuccessMessage('');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // Here you can send the token to your backend for validation
        const { credential } = credentialResponse;
        try {
            const response = await api.post("/api/auth/google/", { id_token: credential });
            if (response.status === 200) {
                alert("Google login successful!");
                navigate('/');
            }
        } catch (error) {
            console.error("Google login failed:", error);
            setError('Google login failed. Please try again.');
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Registrujte se</h2>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    locale='sr-Latn'
                />
                <form onSubmit={handleSubmit}>
                    {/* Polje za email */}
                    <div>
                        <label htmlFor="name">Ime i prezime:</label>
                        <input
                            type="text"
                            id="name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    {/* Polje za lozinku */}
                    <div>
                        <label htmlFor="password">Lozinka:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor='confirmPassword'>Potvrdi lozinku:</label>
                        <input
                            type='password'
                            id='confirmPassword'
                            name='confirmPassword'
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <button type="submit">Registrujte se</button>
                </form>
            </div>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Uspešna registracija!</h3>
                        <p>Email za verifikaciju je poslat na vašu adresu: {userEmail}</p>
                        <button onClick={() => {
                            setIsModalOpen(false);
                            navigate('/login'); // Preusmeri na login
                        }}>
                            Zatvori
                        </button>
                    </div>
                </div>
            )}
        </Fragment>
    );
}

export default RegistrationComponent;
