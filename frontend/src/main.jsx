import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "@fontsource/eb-garamond";  // default 400 weight
import "@fontsource/eb-garamond/700.css"; // bold
import "@fontsource/libre-baskerville";  


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
