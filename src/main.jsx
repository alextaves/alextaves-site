import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import WaterMarquee from './components/WaterMarquee.jsx'
import WaterLines from './components/WaterLines.jsx'
import FaceLines from './components/FaceLines.jsx'
import FaceMarquee from './components/FaceMarquee.jsx'
import FaceBurst from './components/FaceBurst.jsx'

// Prevent overscroll bounce, back/forward swipe, and pinch-zoom at the document level.
// Non-passive so preventDefault() is honoured by the browser.
document.addEventListener('wheel',     (e) => e.preventDefault(), { passive: false })
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false })

const preview = new URLSearchParams(window.location.search).get('preview')

function Root() {
  if (preview === 'water') return <WaterMarquee />
  if (preview === 'lines') return <WaterLines />
  if (preview === 'facelines') return <FaceLines />
  if (preview === 'facemarquee') return <FaceMarquee />
  if (preview === 'faceburst') return <FaceBurst />
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
