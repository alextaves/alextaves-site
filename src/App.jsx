import { useState, useEffect, useRef } from 'react'
import VideoDiver6 from './components/VideoDiver6'
import VideoStripWallStreet2 from './components/VideoStripWallStreet2'
import VideoStripPreRaceCrossBlueGlass from './components/VideoStripPreRaceCrossBlueGlass'
import VideoStripHurdlesReverse from './components/VideoStripHurdlesReverse'
import VideoPlayback from './components/VideoPlayback'
import TypewriterText from './components/TypewriterText'

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

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
        backgroundColor: 'rgba(0,26,190,0.80)',
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

export default function App() {
  const [scene, setScene] = useState(1)
  const [phase, setPhase] = useState('carousel') // 'carousel' | 'fading' | 'site'
  const [carouselKey, setCarouselKey] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [audioOn, setAudioOn] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = new Audio('/lawerence_loop.mp3')
    audio.loop = true
    audio.volume = 0.7
    audioRef.current = audio
    return () => { audio.pause(); audio.src = '' }
  }, [])

  const toggleAudio = () => {
    let audio = audioRef.current
    // iOS Safari requires Audio to be created inside a user gesture if it was
    // never successfully unlocked — recreate it here as a fallback
    if (!audio) {
      audio = new Audio('/lawerence_loop.mp3')
      audio.loop = true
      audio.volume = 0.7
      audioRef.current = audio
    }
    if (audioOn) {
      audio.pause()
      setAudioOn(false)
    } else {
      audio.play().then(() => {
        setAudioOn(true)
      }).catch(() => {
        // Recreate and retry once — covers iOS context suspension
        const fresh = new Audio('/lawerence_loop.mp3')
        fresh.loop = true
        fresh.volume = 0.7
        audioRef.current = fresh
        fresh.play().then(() => setAudioOn(true)).catch(() => {})
      })
    }
  }

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data === 'diverClick' && phase === 'carousel') {
        setPhase('fading')
        setTimeout(() => setPhase('site'), 700)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [phase])

  useEffect(() => {
    if (phase !== 'carousel') return
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

  return (
    <>
      {phase !== 'site' && (
        <iframe
          key={carouselKey}
          src="/detroit_dark.html"
          style={{
            position: 'fixed', inset: 0, width: '100%', height: '100%',
            border: 'none', zIndex: 10,
            opacity: phase === 'fading' ? 0 : 1,
            transition: 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: phase === 'fading' ? 'none' : 'auto',
          }}
        />
      )}
      {phase === 'site' && (
        <>
          {scene === 1 && <VideoDiver6 />}
          {scene === 2 && <VideoStripWallStreet2 />}
          {scene === 3 && <VideoStripPreRaceCrossBlueGlass />}
          {scene === 4 && <VideoStripHurdlesReverse />}
          {scene === 5 && <VideoPlayback />}
          <TypewriterText scene={scene} onSceneChange={setScene} onGoHome={goHome} audioOn={audioOn} onToggleAudio={toggleAudio} />
          <SceneHint scene={scene} />
          <FullscreenButton />
          <InstallPrompt />
        </>
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
