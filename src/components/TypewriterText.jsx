import { useState, useEffect } from 'react'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = e => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return mobile
}

const LINES = ['i build', 'immersive web', 'experiences']
const TOTAL = LINES.reduce((s, l) => s + l.length, 0)
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

export default function TypewriterText({ scene, onSceneChange, onGoHome, audioOn, onToggleAudio }) {
  const [count, setCount] = useState(0)
  const [blink, setBlink] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const mobile = useIsMobile()
  const s = mobile ? 1.15 : 1

  useEffect(() => {
    if (count >= TOTAL) return
    const t = setTimeout(() => setCount(c => c + 1), 70)
    return () => clearTimeout(t)
  }, [count])

  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 530)
    return () => clearInterval(t)
  }, [])

  let rem = count
  const lines = LINES.map(line => {
    const shown = Math.min(rem, line.length)
    rem -= shown
    return line.slice(0, shown)
  })

  let cursor = lines.length - 1
  let r = count
  for (let i = 0; i < LINES.length; i++) {
    if (r <= LINES[i].length) { cursor = i; break }
    r -= LINES[i].length
  }

  const btnStyle = {
    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
    fontFamily: FONT, fontWeight: 300, letterSpacing: '0.16em',
    pointerEvents: 'all',
  }

  return (
    <>
      {/* Collapsed plus tab */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          style={{
            ...btnStyle,
            position: 'fixed', left: 16, top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20, fontSize: 18 * s,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          +
        </button>
      )}

      {/* Main panel */}
      <div style={{
        position: 'fixed',
        left: 48,
        top: '50%',
        transform: `translateY(-50%) translateX(${collapsed ? 'calc(-100% - 64px)' : '0'})`,
        transition: 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 20,
        pointerEvents: 'none',
      }}>
        {/* Home triangle — equilateral, height = font size, 3/4in above text */}
        {onGoHome && (() => {
          const h = 16 * s
          const b = h * 2 / Math.sqrt(3)
          return (
            <button
              onClick={onGoHome}
              style={{
                position: 'absolute',
                top: -(48 + h),
                left: 0,
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                pointerEvents: 'all',
              }}
            >
              <svg width={b} height={h} viewBox={`0 0 ${b} ${h}`} style={{ display: 'block' }}>
                <polygon points={`0,${h} ${b / 2},0 ${b},${h}`} fill="rgba(255,255,255,0.4)" />
              </svg>
            </button>
          )
        })()}
        {/* Typewriter text */}
        <div style={{
          fontFamily: FONT, fontSize: 16 * s, fontWeight: 300,
          letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)',
          lineHeight: 2,
        }}>
          {lines.map((text, i) => (
            <div key={i} style={{ whiteSpace: 'pre' }}>
              {text}
              {i === cursor && <span style={{ opacity: blink ? 1 : 0, marginLeft: 1 }}>|</span>}
            </div>
          ))}
        </div>

        {/* Audio toggle */}
        <button onClick={onToggleAudio} style={{
          ...btnStyle,
          marginTop: 20, fontSize: 10 * s,
          color: audioOn ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
          display: 'block',
        }}>
          {audioOn ? 'audio on' : 'audio off'}
        </button>

        {/* Scene numbers */}
        <div style={{ marginTop: 16, display: 'flex', gap: 16, pointerEvents: 'all', alignItems: 'baseline' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <button key={n} onClick={() => onSceneChange(n)} style={{
              ...btnStyle,
              fontSize: 10 * s,
              color: n === scene ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)',
            }}>
              {n}
            </button>
          ))}
          <a href="https://playground.oswinjournal.com" target="_blank" rel="noreferrer" style={{
            ...btnStyle,
            fontSize: 10 * s,
            color: 'rgba(255,255,255,0.2)',
            textDecoration: 'none',
          }}>
            three
          </a>
        </div>

        {/* Info toggle */}
        <button onClick={() => setInfoOpen(o => !o)} style={{
          ...btnStyle,
          marginTop: 14, fontSize: 9 * s,
          letterSpacing: '0.18em',
          color: infoOpen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
          display: 'block',
        }}>
          info
        </button>

        {/* Info panel */}
        {infoOpen && (
          <div style={{
            marginTop: 10,
            padding: '12px 14px',
            borderRadius: 4,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            fontFamily: FONT, fontSize: 9 * s,
            fontWeight: 300, letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 2.2,
            whiteSpace: 'nowrap',
          }}>
            <div>Video: found footage, sourced online</div>
            <div>Audio: sampled from Lawrence, DJ set 2023</div>
            <div style={{ marginTop: 6 }}>
              <a href="mailto:oswinjournal@gmail.com" style={{ color: 'inherit', textDecoration: 'none', pointerEvents: 'all' }}>
                oswinjournal@gmail.com
              </a>
            </div>
            <div>
              <a href="https://oswinjournal.com" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none', pointerEvents: 'all' }}>
                oswinjournal.com
              </a>
            </div>
          </div>
        )}

        {/* Collapse minus */}
        <button onClick={() => setCollapsed(true)} style={{
          ...btnStyle,
          marginTop: 8, fontSize: 22 * s, lineHeight: 1,
          color: 'rgba(255,255,255,0.4)',
        }}>
          −
        </button>
      </div>
    </>
  )
}
