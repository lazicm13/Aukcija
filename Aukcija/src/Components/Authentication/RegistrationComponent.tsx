import { Fragment, useState } from 'react';
import api from '../../api';
import './../../Styles/authentication.css';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import InfoModal from '../Modals/infoModal';

function RegistrationComponent() {
    const [formData, setFormData] = useState({
        first_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState({
        first_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirmPassword: '',
        general: ''
    });
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();
    const [userEmail, setUserEmail] = useState('');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [namePlaceholder, setNamePlaceholder] = useState('Ime i prezime');
    const [emailPlaceholder, setEmailPlaceholder] = useState('Email');
    const [phonePlaceholder, setPhonePlaceholder] = useState('Broj telefona');
    const [passwordPlaceholder, setPasswordPlaceholder] = useState('Lozinka');
    const [confirmPasswordPlaceholder, setConfirmPasswordPlaceholder] = useState('Potvrdite lozinku');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError({
            ...error,
            [name]: '',  // Clear specific field error on input change
            general: ''  // Clear general error on input change
        });
    };

    const validateFields = () => {
        let isValid = true;
        const errors: any = { first_name: '', email: '', password: '', confirmPassword: '', general: '' };

        if (!formData.first_name) {
            errors.first_name = 'Ime je obavezno.';
            isValid = false;
        }
        if (!formData.email) {
            errors.email = 'Email je obavezan.';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email nije validan.';
            isValid = false;
        }
        if (!formData.phone_number) {
            errors.phone_number = 'Broj telefona je obavezan';
            isValid = false;
        } else if (!/^\+?[0-9]\d{1,14}$/.test(formData.phone_number)) {
            errors.phone_number = 'Broj telefona nije validan.';
            isValid = false;
        }
        if (!formData.password) {
            errors.password = 'Lozinka je obavezna.';
            isValid = false;
        } else if (!/^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{8,}$/.test(formData.password)) {
            errors.password = 'Lozinka mora imati minimum 8 znakova i barem jedan broj.';
            isValid = false;
        }        
        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Potvrda lozinke je obavezna.';
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Lozinke se ne poklapaju.';
            isValid = false;
        }

        setError(errors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateFields()) return;

        try {
            const response = await api.post('/api/user/register/', {
                first_name: formData.first_name,
                email: formData.email,
                phone_number: formData.phone_number,
                password: formData.password
            });

            if (response.status === 201) {
                setSuccessMessage('Registracija je uspešna!');
                setIsInfoModalOpen(true);
                setUserEmail(formData.email);
                setFormData({
                    first_name: '',
                    email: '',
                    phone_number: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        } catch (err: any) {
            console.error("Registracija nije uspela:", err);
            
            // Ako backend vraća specifičnu grešku za email, prikažite je korisniku
            if (err.response && err.response.data && err.response.data.email) {
                setError((prevError) => ({
                    ...prevError,
                    email: err.response.data.email[0],  // Na primer, "Email već postoji."
                    general: ''
                }));
            } else {
                setError((prevError) => ({
                    ...prevError,
                    general: 'Došlo je do greške prilikom registracije. Pokušajte ponovo.'
                }));
            }
            setSuccessMessage('');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        const { credential } = credentialResponse;
        try {
            const response = await api.post("/api/auth/google/", { id_token: credential });
            if (response.status === 200) {
                navigate('/');
            }
        } catch (error) {
            console.error("Google login failed:", error);
            setError((prevError) => ({
                ...prevError,
                general: 'Google login failed. Please try again.'
            }));
        }
    };

    const handleGoogleError = () => {
        setError((prevError) => ({
            ...prevError,
            general: 'Google login failed. Please try again.'
        }));
    };

    const handleCancel = () => {
        setIsInfoModalOpen(false);
        navigate('/login');
    }

    const handleNameFocus = () => {
        setNamePlaceholder('');
    }

    const handleEmailFocus = () => {
        setEmailPlaceholder('');
    }

    const handlePhoneFocus = () => {
        setPhonePlaceholder('');
    }

    const handlePasswordFocus = () => {
        setPasswordPlaceholder('');
    }

    const handleConfirmPasswordFocus = () => {
        setConfirmPasswordPlaceholder('');
    }

    const handleNameBlur = () => {
        setNamePlaceholder('Ime i prezime');
    }

    const handleEmailBlur = () => {
        setEmailPlaceholder('Email');
    }

    const handlePhoneBlur = () => {
        setPhonePlaceholder('Broj telefona');
    }

    const handlePasswordBlur = () => {
        setPasswordPlaceholder('Lozinka');
    }

    const handleConfirmPasswordBlur = () => {
        setConfirmPasswordPlaceholder('Potvrdite lozinku');
    }

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Registrujte se</h2>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    locale='sr-Latn'
                />
                <form onSubmit={handleSubmit} noValidate>
                    <div>
                        {/* <label htmlFor="name">Ime i prezime:</label> */}
                        <input
                            type="text"
                            id="name"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleInputChange}
                            placeholder={namePlaceholder}
                            onFocus={handleNameFocus}
                            onBlur={handleNameBlur}
                        />
                        {error.first_name && <p className="error-message">{error.first_name}</p>}
                    </div>
                    <div>
                        {/* <label htmlFor="email">Email:</label> */}
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder={emailPlaceholder}
                            onFocus={handleEmailFocus}
                            onBlur={handleEmailBlur}
                        />
                        {error.email && <p className="error-message">{error.email}</p>}
                    </div>
                    <div>
                        {/* <label htmlFor="phone">Broj telefona:</label> */}
                        <input
                            type="phone"
                            id="phone"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleInputChange}
                            placeholder={phonePlaceholder}
                            onFocus={handlePhoneFocus}
                            onBlur={handlePhoneBlur}
                        />
                        {error.phone_number && <p className="error-message">{error.phone_number}</p>}
                    </div>
                    <div>
                        {/* <label htmlFor="password">Lozinka:</label> */}
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder={passwordPlaceholder}
                            onFocus={handlePasswordFocus}
                            onBlur={handlePasswordBlur}
                        />
                        {error.password && <p className="error-message">{error.password}</p>}
                    </div>
                    <div>
                        {/* <label htmlFor='confirmPassword'>Potvrdi lozinku:</label> */}
                        <input
                            type='password'
                            id='confirmPassword'
                            name='confirmPassword'
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder={confirmPasswordPlaceholder}
                            onFocus={handleConfirmPasswordFocus}
                            onBlur={handleConfirmPasswordBlur}
                        />
                        {error.confirmPassword && <p className="error-message">{error.confirmPassword}</p>}
                    </div>

                    {error.general && <p className="error-message">{error.general}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                    <button type="submit">Registrujte se</button>
                </form>
            </div>

        <InfoModal
            isOpen={isInfoModalOpen}
            title='Uspešna registracija!'
            message={`Email za verifikaciju je poslat na vašu adresu: ${userEmail}`}
            onCancel={handleCancel}
        />
        </Fragment>
    );
}

export default RegistrationComponent;
