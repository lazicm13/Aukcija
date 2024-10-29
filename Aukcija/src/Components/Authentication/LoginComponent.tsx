import React, { Fragment, useState } from 'react';
import './../../Styles/authentication.css';
import api from '../../api';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

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
            setError('Please fill in both fields.');
            return;
        }

        try {
            // API call for login
            const response = await api.post("/api/login/", {
                email: formData.email,
                password: formData.password
            });

            if (response.status === 200) {
                setSuccessMessage('Login successful!');
                setError('');

                // Reset form (optional)
                setFormData({
                    email: '',
                    password: ''
                });
                
                alert("Successful login!");
                navigate('/');
            }
        } catch (error) {
            console.error("Login failed:", error);
            setError('Invalid credentials. Please try again.');
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
                <h2>Login</h2>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
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
                            required
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
                            required
                        />
                    </div>
                    <button type="submit">Ulogujte se</button>
                </form>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            </div>
        </Fragment>
    );
}

export default LoginComponent;
