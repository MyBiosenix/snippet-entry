import React from 'react'
import {BrowserRouter as Router } from 'react-router-dom'
import AppRoutes from './app/routes/AppRoutes'

function App() {
  return (
    <div>
      <Router>
        <AppRoutes />
      </Router>
    </div>
  )
}

export default App
