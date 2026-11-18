import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminDashboard from './AdminDashboard.jsx'
import './styles.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
const isAdminRoute = window.location.pathname.replace(/\/+$/, '').endsWith('/admin')

if (isAdminRoute) {
  // Do not import the storefront bundle on the admin route.
  root.render(<React.StrictMode><AdminDashboard /></React.StrictMode>)
} else {
  Promise.all([
    import('react-router-dom'),
    import('./App.jsx'),
  ]).then(([router, app]) => {
    const BrowserRouter = router.BrowserRouter
    const App = app.default
    root.render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>)
  }).catch((error) => {
    console.error('ShaadiSutra storefront failed to load:', error)
    root.render(<main style={{padding:24,fontFamily:'sans-serif'}}><h1>Website temporarily unavailable</h1><p>Please refresh the page in a moment.</p></main>)
  })
}
