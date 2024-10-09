import React, { useState } from 'react'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LoginComponent from './Components/Authentication/LoginComponent'
import RegistrationComponent from './Components/Authentication/RegistrationComponent'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
          <Route path='/login' element={<LoginComponent/>}/>
          <Route path='/registracija' element={<RegistrationComponent/>}/>
        </Routes>
      </Router>   
    </>
  )
}

export default App
