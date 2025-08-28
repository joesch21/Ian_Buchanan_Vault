import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Audit from './pages/Audit.jsx'

const Page = window.location.pathname.startsWith('/audit') ? Audit : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Page />
  </StrictMode>,
)
