import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import './styles.css'

// Keep the admin studio isolated from the storefront application. This avoids
// unrelated storefront state/effects from preventing the admin screen mounting.
const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminDashboard /> : <BrowserRouter><App /></BrowserRouter>}
  </React.StrictMode>
)
