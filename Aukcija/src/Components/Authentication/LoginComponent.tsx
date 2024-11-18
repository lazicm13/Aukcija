import React, { Fragment, useState } from 'react';
import './../../Styles/authentication.css';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AxiosError } from 'axios';


function LoginComponent() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        // Validation
        if (!formData.email || !formData.password) {
            setError('Molim vas da unesete vaš email i lozinku!');
            return;
        }
    
        try {
            // API call for login
            const response = await api.post("/api/login/", {
                email: formData.email,
                password: formData.password
            });
    
            if (response.status === 200) {
                setError(''); // Clear any previous errors
                
                // Reset form (optional)
                console.log(response.data);
                if(response.data.redirect_url)
                    window.location.href = response.data.redirect_url;
    
                setSuccessMessage('Uspesno ste se ulogovali!');
                setError('');
                setTimeout(() => {
                    navigate('/');
                }, 1800); // Redirect to home page or dashboard
            }
        } catch (error) {
            console.error("Login failed:", error);
    
            // Type assertion to AxiosError for proper type checking
            const axiosError = error as AxiosError;
    
            // Check if the error is related to unverified account
            if (axiosError.response && axiosError.response.status === 403) {
                setError('Vaš nalog nije verifikovan. Proverite vaš email.\n');
            } else {
                setError('Email ili lozinka nisu tačni!');
            }
    
            setSuccessMessage(''); // Clear success message
        }
    };
    
    

    const handleGoogleSuccess = async (credentialResponse: any) => {
        // Here you can send the token to your backend for validation
        const { credential } = credentialResponse;
        try {
            const response = await api.post("/api/auth/google/", { id_token: credential });
            if (response.status === 200) {
                setSuccessMessage('Uspesno ste se ulogovali!');
                setError('');
                setTimeout(() => {
                    navigate('/');
                }, 1800);
            }
        } catch (error) {
            console.error("Login failed:", error);
    
            // Type assertion to AxiosError for proper type checking
            const axiosError = error as AxiosError;
    
            // Check if the error is related to unverified account
            if (axiosError.response && axiosError.response.status === 403) {
                setError('Vaš nalog je blokiran.');
            } else {
                setError('Email ili lozinka nisu tačni!');
            }
    
            setSuccessMessage(''); // Clear success message
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
    };

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Login</h2>
                
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    locale='sr-Latn'
                />
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Lozinka:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                    <button type="submit">Ulogujte se</button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {successMessage && (
                    <div className="success-animation">
                        <p className="success-message">{successMessage}</p>
                        <div className="checkmark"></div>
                    </div>
                )}
            </div>
        </Fragment>
    );
}

export default LoginComponent;
