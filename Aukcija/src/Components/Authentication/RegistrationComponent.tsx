import React, { Fragment, useState } from 'react';
import api from '../../api';
import './../../Styles/authentication.css';
import { useNavigate } from 'react-router-dom';

function RegistrationComponent() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

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
                email: formData.email,
                password: formData.password
            });

            if (response.status === 201) {
                setSuccessMessage('Registracija je uspešna!');
                // Resetovanje forme
                setFormData({
                    email: '',
                    password: '',
                    confirmPassword: ''
                });
                alert('Uspesna registracija!');
                navigate('/login');
            }
        } catch (error) {
            console.error("Registracija nije uspela:", error);
            setError('Došlo je do greške prilikom registracije.');
            setSuccessMessage('');
        }
    };

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Registrujte se</h2>
                
                <form onSubmit={handleSubmit}>
                    {/* Polje za email */}
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
        </Fragment>
    );
}

export default RegistrationComponent;
