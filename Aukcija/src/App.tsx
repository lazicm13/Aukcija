import './App.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LoginComponent from './Components/Authentication/LoginComponent'
import RegistrationComponent from './Components/Authentication/RegistrationComponent'
import Header from './Components/Header'
import Home from './Pages/Home'
import NotFound from './Pages/NotFound'
import ProtectedRoute from './Components/ProtectedRoute'
import api from './api'
import { useState, useEffect } from 'react'
import CreateAuction from './Components/AuctionItems/CreateAuction'

async function logout(){
  try{
      const response = await api.post("api/logout/", {});
      if (response.status === 200) {
          console.log("Logout was successful!");
          return true;
      } else {
          console.error("Logout failed with status:", response.status, response);
          return false;
      }
  }catch(error)
  {
      console.error("Error, logout failed:", error);
      return false;
  }
}



function RegisterAndLogout() {
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
      const handleLogout = async () => {
          const success = await logout();
          if (success) {
              setIsLoggedOut(true);
          }
      };
      handleLogout();
  }, []);

  if (!isLoggedOut) {
      return <RegistrationComponent />;
  }

  return <div>Logging out...</div>; // Možeš dodati loader ili nešto drugo dok čekaš
}

function App() {
  return (
    <>
      <Router>
      <Header />
        <Routes>
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Home/>
              </ProtectedRoute>
            }
          />
          <Route
            path='/login'
            element={<LoginComponent/>}
          />
          <Route
            path='/registracija'
            element={<RegisterAndLogout/>}
          />
          <Route
            path='/novaAukcija'
            element={<CreateAuction/>}
          />
          <Route
            path='*'
            element={<NotFound/>}
          />
        </Routes>
      </Router>   
    </>
  )
}

export default App
