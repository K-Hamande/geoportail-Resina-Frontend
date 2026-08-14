import 'leaflet/dist/leaflet.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initAccessToken } from './shared/accessToken'

// Doit s'executer AVANT le premier rendu, pour que le jeton soit deja
// resolu quand les pages commencent a appeler l'API.
initAccessToken();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)