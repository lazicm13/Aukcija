import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './../Styles/header.css';
import api from '../api';
import NotificationBell from './Bell';


function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState(''); // Replace with actual user fetching logic
    const [count, setUnreadCount] = useState<number>(0);
  

    const fetchUnreadNotificationsCount = async () => {
      try {
        const response = await api.get('/api/notifications/unread-count/');
        setUnreadCount(response.data.unread_notifications_count);
      } catch (error) {
        console.error('Error fetching unread notifications count:', error);
      }
    };

    useEffect(() => {
    fetchUnreadNotificationsCount();
  }, []);
  
  const fetchUsername = async () => {
    try {
      const response = await api.get('api/username');
      if (response.status === 200) {
        setUserName(response.data.username);
        fetchUnreadNotificationsCount(); // Osvežava notifikacije nakon logovanja
      } else {
        setUserName('');
        console.error('Failed to fetch username', response.status);
      }
    } catch (error) {
      console.error('Error fetching username:', error);
    }
  };

  useEffect(() => {
    if (location.pathname !== '/login' && location.pathname !== '/registracija') {
      fetchUsername();
    }
  }, [location.pathname]);
  // Assuming you get the user's name from a context, prop, or state
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

  const handleNavigate = () =>{
    navigate('/notifikacije');
  }

  return (
    <header className='sticky-header'>
      <a href='/'><img src='/assets/logo1.png' className='header-logo' alt='Logo' /></a>
      
      <div className="header-right">
        {location.pathname === '/' && (
          <button className='create-auction-btn' onClick={handleCreateAuction}>
            Postavi Aukciju 
          </button>
        )}
        {location.pathname === '/registracija' && <p className='register'>Imate nalog? → <a href='login'>Ulogujte se</a></p>}
        {location.pathname === '/login' && <p className='login'>Nemate nalog? → <a href='registracija'>Registrujte se</a></p>}
        {(location.pathname === '/' && userName === '') && <div className='login-register-links'><a href='login'>Ulogujte se </a><a href='/registracija'> Registracija</a></div>}
        {(location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/registracija') && 
        <a href='/'><img src='/assets/home.png' className='home-button'></img></a>}
        {userName && (<NotificationBell count={count} onClick={handleNavigate} className='notification-logo'/>)}
        {userName && (
          <div className="user-profile">
            {/* <span className="user-name">{userName}</span> */}
            <img 
              src='/assets/user-icon.png' 
              className='user-icon' 
              alt='User Icon' 
              onClick={toggleDropdown} 
            />
            {dropdownOpen && (
              <div className="dropdown-menu">
                <b>{userName}</b>
                <hr></hr>
                <a href="/profil">Profil</a>
                <a href="/moje-aukcije">Moje aukcije</a>
                <a href='/moje-licitacije' title='Predmeti na kojima sam licitirao'>Moje licitacije</a>
                {/* <a href='/moje-poruke'>Poruke</a> */}
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
