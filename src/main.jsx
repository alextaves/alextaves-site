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

// iPad mini and smaller get the card grid; everything larger gets the WebGL
// ring. `?desktop` forces the ring, `?mobile` previews the grid.
//
// iPad mini's short side is 768px on the older models and 744 on the 2021-on
// ones. The next size up, iPad Air, is 834. So 768 is the line, and it is drawn
// against the SHORT side so it holds in either orientation.
const SMALL_SCREEN_MAX = 768

// Measured off `screen`, not the window: screen describes the device, so a
// desktop browser dragged narrow still gets the desktop site, which is what a
// window resize should mean.
//
// Two things this deliberately does NOT use. `(pointer: coarse)` — Safari on
// macOS reports it true on an ordinary desktop with a trackpad, which would
// hand real desktop visitors the phone homepage. And the UA — "Android" appears
// on big Android tablets just as it does on phones, so matching it would pull
// tablets over the line the size test is there to draw. maxTouchPoints is what
// separates a touch device from a display (desktop 0-1, iPad 5), and it is also
// what catches iPadOS, which claims to be "Macintosh".
function isSmallScreen() {
  if (params.has('desktop')) return false
  if (navigator.maxTouchPoints <= 1) return false
  const shortSide = Math.min(
    window.screen?.width || window.innerWidth,
    window.screen?.height || window.innerHeight,
  )
  return shortSide <= SMALL_SCREEN_MAX
}

function Root() {
  // The grid IS the small-screen homepage — you land on it. There is no entry
  // gate in front of it any more (components/MobilePlaceholder.jsx still holds
  // that WELCOME screen, now unrouted).
  if (params.has('mobile') || isSmallScreen()) return <MobileGrid />   // ?mobile previews it anywhere
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
