import React, { Fragment } from 'react';
import './../Styles/authentication.css'; // Ensure this path is correct
import { useNavigate } from 'react-router-dom';
import './../Styles/userpage.css'

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
                    <div className="userpage-form">
                        <div className="form-group">
                            <label htmlFor="name">Ime i prezime</label>
                            <input
                                type="text"
                                id="name"
                                name="first_name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Broj telefona</label>
                            <input
                                type="phone"
                                id="phone_number"
                                name="phone_number"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="city">Grad</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                required
                            />
                        </div>
                    </div>

                    {/* Polje za lozinku */}
                    {/* <button type='button' onClick={handleChangePasword}>Promeni lozinku</button> */}

                    <button type="submit">Ažurirajte podatke</button>
                </form>
            </div>
        </Fragment>
    );
}

export default UserPage;
