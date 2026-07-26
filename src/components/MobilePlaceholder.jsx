import { useRef, useEffect, useState } from 'react'
import VideoDiver6 from './VideoDiver6.jsx'

// Mobile entry gate. On arrival the phone gets a full-screen WELCOME card that
// types "WELCOME TO THE MOBILE VERSION" out, holds, untypes, and loops — the
// same absolute-clock typewriter cadence the fiction ring uses for its story
// covers (see startCoverTitleLoop in portals.html). AUDIO ON and ENTER stay
// present the whole time. A pulsing arrow points at AUDIO ON until the user
// turns sound on, then hops to ENTER. ENTER drops into the endless Detroit
// scroll below (the standing mobile placeholder). Force desktop with ?desktop.
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const BLUE = '#001ABE'
const INK = '#D8FF14'
const INK_SUB = 'rgba(216,255,20,0.62)'
const DULL = 'rgba(216,255,20,0.30)'

const LINES = ['WELCOME', 'TO THE', 'MOBILE', 'VERSION', 'A PREVIEW']

// Modern type scale: the title, then "A PREVIEW" one step down (÷1.25, a
// major third) — same vw/clamp shape so both scale together across screens.
const TYPE_BIG = 'clamp(33px, 11.6vw, 68px)'
const TYPE_STEP = 'clamp(27px, 9.3vw, 54px)'
const PREVIEW_IDX = LINES.length - 1

// Type/hold/backspace loop, matched to the fiction cover titles: types the
// whole block on, holds it, then backspaces it off — forever, off the wall
// clock so it never drifts.
const TYPE_DUR = 2200   // ms to type the whole block on
const HOLD_DUR = 2300   // ms the finished block sits fully typed
const BACK_DUR = 1100   // ms to backspace it off
const CYCLE = TYPE_DUR + HOLD_DUR + BACK_DUR
const CARET_MS = 375    // caret blink half-period, same as portals.html

const css = `
.mv-line { display: block; min-height: 1.14em; }
.mv-line.cursor-on::after {
  content: ''; display: inline-block;
  width: 0.06em; height: 0.82em; background: ${INK};
  margin-left: 0.06em; vertical-align: -0.06em;
}
@keyframes mvPulse {
  0%, 100% { opacity: 0.28; transform: translateX(5px); }
  50%      { opacity: 1;    transform: translateX(-3px); }
}
.mv-arrow { animation: mvPulse 1.15s ease-in-out infinite; }
`

// Leftward arrow, drawn so it stays crisp at any size and inherits row height.
function ArrowLeft() {
  return (
    <svg className="mv-arrow" viewBox="0 0 40 24" width="0.95em" height="0.58em"
      style={{ marginLeft: '0.4em', flex: 'none', overflow: 'visible' }} aria-hidden="true">
      <path d="M3 12 H37 M3 12 L15 4 M3 12 L15 20" stroke="#fff" strokeWidth="4"
        fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WelcomeGate({ audioOn, onToggleAudio, onEnter }) {
  const lineRefs = useRef([])

  // Continuous multi-line typewriter — one running char count spread across
  // the four lines, caret riding the last line with text on it.
  useEffect(() => {
    const total = LINES.reduce((n, l) => n + l.length, 0)
    let raf
    const frame = (now) => {
      const t = now % CYCLE
      let count
      if (t < TYPE_DUR) {
        count = Math.min(total, Math.floor((t / TYPE_DUR) * (total + 1)))
      } else if (t > CYCLE - BACK_DUR) {
        const bt = t - (CYCLE - BACK_DUR)
        count = total - Math.min(total, Math.floor((bt / BACK_DUR) * (total + 1)))
      } else {
        count = total
      }
      const caretOn = Math.floor(now / CARET_MS) % 2 === 0
      let remaining = count, activeIdx = 0
      LINES.forEach((line, i) => {
        const take = Math.max(0, Math.min(line.length, remaining))
        const el = lineRefs.current[i]
        if (el) el.textContent = line.slice(0, take)
        remaining -= take
        if (take > 0) activeIdx = i
      })
      lineRefs.current.forEach((el, i) => {
        if (el) el.classList.toggle('cursor-on', i === activeIdx && caretOn)
      })
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const bigType = {
    fontSize: TYPE_BIG, fontWeight: 700,
    lineHeight: 1.14, letterSpacing: '-0.01em',
  }
  const row = {
    ...bigType, display: 'flex', alignItems: 'center',
    width: 'fit-content', cursor: 'pointer', padding: '0.08em 0',
    WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, height: '100dvh', background: BLUE, color: INK,
      fontFamily: FONT, overflow: 'hidden', userSelect: 'none',
      WebkitUserSelect: 'none', WebkitTapHighlightColor: 'transparent',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      padding: 'max(6vh, env(safe-area-inset-top)) 7vw max(6vh, env(safe-area-inset-bottom))',
    }}>
      <style>{css}</style>

      {/* Typed title — "A PREVIEW" types on in the same run, one scale step down */}
      <div style={bigType}>
        {LINES.map((_, i) => (
          <span key={i} className="mv-line"
            ref={(el) => { lineRefs.current[i] = el }}
            style={i === PREVIEW_IDX ? { fontSize: TYPE_STEP, marginTop: '0.25em' } : undefined} />
        ))}
      </div>

      {/* Flexible spacers keep everything on one screen — they shrink on short
          phones so nothing ever needs to scroll. */}
      <div style={{ flex: '1.1 1 0', minHeight: 12 }} />

      {/* AUDIO ON — dulled until sound is on, arrow points here first */}
      <div style={{ ...row, color: audioOn ? INK : DULL }} onClick={onToggleAudio}>
        AUDIO ON{!audioOn && <ArrowLeft />}
      </div>

      <div style={{ flex: '0.8 1 0', minHeight: 10 }} />

      {/* ENTER — always lit, arrow hops here once audio is on */}
      <div style={{ ...row, color: INK }} onClick={onEnter}>
        ENTER{audioOn && <ArrowLeft />}
      </div>

      {/* Lowercase caption, mirroring the desktop welcome card's intro line */}
      <div style={{
        color: INK_SUB, fontWeight: 300, fontSize: 'clamp(13px, 3.6vw, 18px)',
        letterSpacing: '0.02em', lineHeight: 1.5, marginTop: '0.7em', maxWidth: '22em',
      }}>
        this is an immersive site, scroll in all directions
      </div>

      <div style={{ flex: '1.6 1 0' }} />
    </div>
  )
}


// Wraps the diver with a tap-to-reveal close control. On Android the ENTER tap
// put us in real fullscreen (no browser chrome), so there's no system way back
// out — this X gives one. It only exists while actually fullscreen (so it never
// shows on iPhone, which never enters fullscreen), appears on a tap, and
// auto-hides after a few seconds so it stays out of the experience.
function EnteredDiver() {
  const [isFs, setIsFs] = useState(false)
  const [showX, setShowX] = useState(false)
  const hideTimer = useRef(null)

  useEffect(() => {
    const onFsChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    onFsChange()
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // A tap (touch that didn't turn into a scroll/swipe) reveals the X. The
  // diver's own scroll/color-invert gestures are drags, so they don't trigger it.
  useEffect(() => {
    let sx = 0, sy = 0, moved = false
    const onStart = (e) => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; moved = false }
    const onMove = (e) => {
      const t = e.touches[0]
      if (Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) moved = true
    }
    const onEnd = () => {
      if (moved) return
      setShowX(true)
      clearTimeout(hideTimer.current)
      hideTimer.current = setTimeout(() => setShowX(false), 3200)
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      clearTimeout(hideTimer.current)
    }
  }, [])

  const exit = () => { document.exitFullscreen?.().catch(() => {}) }

  return (
    <>
      <VideoDiver6 />
      {isFs && showX && (
        <button onClick={exit} aria-label="Exit fullscreen" style={{
          position: 'fixed', zIndex: 50,
          top: 'calc(14px + env(safe-area-inset-top))', right: 14,
          width: 44, height: 44, padding: 0, borderRadius: '50%',
          border: 'none', background: 'rgba(0,0,0,0.4)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          WebkitTapHighlightColor: 'transparent',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
            stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4 L16 16 M16 4 L4 16" />
          </svg>
        </button>
      )}
    </>
  )
}

export default function MobilePlaceholder() {
  const [audioOn, setAudioOn] = useState(false)
  const [entered, setEntered] = useState(false)
  const audioRef = useRef(null)
  const crowdRef = useRef(null)
  const schoenRef = useRef(null)

  // The full ambient bed, matching desktop: the intro_mix (DJ mix) and a faint
  // crowd walla, plus the Schoenberg — here it's the pre-rendered
  // schoenberg_red.mp3 looped, rather than the heavy live Tone.js piano the
  // desktop runs. Audio elements are created inside the tap (a user gesture) so
  // mobile Safari lets them play. Kept running after ENTER.
  const toggleAudio = () => {
    if (audioOn) {
      audioRef.current?.pause()
      crowdRef.current?.pause()
      schoenRef.current?.pause()
      setAudioOn(false)
      return
    }
    const bg = audioRef.current ?? new Audio('/intro_mix.mp3')
    bg.loop = true; bg.volume = 1.0; audioRef.current = bg
    const crowd = crowdRef.current ?? new Audio('/crowd-walla.mp3')
    crowd.loop = true; crowd.volume = 0.1; crowdRef.current = crowd
    const schoen = schoenRef.current ?? new Audio('/schoenberg_red.mp3')
    schoen.loop = true; schoen.volume = 0.3; schoenRef.current = schoen
    bg.play().catch(() => {})
    crowd.play().catch(() => {})
    schoen.play().catch(() => {})
    setAudioOn(true)
  }

  useEffect(() => () => {
    audioRef.current?.pause(); audioRef.current = null
    crowdRef.current?.pause(); crowdRef.current = null
    schoenRef.current?.pause(); schoenRef.current = null
  }, [])

  // After ENTER: the real Moving Images diver — the full three.js scene
  // (video-tile strip cycling diver4 -> diver2, color-invert-on-scroll shader,
  // particle field, glass blur), not a flat video. The ambient bed keeps
  // playing over it.
  if (entered) return <EnteredDiver />
  // ENTER runs inside the tap (a user gesture), so this is where a real
  // Fullscreen request is allowed. Works on Android Chrome; iOS Safari has no
  // Fullscreen API for non-video elements, so it silently no-ops there and we
  // fall back to the 100dvh + viewport-fit=cover edge-to-edge layout. (For true
  // fullscreen on iOS, the page must be added to the Home Screen as a PWA — the
  // apple-mobile-web-app meta tags in index.html already enable that.)
  const onEnter = () => {
    const el = document.documentElement
    el.requestFullscreen?.().catch(() => {})
    setEntered(true)
  }

  return (
    <WelcomeGate
      audioOn={audioOn}
      onToggleAudio={toggleAudio}
      onEnter={onEnter}
    />
  )
}
