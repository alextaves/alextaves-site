import * as Tone from 'tone'
import { Midi } from '@tonejs/midi'

// The "Red" composition (op11no3-33) from oswin-redo's compositions.js —
// picked as the site's ambient, drag-activated piano. Lives at the App
// level (not inside any single ring's iframe) so it stays one continuous,
// fluid layer as the user moves between the different carousels — each
// ring just reports "dragging started/stopped" up via postMessage.
const TRACKS = [
  { midi: '/midi/33.mid',      volume: -19, detune: 0 },
  { midi: '/midi/op11no3.mid', volume: 0,   detune: 0 },
]
const SAMPLES = { A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3', C5: 'C5.mp3' }

export const FADE_IN_S  = 1.2   // ramps up quickly once you start moving a card
export const FADE_OUT_S = 2.5   // lingers a bit after you let go, rather than cutting off
const OFF_DB    = -60    // true mute floor, used only when the site's audio toggle is off
const IDLE_DB   = -40    // barely-there ambient bed — the payoff is the swell on drag/scroll
const ACTIVE_DB = -12    // half its former drag volume (-6 → -12dB): on drag the piano
                         // steps back so the crowd swell (in App.jsx) can come forward

let masterVol = null
let buildPromise = null
let dragCount = 0
let audioEnabled = false

// Lets App.jsx keep the plain background <audio> track (intro_mix.mp3) in
// lockstep with this piano's own active/idle swell, without duplicating the
// dragCount bookkeeping in two places.
const swellListeners = new Set()
function notifySwell(active) {
  swellListeners.forEach((cb) => cb(active))
}
export function onSwellChange(cb) {
  swellListeners.add(cb)
  return () => swellListeners.delete(cb)
}

function build() {
  if (buildPromise) return buildPromise
  buildPromise = (async () => {
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.4 }).toDestination()
    await reverb.ready
    masterVol = new Tone.Volume(OFF_DB).connect(reverb)

    // One shared random start point across both tracks, so they stay
    // proportionally aligned to each other rather than starting unrelated.
    const startFraction = Math.random()

    await Promise.all(TRACKS.map(async (trackCfg) => {
      const vol = new Tone.Volume(trackCfg.volume ?? 0).connect(masterVol)
      const sampler = await new Promise((resolve) => {
        const s = new Tone.Sampler(SAMPLES, {
          baseUrl: '/audio/salamander/',
          onload: () => resolve(s),
        }).connect(vol)
        s.detune = trackCfg.detune ?? 0
      })
      const midi = await Midi.fromUrl(trackCfg.midi)
      midi.tracks.forEach((track) => {
        if (!track.notes.length) return
        const events = track.notes.map((n) => ({ time: n.time, name: n.name, duration: n.duration, velocity: n.velocity }))
        const part = new Tone.Part((time, note) => {
          sampler.triggerAttackRelease(note.name, note.duration, time, note.velocity)
        }, events)
        part.loop = true
        part.loopEnd = midi.duration
        part.start(0, startFraction * midi.duration)
      })
    }))

    if (Tone.Transport.state !== 'started') Tone.Transport.start()
  })()
  return buildPromise
}

// Mirrors the site's existing audioOn toggle — when on, the piano plays
// continuously as a quiet ambient bed (not just while dragging); when off,
// it fades all the way out. Muting the intro track also mutes this.
export async function setPianoAudioEnabled(on) {
  audioEnabled = on
  if (on) {
    if (Tone.context.state !== 'running') await Tone.start()
    await build()
    masterVol.volume.rampTo(dragCount > 0 ? ACTIVE_DB : IDLE_DB, FADE_IN_S)
  } else if (masterVol) {
    masterVol.volume.rampTo(OFF_DB, FADE_OUT_S)
  }
}

export async function startDragging() {
  if (!audioEnabled) return
  dragCount++
  notifySwell(true)
  if (Tone.context.state !== 'running') await Tone.start()
  await build()
  masterVol.volume.rampTo(ACTIVE_DB, FADE_IN_S)
}

export function stopDragging() {
  dragCount = Math.max(0, dragCount - 1)
  if (dragCount === 0 && masterVol && audioEnabled) {
    notifySwell(false)
    masterVol.volume.rampTo(IDLE_DB, FADE_OUT_S)
  }
}

// Wheel events fire continuously through a scroll gesture with no natural
// start/end like pointerdown/up — debounce so this is one "started" per
// burst and one "stopped" after scrolling actually pauses. Shared by every
// React scene component that reads wheel deltas for its own purposes.
let scrollPulseTimeout = null
export function pulseScroll() {
  if (!scrollPulseTimeout) startDragging()
  clearTimeout(scrollPulseTimeout)
  scrollPulseTimeout = setTimeout(() => { stopDragging(); scrollPulseTimeout = null }, 220)
}
