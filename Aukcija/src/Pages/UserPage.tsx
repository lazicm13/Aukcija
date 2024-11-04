import React, { Fragment } from 'react';
import './../Styles/authentication.css'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';

function UserPage() {
    const navigate = useNavigate()
    const handleChangePasword = () => {
        navigate('/promena-lozinke');
    }

    return (
        <Fragment>
            <div className='form-container'>
                <h2>Korisnička stranica</h2>

                <form>
                    {/* Polje za email */}
                    <div>
                        <label htmlFor="phone">Broj telefona</label>
                        <input
                            type="phone"
                            id="phone_number"
                            name="phone_number"
                            // Here you can add value and onChange for state management if needed
                            required
                        />
                        <label htmlFor="city">Grad</label>
                        <input
                            type="text"
                            id="city"
                            name="city"
                            // Here you can add value and onChange for state management if needed
                            required
                        />
                    </div>
                    {/* Polje za lozinku */}
                    <button type='button' onClick={handleChangePasword}>Promeni lozinku</button>

                    <button type="submit">Ažurirajte podatke</button>
                </form>
            </div>
        </Fragment>
    );
}

export default UserPage;
