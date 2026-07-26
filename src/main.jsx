import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MobilePlaceholder from './components/MobilePlaceholder.jsx'
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

const params = new URLSearchParams(window.location.search)
const preview = params.get('preview')

// Phones get the mobile stand-in (endless Detroit scroll) instead of the heavy
// WebGL carousel, which isn't ready for mobile. `?desktop` forces the real site.
function isPhone() {
  if (params.has('desktop')) return false
  const ua = /Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const coarseSmall = window.matchMedia('(pointer: coarse)').matches
    && Math.min(window.innerWidth, window.innerHeight) < 600
  return ua || coarseSmall
}

function Root() {
  if (params.has('mobile') || isPhone()) return <MobilePlaceholder />   // ?mobile previews it on desktop
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
