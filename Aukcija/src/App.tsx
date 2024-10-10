import React, { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginComponent from './Components/Authentication/LoginComponent'
import RegistrationComponent from './Components/Authentication/RegistrationComponent'
import Header from './Components/Header'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
      <Header />
        <Routes>
          <Route path='/login' element={<LoginComponent/>}/>
          <Route path='/registracija' element={<RegistrationComponent/>}/>
        </Routes>
      </Router>   
    </>
  )
}

export default App
