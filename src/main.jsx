import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import MobileGrid from './components/MobileGrid.jsx'
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

// Phones get the card grid instead of the heavy WebGL carousel, which isn't
// ready for mobile. `?desktop` forces the real site, `?mobile` previews the grid.
//
// Deliberately NOT `(pointer: coarse)`: Safari on macOS reports that true on an
// ordinary desktop with a trackpad, which would hand real desktop visitors the
// phone homepage. maxTouchPoints is the reliable signal (desktop 0-1, iPad 5),
// and iPadOS also claims to be "Macintosh" in its UA, so the touch-point count
// is what catches it.
function isPhone() {
  if (params.has('desktop')) return false
  const ua = /Android|iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const touchSmall = navigator.maxTouchPoints > 1
    && Math.min(window.innerWidth, window.innerHeight) < 600
  return ua || touchSmall
}

function Root() {
  // The grid IS the mobile homepage — you land on it. There is no entry gate in
  // front of it any more (components/MobilePlaceholder.jsx still holds that
  // WELCOME screen, now unrouted).
  if (params.has('mobile') || isPhone()) return <MobileGrid />   // ?mobile previews it on desktop
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
