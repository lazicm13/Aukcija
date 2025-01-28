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
import { GoogleOAuthProvider } from '@react-oauth/google';
import UserPage from './Pages/UserPage'
import MyAuctionsPage from './Pages/MyAuctionsPage'
import ChangePasswordPage from './Pages/ChangePasswordPage'
import Auction from './Components/AuctionItems/Auction'
// import AdminPage from './Pages/AdminPage'
// import AdminRoute from './Components/AdminRoute'
import MyBids from './Pages/MyBids'
// import ChatPage from './Pages/ChatRoom'
// import ChatListPage from './Components/Chat/ChatListPage'

const CLIENT_ID = '516726223486-ese1hmu3fmae12vgcv8b2tthgcnol316.apps.googleusercontent.com';

function Register() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const response = await api.get("/api/user/status/");
      setIsLoggedIn(response.data.is_authenticated);
    };
    checkAuth();
  }, []);

  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <RegistrationComponent/> // Možeš dodati loader ili nešto drugo dok čekaš
}

function Login(){
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const response = await api.get("/api/user/status/");
      setIsLoggedIn(response.data.is_authenticated);
    };
    checkAuth();
  }, []);

  if (isLoggedIn) {
    return <Navigate to="/" />;
  }

  return <LoginComponent/> 
}


function App() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // useEffect(() => {
  //     const fetchUserData = async () => {
  //         try {
  //             const response = await api.get('/api/current_user_data');
  //             setIsAdmin(response.data.is_superuser);
  //         } catch (error) {
  //             console.error('Error fetching user data:', error);
  //             setIsAdmin(false); // Postavi na false ako API poziv ne uspe
  //         }
  //     };

  //     fetchUserData();
  // }, []);

  // if (isAdmin === null) {
  //     // Loader dok se ne utvrdi da li je admin
  //     return <div>Loading...</div>;
  // }

  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route
            path='/'
            element={<Home />}
          />
          <Route
            path='/login'
            element={
              <GoogleOAuthProvider clientId={CLIENT_ID}>
                <Login />
              </GoogleOAuthProvider>
            }
          />
          <Route
            path='/registracija'
            element={
              <GoogleOAuthProvider clientId={CLIENT_ID}>
                <Register />
              </GoogleOAuthProvider>
            }
          />
          <Route
            path='/nova-aukcija'
            element={
              <ProtectedRoute>
                <CreateAuction />
              </ProtectedRoute>
            }
          />
          <Route
            path='*'
            element={<NotFound />}
          />
          <Route
            path='/profil'
            element={
              <ProtectedRoute>
                <UserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/moje-aukcije'
            element={
              <ProtectedRoute>
                <MyAuctionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/promena-lozinke'
            element={
              <ProtectedRoute>
                <ChangePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path='/aukcija/:id'
            element={
              <ProtectedRoute>
                <Auction />
              </ProtectedRoute>
            }
          />
          {/* <Route path='/admin' element={<AdminRoute isAdmin={isAdmin} />}>
            <Route path='dashboard' element={<AdminPage />} />
          </Route> */}

          <Route
            path='/moje-licitacije'
            element={
              <ProtectedRoute>
                <MyBids />
              </ProtectedRoute>
            }
          />
          {/* <Route path="/chat/:chatroomId" element={<ChatPage/>} />
          <Route path="/moje-poruke" element={<ChatListPage />} /> */}
        </Routes>
      </Router>
    </>
  );
}


export default App;