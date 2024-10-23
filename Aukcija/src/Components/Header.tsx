import React, { useLocation } from 'react-router-dom';
import './../Styles/header.css';

function Header() {
  const location = useLocation();

  return (
    <header className='sticky-header'>
        <img src='./src/assets/logo1.png' className='header-logo'></img>
      {location.pathname === '/registracija' && <p>Imate nalog? → <a href='login'>Ulogujte se</a></p>}
      {location.pathname === '/login' && <p>Nemate nalog? → <a href='registracija'>Registrujte se</a></p>}
      {location.pathname === '/' && <button className='create-auction'>Kreiraj aukciju</button>}
      {/* Dodaj uslove za druge stranice ako je potrebno */}
    </header>
  );
}

export default Header;