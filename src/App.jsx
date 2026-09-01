import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import VideoDiver6 from './components/VideoDiver6'
import VideoStripWallStreet2 from './components/VideoStripWallStreet2'
import VideoStripPreRaceCrossBlueGlass from './components/VideoStripPreRaceCrossBlueGlass'
import VideoStripHurdlesReverse from './components/VideoStripHurdlesReverse'
import VideoPlayback from './components/VideoPlayback'
import WaterMarquee from './components/WaterMarquee'
import TypewriterText from './components/TypewriterText'
import UnfilteredIdeasPage from './UnfilteredIdeasPage'
import { setPianoAudioEnabled, startDragging, stopDragging, onSwellChange, FADE_IN_S, FADE_OUT_S } from './schoenbergPiano'

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// Background track (intro_mix.mp3) volume swell, mirroring the schoenberg
// piano's own idle/active levels so both rise and fall together on scroll/drag.
// NB: intro_mix.mp3 was normalized +25dB (was a very quiet -45.6 LUFS render,
// now -20.8) so the mobile gate could actually hear it. These desktop levels
// are pulled down ~25dB (x0.056) to keep the original desktop balance against
// the piano/crowd. Old values were 0.85 / 1.0 against the un-boosted file.
const BG_IDLE_VOL   = 0.05
const BG_ACTIVE_VOL = 0.06

// Crowd walla (crowd-walla.mp3, from oswin-redo) — always faintly present as an
// ambient bed while audio is on, then swells up whenever a ring is being
// dragged/scrolled, riding the same onSwellChange signal as everything else.
const CROWD_IDLE_VOL   = 0.06
const CROWD_ACTIVE_VOL = 0.3

function rampAudioVolume(audio, target, seconds) {
  cancelAnimationFrame(audio._rampRaf)
  const start = audio.volume
  const startTime = performance.now()
  const duration = seconds * 1000
  const step = (now) => {
    const t = Math.min(1, (now - startTime) / duration)
    // Clamp — float error can nudge this a hair outside [0,1] (e.g. when
    // fading to exactly 0), which HTMLMediaElement.volume rejects by throwing.
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * t))
    if (t < 1) audio._rampRaf = requestAnimationFrame(step)
  }
  audio._rampRaf = requestAnimationFrame(step)
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.navigator.standalone
    if (ios && !standalone) { setIsIOS(true); setShow(true) }

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    deferredPrompt.userChoice.then(() => { setDeferredPrompt(null); setShow(false) })
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 64, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, fontFamily: FONT, fontSize: 10, letterSpacing: '0.14em',
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '10px 16px', borderRadius: 4,
      color: 'rgba(255,255,255,0.5)',
      display: 'flex', alignItems: 'center', gap: 14,
      whiteSpace: 'nowrap',
    }}>
      <span>{isIOS ? 'tap share → add to home screen' : 'add to home screen'}</span>
      {!isIOS && (
        <button onClick={handleInstall} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: FONT, fontSize: 10, letterSpacing: '0.14em',
          color: 'rgba(255,255,255,0.85)', padding: 0,
        }}>install</button>
      )}
      <button onClick={handleDismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: FONT, fontSize: 16, color: 'rgba(255,255,255,0.3)', padding: 0, lineHeight: 1,
      }}>×</button>
    </div>
  )
}

const HINTS = {
  1: null,
  2: 'scroll to change speed',
  3: '← brown · green → · ↑↓ b&w',
  4: '↑ forward · ↓ reverse',
  5: 'scroll up to speed up · scroll down to slow down',
}

function SceneHint({ scene }) {
  const [visible, setVisible] = useState(false)
  const hint = HINTS[scene]

  useEffect(() => {
    if (!hint) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(t)
  }, [scene, hint])

  if (!hint) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.25)', pointerEvents: 'none', zIndex: 20,
      transition: 'opacity 0.8s ease',
      opacity: visible ? 1 : 0,
    }}>
      {hint}
    </div>
  )
}

function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)
  const isMobile = window.matchMedia('(pointer: coarse)').matches

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  if (isMobile) return null
  return (
    <button onClick={toggle} style={{
      position: 'fixed', top: 24, right: 24, zIndex: 30,
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      color: 'rgba(255,255,255,0.25)',
      lineHeight: 1,
    }}>
      {isFs ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M5 1H1v4h1V2h3V1zM11 1v1h3v3h1V1h-4zM1 11v4h4v-1H2v-3H1zM14 14h-3v1h4v-4h-1v3z"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 1h4V0H0v5h1V1zM11 0v1h4v4h1V0h-5zM0 11v5h5v-1H1v-4H0zM15 11h-1v4h-4v1h5v-5z"/>
        </svg>
      )}
    </button>
  )
}

function BackButton({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'fixed', top: 24, left: 24, zIndex: 30,
      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
      fontFamily: FONT, fontSize: 11, letterSpacing: '0.22em',
      color: 'rgba(255,255,255,0.4)',
    }}>
      ← BACK
    </button>
  )
}

const INTRO_TEXT = 'This site is meant to be heard'

function IntroOverlay({ audioOn, onToggleAudio, onDismiss }) {
  const [count, setCount] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (count >= INTRO_TEXT.length) return
    const t = setTimeout(() => setCount(c => c + 1), 65)
    return () => clearTimeout(t)
  }, [count])

  const dismiss = () => {
    setFading(true)
    setTimeout(onDismiss, 700)
  }

  const handleToggle = (e) => {
    e.stopPropagation()
    onToggleAudio()
  }

  const textDone = count >= INTRO_TEXT.length

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 30,
        backgroundColor: 'rgba(0,26,190,1)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ position: 'absolute', top: 48, left: 48 }}>
        <div style={{
          fontFamily: FONT, fontSize: 14, fontWeight: 300,
          letterSpacing: '0.16em', color: 'rgba(255,255,255,0.88)',
          marginBottom: 28, whiteSpace: 'nowrap',
        }}>
          {INTRO_TEXT.slice(0, count)}
        </div>

        <div style={{
          opacity: textDone ? 1 : 0,
          transition: 'opacity 0.5s',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Disclaimer */}
          <div style={{
            fontFamily: FONT, fontSize: 9, fontWeight: 300,
            letterSpacing: '0.13em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.28)', maxWidth: 320, lineHeight: 1.7,
          }}>
            Site under construction — please enjoy and come back often as this is a continuing project
          </div>

          {/* Pill toggle */}
          <div
            onClick={handleToggle}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
          >
            <div style={{
              width: 64, height: 20, borderRadius: 10, position: 'relative', flexShrink: 0,
              backgroundColor: audioOn ? '#34C759' : 'rgba(255,255,255,0.22)',
              transition: 'background-color 0.3s',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
            }}>
              <div style={{
                position: 'absolute',
                top: 2, left: audioOn ? 44 : 2,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <span style={{
              fontFamily: FONT, fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
            }}>
              audio {audioOn ? 'on' : 'off'}
            </span>
          </div>

          {/* Controls hint */}
          <div style={{
            fontFamily: FONT, fontSize: 9, fontWeight: 300,
            letterSpacing: '0.13em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.18)', lineHeight: 1.7,
          }}>
            ← → arrow keys · space · scroll · touch
          </div>

          {/* Enter */}
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: FONT, fontSize: 10, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
              textAlign: 'left',
            }}
          >
            enter
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Portal transition overlay — cross-fade through yellow ─────────────────────
function TransitionOverlay({ phase }) {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setActive(true)))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (phase === 'revealing') setActive(false)
  }, [phase])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 25,
      background: '#D9D02F', pointerEvents: 'none',
      opacity: active ? 1 : 0,
      transition: phase === 'covering' ? 'opacity 380ms ease' : 'opacity 320ms ease',
    }} />
  )
}

export default function App() {
  const COVER_MS  = 400
  const REVEAL_MS = 360

  const [scene, setScene] = useState(1)
  const [phase, setPhase] = useState('carousel') // 'carousel' | 'fading' | 'site' | 'journal' | 'fiction' | 'hum' | 'detroit' | 'detroitRemix' | 'detroitNine' | 'detroitGrid' | 'detroitBlue' | 'detroitFlood' | 'detroitBlack' | 'detroitHalves' | 'detroitFaces' | 'detroitCamo' | 'detroitOneFace' | 'detroitBlueGround' | 'detroitChunky' | 'detroitOnBlack' | 'detroitShuffle' | 'detroitRun' | 'detroitRunBlack' | 'detroitRunBlue' | 'detroitRunWhite' | 'detroitRunFiner' | 'detroitBoxes' | 'detroitCityscape' | 'detroitOnePoint' | 'detroitDragPoint' | 'detroitDetail' | 'detroitQuarter' | 'detroitDouble' | 'detroitHalfDrift' | 'detroitWheel' | 'detroitOpenWheel' | 'detroitDeadOn' | 'detroitBlades' | 'detroitWhiteDepth' | 'bsides' | 'postcards'
  const [tPhase, setTPhase] = useState('idle')   // 'idle' | 'covering' | 'revealing'
  const [carouselKey, setCarouselKey] = useState(0)
  const [showIntro, setShowIntro] = useState(false)   // entry is now the WELCOME portal in the carousel
  const [audioOn, setAudioOn] = useState(false)
  const audioRef = useRef(null)
  const crowdRef = useRef(null)
  const transitioning = useRef(false)
  // Whether the WELCOME entry has been begun this page-load. Lives in a ref (not
  // sessionStorage) so it resets on a full refresh — the entry shows again — but
  // persists across in-app portal returns that re-mount the carousel iframe.
  const begunRef = useRef(false)

  const doTransition = useCallback((to) => {
    if (transitioning.current) return
    transitioning.current = true
    setTPhase('covering')
    setTimeout(() => {
      if (to === 'carousel') setCarouselKey(k => k + 1)
      setPhase(to)
      setTPhase('revealing')
      setTimeout(() => {
        setTPhase('idle')
        transitioning.current = false
      }, REVEAL_MS)
    }, COVER_MS)
  }, [])

  useEffect(() => {
    const audio = new Audio('/intro_mix.mp3')
    audio.loop = true
    audio.volume = BG_IDLE_VOL
    audioRef.current = audio

    const crowd = new Audio('/crowd-walla.mp3')
    crowd.loop = true
    crowd.volume = CROWD_IDLE_VOL
    crowdRef.current = crowd

    return () => { audio.pause(); audio.src = ''; crowd.pause(); crowd.src = '' }
  }, [])

  // The audio toggle (WELCOME ON/OFF and the in-site button) is a single
  // source of truth: it just flips audioOn, and the effect below starts or
  // stops all three ambient layers together.
  const toggleAudio = () => setAudioOn((on) => !on)

  // One clean toggle for the whole ambient bed. intro_mix, the crowd, and the
  // Tone.js piano all start and stop off this single audioOn flag — fading in
  // together on ON and out together on OFF — instead of each reacting on its
  // own (which made OFF leave the piano ringing while the crowd hard-cut, and
  // kept intro_mix silent until Begin). audioOn only ever flips true from
  // inside a user gesture, so the HTMLAudio play() calls stay unlocked.
  useEffect(() => {
    const bg = audioRef.current
    const crowd = crowdRef.current
    setPianoAudioEnabled(audioOn)
    if (audioOn) {
      if (bg)    { bg.play().catch(() => {});    rampAudioVolume(bg, BG_IDLE_VOL, FADE_IN_S) }
      if (crowd) { crowd.play().catch(() => {}); rampAudioVolume(crowd, CROWD_IDLE_VOL, FADE_IN_S) }
    } else {
      if (bg)    rampAudioVolume(bg, 0, FADE_OUT_S)
      if (crowd) rampAudioVolume(crowd, 0, FADE_OUT_S)
      // Fade to silence first, then pause — so OFF is one smooth fade-out
      // (matching the piano's own fade) rather than a hard cut.
      const t = setTimeout(() => { bg?.pause(); crowd?.pause() }, FADE_OUT_S * 1000)
      return () => clearTimeout(t)
    }
  }, [audioOn])

  // Background track rises and falls in lockstep with the piano's own
  // drag/scroll swell (schoenbergPiano notifies on every start/stop).
  useEffect(() => {
    return onSwellChange((active) => {
      const audio = audioRef.current
      if (audio) rampAudioVolume(audio, active ? BG_ACTIVE_VOL : BG_IDLE_VOL, active ? FADE_IN_S : FADE_OUT_S)
      const crowd = crowdRef.current
      if (crowd) rampAudioVolume(crowd, active ? CROWD_ACTIVE_VOL : CROWD_IDLE_VOL, active ? FADE_IN_S : FADE_OUT_S)
    })
  }, [])

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data === 'diverClick' && phase === 'carousel') {
        setPhase('fading')
        setTimeout(() => setPhase('site'), 700)
      }
      if (e.data && typeof e.data === 'object' && e.data.type === 'portalClick' && phase === 'carousel') {
        if (e.data.idx === 6) doTransition('journal')
        if (e.data.idx === 3) doTransition('fiction')
        if (e.data.idx === 7) doTransition('detroit')
        if (e.data.idx === 8) doTransition('postcards')
        if (e.data.idx === 9) doTransition('bsides')
        if (e.data.idx === 1) { setPhase('fading'); setTimeout(() => setPhase('site'), 700) }
      }
      // The Detroit ring is the same portals file with ?ring=detroit, so its
      // clicks arrive as portalClick too — the ring tag is what separates them
      // from the home ring's, whose indices they would otherwise collide with.
      if (e.data && typeof e.data === 'object' && e.data.type === 'portalClick'
          && e.data.ring === 'detroit' && phase === 'detroit') {
        const to = ['detroitFaces', 'detroitRemix', 'detroitNine', 'detroitGrid',
                    'detroitBlue', 'detroitFlood', 'detroitBlack', 'detroitHalves',
                    'detroitCamo', 'detroitOneFace', 'detroitBlueGround', 'detroitChunky', 'detroitOnBlack', 'detroitShuffle', 'detroitRun', 'detroitRunBlack', 'detroitRunBlue', 'detroitRunWhite', 'detroitRunFiner', 'detroitBoxes', 'detroitCityscape', 'detroitOnePoint', 'detroitDragPoint', 'detroitDetail', 'detroitQuarter', 'detroitDouble', 'detroitHalfDrift', 'detroitWheel', 'detroitOpenWheel', 'detroitDeadOn', 'detroitBlades', 'detroitWhiteDepth'][e.data.idx]
        if (to) doTransition(to)
      }
      if (e.data && typeof e.data === 'object' && e.data.type === 'portalClick' && phase === 'fiction') {
        if (e.data.idx === 0) doTransition('hum')
      }
      // WELCOME entry portal (in the carousel iframe): audio preference + Begin.
      if (e.data && typeof e.data === 'object' && e.data.type === 'welcomeAudio') {
        setAudioOn(e.data.on)
      }
      if (e.data && typeof e.data === 'object' && e.data.type === 'welcomeBegin') {
        begunRef.current = true   // skip the entry on in-app portal returns (not on full reload)
        setAudioOn(e.data.on)     // the audioOn effect starts/stops all three layers
      }
      // Any ring (main carousel, fiction, detroit) reports its own drag
      // state — the piano itself lives here, one continuous layer, so it
      // stays fluid across page/phase transitions instead of restarting.
      if (e.data && typeof e.data === 'object' && e.data.type === 'ringDrag') {
        if (e.data.dragging) startDragging()
        else stopDragging()
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [phase, doTransition])

  useEffect(() => {
    // Every iframe experience listens for both native keydown (needs iframe
    // focus) and a forwarded postMessage. The parent holds focus after a SPA
    // transition, so we must forward for ALL iframe phases — not just carousel
    // and fiction — or arrow keys silently do nothing in detroit/postcards/hum.
    const IFRAME_PHASES = new Set(['carousel', 'fiction', 'hum', 'detroit', 'detroitRemix', 'detroitNine', 'detroitGrid', 'detroitBlue', 'detroitFlood', 'detroitBlack', 'detroitHalves', 'detroitFaces', 'detroitCamo', 'detroitOneFace', 'detroitBlueGround', 'detroitChunky', 'detroitOnBlack', 'detroitShuffle', 'detroitRun', 'detroitRunBlack', 'detroitRunBlue', 'detroitRunWhite', 'detroitRunFiner', 'detroitBoxes', 'detroitCityscape', 'detroitOnePoint', 'detroitDragPoint', 'detroitDetail', 'detroitQuarter', 'detroitDouble', 'detroitHalfDrift', 'detroitWheel', 'detroitOpenWheel', 'detroitDeadOn', 'detroitBlades', 'detroitWhiteDepth', 'bsides', 'postcards'])
    if (!IFRAME_PHASES.has(phase)) return
    const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '])
    const onKey = (e) => {
      if (!ARROWS.has(e.key)) return
      e.preventDefault()
      const iframe = document.querySelector('iframe')
      iframe?.contentWindow?.postMessage({ type: 'key', key: e.key }, '*')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const goHome = () => {
    setCarouselKey(k => k + 1)
    setPhase('carousel')
  }

  // Recomputed only when the carousel actually re-mounts (carouselKey bump), so
  // pressing Begin — which flips begunRef and re-renders — doesn't reload the
  // iframe. A portal return bumps carouselKey and picks up ?begun=1 (skip entry);
  // a full page reload resets begunRef so the entry shows again.
  const carouselSrc = useMemo(
    () => `/portals.html${begunRef.current ? '?begun=1' : ''}`,
    [carouselKey]
  )

  return (
    <>
      {(phase === 'carousel' || phase === 'fading') && (
        <iframe
          key={carouselKey}
          src={carouselSrc}
          style={{
            position: 'fixed', inset: 0, width: '100%', height: '100%',
            border: 'none', zIndex: 10,
            opacity: phase === 'fading' ? 0 : 1,
            transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: phase === 'fading' ? 'none' : 'auto',
          }}
        />
      )}
      {phase === 'journal' && (
        <UnfilteredIdeasPage onBack={() => doTransition('carousel')} />
      )}
      {phase === 'fiction' && (
        <>
          <iframe
            src="/portals_fiction.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('carousel')} />
        </>
      )}
      {phase === 'hum' && (
        <>
          <iframe
            src="/portals_exp.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('fiction')} />
        </>
      )}
      {phase === 'detroit' && (
        <>
          <iframe
            src="/portals.html?ring=detroit"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('carousel')} />
        </>
      )}
      {phase === 'bsides' && (
        <>
          <iframe
            src="/detroit_index.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('carousel')} />
        </>
      )}
      {phase === 'detroitWhiteDepth' && (
        <>
          <iframe
            src="/detroit_remix_31.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitBlades' && (
        <>
          <iframe
            src="/detroit_remix_30.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitDeadOn' && (
        <>
          <iframe
            src="/detroit_remix_29.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitOpenWheel' && (
        <>
          <iframe
            src="/detroit_remix_28.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitWheel' && (
        <>
          <iframe
            src="/detroit_remix_27.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitHalfDrift' && (
        <>
          <iframe
            src="/detroit_remix_26.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitDouble' && (
        <>
          <iframe
            src="/detroit_remix_25.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitQuarter' && (
        <>
          <iframe
            src="/detroit_remix_24.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitDetail' && (
        <>
          <iframe
            src="/detroit_remix_23.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitDragPoint' && (
        <>
          <iframe
            src="/detroit_remix_22.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitOnePoint' && (
        <>
          <iframe
            src="/detroit_remix_21.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitCityscape' && (
        <>
          <iframe
            src="/detroit_remix_20.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitBoxes' && (
        <>
          <iframe
            src="/detroit_remix_19.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRunFiner' && (
        <>
          <iframe
            src="/detroit_remix_18.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRunWhite' && (
        <>
          <iframe
            src="/detroit_remix_17.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRunBlue' && (
        <>
          <iframe
            src="/detroit_remix_16.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRunBlack' && (
        <>
          <iframe
            src="/detroit_remix_15.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRun' && (
        <>
          <iframe
            src="/detroit_remix_14.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitShuffle' && (
        <>
          <iframe
            src="/detroit_remix_13.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitOnBlack' && (
        <>
          <iframe
            src="/detroit_remix_12.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitChunky' && (
        <>
          <iframe
            src="/detroit_remix_11.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitBlueGround' && (
        <>
          <iframe
            src="/detroit_remix_10.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitOneFace' && (
        <>
          <iframe
            src="/detroit_remix_9.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitCamo' && (
        <>
          <iframe
            src="/detroit_remix_8.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitFaces' && (
        <>
          <iframe
            src="/detroit_dark.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitRemix' && (
        <>
          <iframe
            src="/detroit_remix.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitNine' && (
        <>
          <iframe
            src="/detroit_remix_2.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitGrid' && (
        <>
          <iframe
            src="/detroit_remix_3.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitBlue' && (
        <>
          <iframe
            src="/detroit_remix_4.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitFlood' && (
        <>
          <iframe
            src="/detroit_remix_5.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'detroitBlack' && (
        <>
          <iframe
            src="/detroit_remix_6.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}

      {phase === 'detroitHalves' && (
        <>
          <iframe
            src="/detroit_remix_7.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('detroit')} />
        </>
      )}
      {phase === 'postcards' && (
        <>
          <iframe
            src="/postcards.html"
            style={{
              position: 'fixed', inset: 0, width: '100%', height: '100%',
              border: 'none', zIndex: 10,
            }}
          />
          <BackButton onClick={() => doTransition('carousel')} />
        </>
      )}
      {phase === 'site' && (
        <>
          {scene === 1 && <VideoDiver6 />}
          {scene === 2 && <VideoStripWallStreet2 />}
          {scene === 3 && <VideoStripPreRaceCrossBlueGlass />}
          {scene === 4 && <VideoStripHurdlesReverse />}
          {scene === 5 && <VideoPlayback />}
          {scene === 6 && <WaterMarquee controls={false} />}
          <TypewriterText scene={scene} onSceneChange={setScene} onGoHome={goHome} audioOn={audioOn} onToggleAudio={toggleAudio} />
          <SceneHint scene={scene} />
          <InstallPrompt />
        </>
      )}
      {!showIntro && <FullscreenButton />}
      {tPhase !== 'idle' && (
        <TransitionOverlay phase={tPhase} />
      )}
      {showIntro && (
        <IntroOverlay
          audioOn={audioOn}
          onToggleAudio={toggleAudio}
          onDismiss={() => setShowIntro(false)}
        />
      )}
    </>
  )
}
