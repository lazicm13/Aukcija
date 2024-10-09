import React, { Fragment, useState } from 'react';
import './../../Styles/authentication.css';

function LoginComponent() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validacija (primer)
        if (!formData.email || !formData.password) {
            setError('Please fill in both fields.');
            return;
        }

        // Simuliraj uspešnu prijavu
        setSuccessMessage('Login successful!');
        setError('');

        // Resetuj formu (opciono)
        setFormData({
            email: '',
            password: ''
        });
    };

    return (
        <Fragment>
            <h2>Ulogujte se</h2>
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
        </Fragment>
    );
}

export default LoginComponent;
