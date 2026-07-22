import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import WaterMarquee from './components/WaterMarquee.jsx'
import WaterLines from './components/WaterLines.jsx'
import FaceLines from './components/FaceLines.jsx'
import FaceMarquee from './components/FaceMarquee.jsx'
import FaceBurst from './components/FaceBurst.jsx'

// Overscroll bounce, back/forward swipe, and pinch-zoom are all suppressed via
// CSS (html,body: overflow hidden + overscroll-behavior:none + touch-action:none
// in index.css) plus the locked viewport meta. Using JS preventDefault here
// instead would force every wheel/touch event onto the browser's slow
// synchronous path and make the whole site feel choppy — so it's intentionally
// left to CSS.

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
