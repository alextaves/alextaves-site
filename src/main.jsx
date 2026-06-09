import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent overscroll bounce, back/forward swipe, and pinch-zoom at the document level.
// Non-passive so preventDefault() is honoured by the browser.
document.addEventListener('wheel',     (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
