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
// A touchscreen LAPTOP passes both tests above and should not. Its screen is
// measured in CSS pixels, which OS display scaling changes: a 1920x1080 laptop
// at 150% reports 1280x720, so its short side is 720 and it looks like a
// tablet. Physical pixels do not separate them either — that laptop is 1080
// physical where an iPad mini is 1488.
//
// What does separate them is the PRIMARY pointer. On a touch laptop the mouse
// or trackpad is primary, so `(pointer: coarse)` is false while
// `(any-pointer: coarse)` is true. On a tablet touch is primary and it is true.
// The macOS-Safari worry noted above is already covered by maxTouchPoints,
// which is 0 there, so requiring both is safe.
function detect() {
  const touchPoints = navigator.maxTouchPoints
  const coarsePrimary = window.matchMedia('(pointer: coarse)').matches
  const shortSide = Math.min(
    window.screen?.width || window.innerWidth,
    window.screen?.height || window.innerHeight,
  )
  const small = !params.has('desktop')
    && touchPoints > 1
    && coarsePrimary
    && shortSide <= SMALL_SCREEN_MAX
  return { touchPoints, coarsePrimary, shortSide, dpr: window.devicePixelRatio, small }
}

function isSmallScreen() {
  return detect().small
}

// ?why prints what was measured, so a device that lands on the wrong homepage
// can say why without needing to be in the room.
if (params.has('why')) {
  const d = detect()
  console.log('[homepage]', d)
  addEventListener('DOMContentLoaded', () => {
    const el = document.createElement('pre')
    el.style.cssText = 'position:fixed;inset:auto 0 0 0;z-index:99999;margin:0;padding:12px;'
      + 'background:#111;color:#0f0;font:12px/1.5 ui-monospace,monospace;white-space:pre-wrap'
    el.textContent = 'homepage: ' + (d.small ? 'MOBILE GRID' : 'DESKTOP RING') + '\n'
      + Object.entries(d).map(([k, v]) => `  ${k}: ${v}`).join('\n')
      + '\n  (threshold: short side <= ' + SMALL_SCREEN_MAX + ')'
    document.body.appendChild(el)
  })
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
