import { useEffect, useRef, useState } from 'react'

// The phone version of the ring. The desktop carousel is a WebGL scene you spin;
// there is no good phone equivalent of that, so the same cards are laid out flat
// as a two-column grid you scroll — but built to still read as objects: each one
// sits on its own shadow with a lit top edge and a faint sheen across the glass,
// so it looks raised off the ground rather than printed on it.
//
// The faces are DOM, not the canvas textures the ring draws. A 600x800 card
// texture scaled into a ~180px column would land its 14px subtitle at about 4px;
// as type it holds at any pixel ratio, and the metrics below are the canvas
// design expressed in container-query units so the proportions still match.

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

// The ring shrinks a title until it fits (titleLayout in public/portals.html):
// 74px, stepping down, wrapping to at most three lines. CSS has no
// shrink-to-fit, and at a flat ratio COMMISSIONS runs off the edge of its card.
// So the same loop runs once against the same 600x800 design, and the result is
// converted to container-query units — the phone titles then break and scale
// exactly where the desktop cards do.
const DESIGN_W = 600, DESIGN_MARGIN = 54
// `given` forces the break-up — OSWIN JOURNAL falls onto two lines on its own,
// and the cards that don't are broken by hand (with a hyphen where there is no
// space to break at) so every title in the grid is two lines at one size.
function fitTitle(title, given) {
  const ctx = document.createElement('canvas').getContext('2d')
  const maxW = DESIGN_W - DESIGN_MARGIN * 2
  let size = 74, lines = given ?? [title]
  for (; size >= 24; size -= 2) {
    ctx.font = `700 ${size}px ${FONT}`
    ctx.letterSpacing = '-0.01em'
    if (!given) {
      lines = []
      let line = ''
      for (const w of title.split(' ')) {
        const test = line ? line + ' ' + w : w
        if (line && ctx.measureText(test).width > maxW) { lines.push(line); line = w }
        else line = test
      }
      if (line) lines.push(line)
    }
    if (lines.length <= 3 && Math.max(...lines.map(l => ctx.measureText(l).width)) <= maxW) break
  }
  return { cqw: (size / DESIGN_W) * 100, lines }
}

// Source of truth for this copy is PORTALS in public/portals.html — that file is
// raw HTML in an iframe and cannot import from here, so the wording is repeated.
// If the bio changes there, change it here.
const ALEX_BIO = [
  "Alex Taves builds rooms on the internet, part of what he calls the Slow Web, and his gut says the web is only beginning. He started in fashion, twelve years as art director to Joseph Mimran, then got pulled into the art world and opened a gallery in Hamilton, Ontario. It took off, earned a nod from The New York Times, then crashed. The crash mattered: it opened a whole new world. Out of desperation he learned to code, and React, the framework Netflix runs on, became an obsession. It seemed wildly untapped as a medium for art.",
  "Canadian by birth, Melburnian by choice. His goal is to bridge art and the net. To Alex, platforms like Instagram already feel dated. It's time to evolve into the humans we could be: not desperate for likes, not dictated to by an algorithm.",
]

// Same joke enquiry the desktop card types out, and the same cadence — one
// character every 32.5ms, a ten-second hold once it lands, then from the top.
// Duplicated from public/portals.html for the reason ALEX_BIO is; keep in step.
const ENQUIRY_SAMPLE_MESSAGE = "Hey! I came across your work during a mandatory rest period aboard the International Space Station (ISS). Downlink is slow up here so your site took forty minutes to load, which honestly added to the experience. Everyone here is glued to the window, but I'm fixated on your site. I have a thing for carousels, I guess. I feel your 3D carousel could really elevate the NASA homepage. Pluto gets its own screen, its own facts, maybe a little ambient hum. It deserves that after everything. I have no authority to commission anything. I'm just an astronaut. Budget: I can get you a moon rock, or a button from our ship. Best, Tony"
const ENQUIRY_CHAR_MS = 32.5
const ENQUIRY_HOLD_MS = 10000

// Its own component so the 30-times-a-second tick re-renders this card's text
// and nothing else in the grid.
function EnquiryPreview() {
  // Reduced motion gets the finished message rather than no message.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [count, setCount] = useState(() => (reduced ? ENQUIRY_SAMPLE_MESSAGE.length : 0))

  useEffect(() => {
    if (reduced) return
    let hold = null
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= ENQUIRY_SAMPLE_MESSAGE.length) {
          if (!hold) hold = setTimeout(() => { hold = null; setCount(0) }, ENQUIRY_HOLD_MS)
          return c
        }
        return c + 1
      })
    }, ENQUIRY_CHAR_MS)
    return () => { clearInterval(id); clearTimeout(hold) }
  }, [reduced])

  return (
    <div className="mg-enquiry">
      <span className="mg-enquiryLabel">message</span>
      <p className="mg-enquiryMsg">{ENQUIRY_SAMPLE_MESSAGE.slice(0, count)}</p>
      <span className="mg-enquiryLabel mg-enquirySubmit">submit</span>
    </div>
  )
}

// Grid order follows the mock rather than the ring's own order: the three Oswin
// rooms lead, then Alex, then the two that ask something of you.
const CARDS = [
  { id: 'journal',  kind: 'circle', title: 'OSWIN JOURNAL', sub: 'exploration of sound and image', bg: '#FFFFFF' },
  { id: 'gallery',  kind: 'circle', title: 'OSWIN GALLERY', sub: 'wip',                            bg: '#FFFFFF' },
  { id: 'records',  kind: 'circle', title: 'OSWIN RECORDS', sub: 'wip',                            bg: '#FFFFFF' },
  { id: 'alex',     kind: 'photo',  title: 'ALEX TAVES',    sub: 'a bit about me',                 bg: '#FFFFFF',
    lines: ['ALEX', 'TAVES'] },
  { id: 'reel',     kind: 'video',  title: 'COMMISSIONS',   sub: 'the previous alextaves.com',     bg: '#0B0B0B', titleColor: '#D8FF14',
    lines: ['COMMIS-', 'SIONS'] },     // com·mis·sions
  { id: 'enquiries',kind: 'form',   title: 'ENQUIRIES',     sub: 'get in touch · looking for like minded', bg: '#00C2A8' },
]

// feTurbulence, tiled — the phone equivalent of the ring's pooled noise frames.
// Stepping background-position through a handful of offsets reads as snow for
// the cost of a compositor transform, where redrawing a canvas per frame here
// would mean six live canvases on a phone.
const NOISE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='120' height='120' filter='url(%23n)'/></svg>\")"

const css = `
.mg-wrap {
  position: fixed; inset: 0;
  background: #0c0806;
  overflow-y: auto; overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  /* index.css pins touch-action:none globally for the WebGL rings; the grid is
     the one view that has to scroll. */
  touch-action: pan-y;
  /* index.html ships viewport-fit=cover with a black-translucent status bar, so
     installed to the home screen this view runs edge to edge — under the clock
     and the battery, and under the notch or Dynamic Island in landscape. Inset
     on all four sides so nothing lands beneath any of it. In an ordinary
     browser tab every inset resolves to 0 and this is just the 10px gutter. */
  padding:
    calc(10px + env(safe-area-inset-top))
    calc(10px + env(safe-area-inset-right))
    calc(10px + env(safe-area-inset-bottom))
    calc(10px + env(safe-area-inset-left));
  font-family: ${FONT};
}
.mg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.mg-card {
  container-type: inline-size;
  position: relative;
  aspect-ratio: 3 / 4;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  /* Raised, not floating: a lit top lip and shaded bottom lip give the face a
     thickness, a short hard shadow sits it on the ground, and the long soft one
     lifts it off. */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(0, 0, 0, 0.30),
    0 2px 3px rgba(0, 0, 0, 0.55),
    0 10px 22px rgba(0, 0, 0, 0.50);
  transition: transform 200ms ease, box-shadow 200ms ease;
}
/* The glass itself: a sheen raked across the top-left corner, well under the
   point where it would start looking like a gloss filter. */
.mg-card::after {
  content: '';
  position: absolute; inset: 0; z-index: 3;
  background: linear-gradient(158deg,
    rgba(255, 255, 255, 0.17) 0%,
    rgba(255, 255, 255, 0.05) 24%,
    rgba(255, 255, 255, 0) 48%);
  pointer-events: none;
}
.mg-card:active {
  transform: translateY(2px) scale(0.988);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    inset 0 -1px 0 rgba(0, 0, 0, 0.30),
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 4px 10px rgba(0, 0, 0, 0.45);
}

.mg-face { position: absolute; inset: 0; z-index: 0; }
.mg-head { position: relative; z-index: 2; padding: 9cqw 9cqw 0; }

/* 74px title and 14px sub on a 600px-wide card face, kept as ratios. */
.mg-title {
  margin: 0;
  font-weight: 700;
  line-height: 1.0;              /* font-size is measured per card, see fitTitle */
  letter-spacing: -0.01em;
}
.mg-title span { display: block; }
.mg-rule { height: 1px; margin: 2.2cqw 0 2cqw; }
.mg-sub {
  margin: 0;
  font-weight: 300;
  /* The true ratio lands under 5px on a phone column, so it is floored at a
     size that still reads. */
  font-size: max(7.5px, 2.33cqw);
  letter-spacing: 0.16em;
  line-height: 1.35;
}

.mg-circle {
  position: absolute; left: 50%; top: 36%;
  width: 78cqw; height: 78cqw;
  transform: translateX(-50%);
  border-radius: 50%;
  background: #000;
  z-index: 1;
}

.mg-photo {
  position: absolute; inset: 0; z-index: 0;
  background: url('/images/alexander.png') center / cover no-repeat;
  filter: grayscale(1) contrast(1.2) brightness(0.95);
}
.mg-scrim {
  position: absolute; left: 0; right: 0; top: 0; height: 50%;
  z-index: 1;
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0));
}
.mg-static {
  position: absolute; inset: 0; z-index: 2;
  background-image: ${NOISE}, repeating-linear-gradient(rgba(0,0,0,0.16) 0 1px, rgba(0,0,0,0) 1px 3px);
  background-size: 120px 120px, 100% 3px;
  opacity: 0.30;
  pointer-events: none;
  animation: mgStatic 0.32s steps(1) infinite;
}
@keyframes mgStatic {
  0%   { background-position: 0 0, 0 0; }
  25%  { background-position: 37px 61px, 0 0; }
  50%  { background-position: 83px 19px, 0 0; }
  75%  { background-position: 15px 94px, 0 0; }
  100% { background-position: 61px 43px, 0 0; }
}

/* The bio does not fit the card. Set inside a ~180px column it lands at 8px and
   still overruns the face by a third — so tapping the portrait opens it as a
   sheet, the same move the enquiry form makes, at a size meant for reading. */
.mg-bio p {
  margin: 0 0 1.1em;
  font-weight: 300;
  font-size: 15px;
  line-height: 1.62;
  color: rgba(0, 0, 0, 0.82);
}

.mg-video { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; object-fit: cover; }
.mg-videoScrim {
  position: absolute; left: 0; right: 0; top: 0; height: 46%;
  z-index: 1;
  background: linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0));
}

/* One-line header on this card, so the preview starts higher than the two-line
   cards would need. Ratios follow the desktop face: label, message, submit. */
.mg-enquiry {
  position: absolute; inset: 0; z-index: 1;
  padding: 36cqw 9cqw 9cqw;
  display: flex; flex-direction: column;
}
.mg-enquiryLabel {
  display: block;
  font-weight: 300;
  font-size: max(7px, 2.33cqw);
  letter-spacing: 0.16em;
  color: rgba(0, 0, 0, 0.5);
}
.mg-enquiryMsg {
  margin: 3cqw 0 0;
  /* The message outgrows a card this size, and is not meant to be read here —
     it is the card showing someone mid-sentence. So it takes whatever room is
     left between label and submit and the tail runs past, faded out rather than
     sliced, which would read as a clipping bug. */
  flex: 1; min-height: 0;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, #000 78%, transparent 100%);
  font-weight: 300;
  font-size: max(6.5px, 2.17cqw);
  line-height: 1.55;
  letter-spacing: 0;
  color: rgba(0, 0, 0, 0.58);
}
.mg-enquirySubmit { margin-top: auto; }

/* ── Reel, full screen ─────────────────────────────────────────────────────── */
.mg-reel { position: fixed; inset: 0; z-index: 60; background: #000; }
.mg-reel video { width: 100%; height: 100%; object-fit: contain; background: #000; }
.mg-reelBar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 61;
  height: calc(108px + env(safe-area-inset-top));
  padding:
    calc(18px + env(safe-area-inset-top))
    calc(20px + env(safe-area-inset-right))
    0
    calc(20px + env(safe-area-inset-left));
  display: flex; align-items: flex-start; justify-content: space-between;
  /* Same scrim the desktop reel needed: the showreel runs from near-black to
     full-bleed yellow and plain white vanishes on the bright frames. */
  background: linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
  pointer-events: none;
}
.mg-reelBar button {
  pointer-events: auto;
  background: none; border: none; padding: 0;
  font-family: ${FONT};
  color: rgba(255, 255, 255, 0.75);
}
.mg-reelEnq { font-size: 11px; letter-spacing: 0.22em; }
.mg-reelClose { font-size: 20px; line-height: 1; }

/* ── Enquiry sheet ─────────────────────────────────────────────────────────── */
.mg-sheet {
  position: fixed; inset: 0; z-index: 60;
  background: #00C2A8;
  overflow-y: auto; touch-action: pan-y;
  padding:
    calc(28px + env(safe-area-inset-top))
    calc(24px + env(safe-area-inset-right))
    calc(28px + env(safe-area-inset-bottom))
    calc(24px + env(safe-area-inset-left));
  font-family: ${FONT}; color: #000;
}
.mg-sheet h2 { margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.01em; }
.mg-sheet .mg-sheetSub {
  margin: 10px 0 30px;
  font-size: 10px; font-weight: 300; letter-spacing: 0.16em;
  color: rgba(0, 0, 0, 0.5); text-transform: uppercase;
}
.mg-sheet label {
  display: block; margin-bottom: 22px;
  font-size: 10px; letter-spacing: 0.16em; color: rgba(0, 0, 0, 0.55);
}
.mg-sheet input, .mg-sheet textarea {
  display: block; width: 100%; margin-top: 8px;
  background: none; border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.35);
  padding: 6px 0;
  font-family: ${FONT}; font-size: 16px; color: #000;   /* 16px stops iOS zooming on focus */
  letter-spacing: 0;
  border-radius: 0;
}
.mg-sheet textarea { min-height: 120px; resize: vertical; }
.mg-sheet input:focus, .mg-sheet textarea:focus { outline: none; border-bottom-color: #000; }
.mg-sheetActions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.mg-sheet button {
  background: none; border: none; padding: 0;
  font-family: ${FONT}; font-size: 13px; font-weight: 700; letter-spacing: 0.16em; color: #000;
}
.mg-sheet .mg-sheetClose { font-weight: 300; color: rgba(0, 0, 0, 0.5); }
/* Must come after .mg-sheet — same specificity, so source order decides. */
.mg-sheet.mg-sheetLight { background: #FFFFFF; }

@media (prefers-reduced-motion: reduce) {
  .mg-static { animation: none; }
}
`

export default function MobileGrid() {
  // Measured once — it depends only on the fixed design width, not the viewport.
  const [fitted] = useState(() =>
    Object.fromEntries(CARDS.map(c => [c.id, fitTitle(c.title, c.lines)])))
  const [bioOpen, setBioOpen] = useState(false)
  const [reelOpen, setReelOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const enquiriesRef = useRef(null)

  // Close whatever is open on Back rather than leaving the site.
  useEffect(() => {
    if (!reelOpen && !formOpen && !bioOpen) return
    const onPop = () => { setReelOpen(false); setFormOpen(false); setBioOpen(false) }
    window.history.pushState({ mgOverlay: true }, '')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [reelOpen, formOpen, bioOpen])

  const openCard = (id) => {
    if (id === 'journal') { window.open('https://oswinjournal.com', '_blank'); return }
    if (id === 'alex') { setBioOpen(true); return }
    if (id === 'reel') { setReelOpen(true); return }
    if (id === 'enquiries') { setFormOpen(true); return }
    // gallery / records have no destination yet, same as the desktop ring.
  }

  // The desktop reel's ENQUIRIES control drops you back on the ring with that
  // card held front and centre. Flat, the equivalent is scrolling it to the
  // middle of the screen.
  const toEnquiries = () => {
    setReelOpen(false)
    requestAnimationFrame(() =>
      enquiriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const submit = (e) => {
    e.preventDefault()
    const f = e.currentTarget
    const name = f.name.value.trim()
    const email = f.email.value.trim()
    const message = f.message.value.trim()
    window.location.href = `mailto:alextaves@gmail.com?subject=${
      encodeURIComponent(`Enquiry from ${name || email}`)}&body=${
      encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`
  }

  return (
    <>
      <style>{css}</style>

      <div className="mg-wrap">
        <div className="mg-grid">
          {CARDS.map((card) => {
            const lightInk = card.kind === 'photo' || card.kind === 'video'
            const ink = card.titleColor || (lightInk ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)')
            const inkSub = lightInk ? 'rgba(255,255,255,0.52)' : 'rgba(0,0,0,0.50)'
            const inkRule = lightInk ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.22)'

            return (
              <div
                key={card.id}
                ref={card.id === 'enquiries' ? enquiriesRef : null}
                className="mg-card"
                style={{ background: card.bg }}
                onClick={() => openCard(card.id)}
              >
                {card.kind === 'circle' && <div className="mg-circle" />}

                {card.kind === 'photo' && (
                  <>
                    <div className="mg-photo" />
                    <div className="mg-scrim" />
                    <div className="mg-static" />
                  </>
                )}

                {card.kind === 'video' && (
                  <>
                    <video className="mg-video" src="/videos/showreel2_3.mp4" muted loop playsInline autoPlay />
                    <div className="mg-videoScrim" />
                  </>
                )}

                {card.kind === 'form' && <EnquiryPreview />}

                <div className="mg-head">
                  <h2 className="mg-title" style={{ color: ink, fontSize: `${fitted[card.id].cqw}cqw` }}>
                    {fitted[card.id].lines.map((line, i) => <span key={i}>{line}</span>)}
                  </h2>
                  <div className="mg-rule" style={{ background: inkRule }} />
                  <p className="mg-sub" style={{ color: inkSub }}>{card.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {reelOpen && (
        <>
          <div className="mg-reel">
            <video src="/videos/showreel2_3.mp4" autoPlay loop playsInline controls={false} />
          </div>
          <div className="mg-reelBar">
            <button className="mg-reelEnq" onClick={toEnquiries}>ENQUIRIES</button>
            <button className="mg-reelClose" aria-label="Close reel" onClick={() => setReelOpen(false)}>&#10005;</button>
          </div>
        </>
      )}

      {bioOpen && (
        <div className="mg-sheet mg-sheetLight">
          <h2>ALEX TAVES</h2>
          <p className="mg-sheetSub">a bit about me</p>
          <div className="mg-bio">
            {ALEX_BIO.map((para, i) => <p key={i}>{para}</p>)}
          </div>
          <div className="mg-sheetActions">
            <button type="button" className="mg-sheetClose" onClick={() => setBioOpen(false)}>CLOSE</button>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="mg-sheet">
          <h2>ENQUIRIES</h2>
          <p className="mg-sheetSub">get in touch · looking for like minded</p>
          <form onSubmit={submit}>
            <label>NAME:<input type="text" name="name" autoComplete="name" required /></label>
            <label>EMAIL:<input type="email" name="email" autoComplete="email" required /></label>
            <label>MESSAGE:<textarea name="message" required /></label>
            <div className="mg-sheetActions">
              <button type="submit">SUBMIT</button>
              <button type="button" className="mg-sheetClose" onClick={() => setFormOpen(false)}>CLOSE</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
