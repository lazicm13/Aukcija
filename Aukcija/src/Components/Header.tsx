import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './../Styles/header.css';
import api from '../api';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Assuming you get the user's name from a context, prop, or state
  const [userName, setUserName] = useState('Marko'); // Replace with actual user fetching logic
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCreateAuction = () => {
    navigate('/nova-aukcija');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = async () => {
    try {
      const response = await api.post("api/logout/", { withCredentials: true });
      if (response.status === 200) {
        console.log("Logout was successful!");
        setUserName(''); // Clear user data
        navigate('/'); // Redirect after logout
        return true;
      } else {
        console.error("Logout failed with status:", response.status, response);
        return false;
      }
    } catch (error) {
      console.error("Error, logout failed:", error);
      return false;
    }
  };


  return (
    <header className='sticky-header'>
      <a href='/'><img src='./src/assets/logo1.png' className='header-logo' alt='Logo' /></a>

      <div className="header-right">
        {location.pathname === '/' && (
          <button className='create-auction-btn' onClick={handleCreateAuction}>
            Kreiraj aukciju ⚒️
          </button>
        )}
        {location.pathname === '/registracija' && <p>Imate nalog? → <a href='login'>Ulogujte se</a></p>}
        {location.pathname === '/login' && <p>Nemate nalog? → <a href='registracija'>Registrujte se</a></p>}
        {(location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/registracija') && 
        <a href='/'><img src='./src/assets/home.png' className='home-button'></img></a>}
        {userName && (
          <div className="user-profile">
            <span className="user-name">{userName}</span>
            <img 
              src='./src/assets/user-icon.png' 
              className='user-icon' 
              alt='User Icon' 
              onClick={toggleDropdown} 
            />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <a href="/profil">Profil</a>
                <a href="/moje-aukcije">Moje aukcije</a>
                <a href="#" onClick={handleLogout}>Odjava</a>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}

export default Header;
