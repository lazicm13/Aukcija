import React, { Fragment } from 'react';
import './../../Styles/authentication.css';

function RegistrationComponent() {
    return (
        <Fragment>
            <div className='form-container'>
                <h2>Registrujte se</h2>
                <button className="google-button">
                    <img src="./src/assets/google-logo.png" className="google-logo" alt="Google Logo" />
                    Registrujte se preko Gmail-a
                </button>
                <form>
                    {/* Polje za ime */}
                    <div>
                        <label htmlFor="firstName">Ime i prezime:</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            required
                        />
                    </div>
                    {/* Polje za email */}
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
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
                            required
                        />
                    </div>
                    {/* Polje za potvrdu lozinke */}
                    <div>
                        <label htmlFor="confirmPassword">Potvrdite lozinku:</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            required
                        />
                    </div>
                    <button type="submit">Registrujte se</button>
                </form>
            </div>
        </Fragment>
    );
}

export default RegistrationComponent;
