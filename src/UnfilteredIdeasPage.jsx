import { useEffect, useRef, useState } from 'react'
import { ENTRIES } from './journalEntries'

const FONT     = "'Helvetica Neue', Helvetica, Arial, sans-serif"
const BG       = '#D9D02F'
const INK      = 'rgba(0,0,0,0.85)'
const INK_DIM  = 'rgba(0,0,0,0.52)'
const INK_RULE = 'rgba(0,0,0,0.18)'

const miniBtn = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  fontFamily: FONT, fontSize: 11, letterSpacing: '0.22em', color: INK_DIM,
}

function todayLabel() {
  const d = new Date()
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

export default function UnfilteredIdeasPage({ onBack }) {
  const scrollRef   = useRef(null)
  const textareaRef = useRef(null)

  const [userEntries, setUserEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem('journal-entries') || '[]') }
    catch { return [] }
  })
  const [composing,   setComposing]   = useState(false)
  const [composeDate, setComposeDate] = useState('')
  const [draft,       setDraft]       = useState('')

  const allEntries = [...ENTRIES, ...userEntries]

  // While journal is open, allow touch scrolling (body has touch-action:none globally)
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = { htmlTA: html.style.touchAction, bodyTA: body.style.touchAction,
                   htmlOF: html.style.overflow,    bodyOF: body.style.overflow }
    html.style.touchAction = 'pan-y'
    body.style.touchAction = 'pan-y'
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.touchAction = prev.htmlTA
      body.style.touchAction = prev.bodyTA
      html.style.overflow    = prev.htmlOF
      body.style.overflow    = prev.bodyOF
    }
  }, [])

  // Open at bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [draft])

  const startCompose = () => {
    setComposeDate(todayLabel())
    setComposing(true)
  }

  const submit = () => {
    if (!draft.trim()) return
    const entry   = { date: composeDate, text: draft.trim() }
    const updated = [...userEntries, entry]
    setUserEntries(updated)
    localStorage.setItem('journal-entries', JSON.stringify(updated))
    setDraft('')
    setComposing(false)
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 50)
  }

  const cancel = () => { setComposing(false); setDraft('') }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') cancel()
  }

  return (
    <>
      <style>{`
        .journal-textarea::placeholder { color: rgba(0,0,0,0.28); }
      `}</style>

      <div
        ref={scrollRef}
        style={{
          position: 'fixed', inset: 0, background: BG,
          overflowY: 'scroll', WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y', fontFamily: FONT,
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '52px 54px 120px' }}>

          <button onClick={onBack} style={{ ...miniBtn, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 52 }}>
            ← BACK
          </button>

          <div style={{
            fontSize: 'clamp(36px, 8vw, 72px)', fontWeight: 700,
            letterSpacing: '-0.01em', color: INK, lineHeight: 1, marginBottom: 12,
          }}>
            UNFILTERED IDEAS
          </div>
          <div style={{
            fontSize: 14, fontWeight: 300, letterSpacing: '0.16em',
            color: INK_DIM, marginBottom: 28,
          }}>
            a journal
          </div>
          <div style={{ height: '0.5px', background: INK_RULE, marginBottom: 72 }} />

          {allEntries.map((entry, i) => (
            <div key={i} style={{ marginBottom: 56 }}>
              <div style={{
                fontSize: 11, fontWeight: 300, letterSpacing: '0.26em',
                color: INK_DIM, marginBottom: 14,
              }}>
                {entry.date}
              </div>
              <div style={{ height: '0.5px', background: INK_RULE, marginBottom: 18 }} />
              <p style={{
                fontSize: 14, fontWeight: 300, letterSpacing: '0.05em',
                lineHeight: 1.9, color: INK, margin: 0,
              }}>
                {entry.text}
              </p>
            </div>
          ))}

          {/* Compose area */}
          {composing ? (
            <div style={{ marginBottom: 56 }}>
              <div style={{
                fontSize: 11, fontWeight: 300, letterSpacing: '0.26em',
                color: INK_DIM, marginBottom: 14,
              }}>
                {composeDate}
              </div>
              <div style={{ height: '0.5px', background: INK_RULE, marginBottom: 18 }} />
              <textarea
                ref={textareaRef}
                className="journal-textarea"
                autoFocus
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="write something..."
                rows={1}
                style={{
                  display: 'block', width: '100%', boxSizing: 'border-box',
                  background: 'none', border: 'none', outline: 'none',
                  resize: 'none', overflow: 'hidden',
                  fontFamily: FONT, fontSize: 14, fontWeight: 300,
                  letterSpacing: '0.05em', lineHeight: 1.9,
                  color: INK, caretColor: INK,
                }}
              />
              <div style={{ display: 'flex', gap: 28, marginTop: 20, alignItems: 'center' }}>
                <button onClick={submit} style={miniBtn}>save</button>
                <button onClick={cancel} style={miniBtn}>cancel</button>
                <span style={{
                  fontSize: 10, letterSpacing: '0.12em', color: 'rgba(0,0,0,0.28)',
                }}>
                  enter to save · shift + enter for new line
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={startCompose}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: FONT, fontSize: 24, lineHeight: 1,
                color: INK_DIM, marginBottom: 56,
              }}
            >
              +
            </button>
          )}

          <div style={{ height: '0.5px', background: INK_RULE, margin: '0 0 32px' }} />
          <button onClick={onBack} style={{ ...miniBtn, display: 'flex', alignItems: 'center', gap: 8 }}>
            ← BACK
          </button>

        </div>
      </div>
    </>
  )
}
