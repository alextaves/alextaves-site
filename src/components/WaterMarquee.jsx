import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const TILE_ASPECT = 555 / 995 // seamless tile's own width/height
const TILE_SCALE = 1.0        // how tall each figure reads relative to viewport height
const SCROLL_SPEED = 0.12     // tile-widths per second, right-to-left, at speed multiplier 1

const MIN_SPEED_MULT = 1 / 32
const MAX_SPEED_MULT = 32
const TRANSITION_DURATION = 1.5 // seconds, crossfade between presets
const MAX_BLUR_PX = 14
const MAX_SPEED_BLUR_PX = 6

const vertexShader = `
  uniform float repeatX;
  uniform float offsetX;
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x * repeatX + offsetX, uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D map;
  uniform float fromHue;
  uniform float fromSaturation;
  uniform float fromLightness;
  uniform float fromBw;
  uniform float fromExposure;
  uniform vec3 fromOverlayColor;
  uniform float fromOverlayOpacity;
  uniform int fromBlendMode;
  uniform float toHue;
  uniform float toSaturation;
  uniform float toLightness;
  uniform float toBw;
  uniform float toExposure;
  uniform vec3 toOverlayColor;
  uniform float toOverlayOpacity;
  uniform int toBlendMode;
  uniform float crossfade;
  uniform float time;
  uniform float waterAmount;
  varying vec2 vUv;

  vec3 blendMultiply(vec3 b, vec3 o) { return b * o; }
  vec3 blendScreen(vec3 b, vec3 o) { return 1.0 - (1.0 - b) * (1.0 - o); }
  vec3 blendDarken(vec3 b, vec3 o) { return min(b, o); }
  vec3 blendLighten(vec3 b, vec3 o) { return max(b, o); }
  vec3 blendOverlay(vec3 b, vec3 o) {
    return vec3(
      b.r < 0.5 ? 2.0*b.r*o.r : 1.0-2.0*(1.0-b.r)*(1.0-o.r),
      b.g < 0.5 ? 2.0*b.g*o.g : 1.0-2.0*(1.0-b.g)*(1.0-o.g),
      b.b < 0.5 ? 2.0*b.b*o.b : 1.0-2.0*(1.0-b.b)*(1.0-o.b)
    );
  }
  vec3 blendHardLight(vec3 b, vec3 o) { return blendOverlay(o, b); }
  vec3 blendColorDodge(vec3 b, vec3 o) { return clamp(b / max(1.0 - o, 0.001), 0.0, 1.0); }
  vec3 blendColorBurn(vec3 b, vec3 o) { return clamp(1.0 - (1.0 - b) / max(o, 0.001), 0.0, 1.0); }
  vec3 blendSoftLight(vec3 b, vec3 o) {
    vec3 d = mix(sqrt(b), (16.0*b - 12.0)*b*b + 4.0*b, step(0.25, b));
    return mix(b - (1.0-2.0*o)*b*(1.0-b), b + (2.0*o-1.0)*(d-b), step(0.5, o));
  }
  vec3 blendDifference(vec3 b, vec3 o) { return abs(b - o); }
  vec3 blendExclusion(vec3 b, vec3 o) { return b + o - 2.0*b*o; }

  vec3 rgb2hsl(vec3 c) {
    float maxc = max(max(c.r, c.g), c.b);
    float minc = min(min(c.r, c.g), c.b);
    float l = (maxc + minc) * 0.5;
    float h = 0.0;
    float s = 0.0;
    if (maxc != minc) {
      float d = maxc - minc;
      s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
      if (maxc == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
      else if (maxc == c.g) h = (c.b - c.r) / d + 2.0;
      else h = (c.r - c.g) / d + 4.0;
      h /= 6.0;
    }
    return vec3(h, s, l);
  }

  float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0/2.0) return q;
    if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
  }

  vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x, s = hsl.y, l = hsl.z;
    if (s == 0.0) return vec3(l);
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    return vec3(
      hue2rgb(p, q, h + 1.0/3.0),
      hue2rgb(p, q, h),
      hue2rgb(p, q, h - 1.0/3.0)
    );
  }

  vec3 grade(vec3 base, float hue, float saturation, float lightness, float bw, float exposure, vec3 overlayColor, float overlayOpacity, int blendMode) {
    vec3 hsl = rgb2hsl(base);
    hsl.x = fract(hsl.x + hue);
    hsl.y = clamp(hsl.y * saturation, 0.0, 1.0);
    hsl.z = clamp(hsl.z + lightness, 0.0, 1.0);
    vec3 color = hsl2rgb(hsl);
    color *= pow(2.0, exposure);
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), bw);

    vec3 blended = color;
    if (blendMode == 0) blended = overlayColor;
    else if (blendMode == 1) blended = blendMultiply(color, overlayColor);
    else if (blendMode == 2) blended = blendScreen(color, overlayColor);
    else if (blendMode == 3) blended = blendOverlay(color, overlayColor);
    else if (blendMode == 4) blended = blendDarken(color, overlayColor);
    else if (blendMode == 5) blended = blendLighten(color, overlayColor);
    else if (blendMode == 6) blended = blendColorDodge(color, overlayColor);
    else if (blendMode == 7) blended = blendColorBurn(color, overlayColor);
    else if (blendMode == 8) blended = blendHardLight(color, overlayColor);
    else if (blendMode == 9) blended = blendSoftLight(color, overlayColor);
    else if (blendMode == 10) blended = blendDifference(color, overlayColor);
    else if (blendMode == 11) blended = blendExclusion(color, overlayColor);
    return mix(color, blended, overlayOpacity);
  }

  vec2 waterRipple(vec2 uv, float t) {
    float dx = sin(uv.y * 14.0 + t * 1.3) * 0.014
             + sin(uv.y * 23.0 - t * 0.8) * 0.006;
    float dy = sin(uv.x * 9.0  + t * 1.1) * 0.011
             + cos(uv.x * 17.0 + t * 0.9) * 0.005;
    return uv + vec2(dx, dy) * waterAmount;
  }

  void main() {
    vec2 uvW = waterRipple(vUv, time);
    vec4 tex = texture2D(map, uvW);
    vec3 colorFrom = grade(tex.rgb, fromHue, fromSaturation, fromLightness, fromBw, fromExposure, fromOverlayColor, fromOverlayOpacity, fromBlendMode);
    vec3 colorTo = grade(tex.rgb, toHue, toSaturation, toLightness, toBw, toExposure, toOverlayColor, toOverlayOpacity, toBlendMode);
    vec3 color = mix(colorFrom, colorTo, crossfade);

    // Soft caustic shimmer — bright, moving light-mesh patches like sunlight through water.
    float caustic = sin(uvW.x * 22.0 + uvW.y * 18.0 + time * 1.6) * 0.5 + 0.5;
    caustic *= sin(uvW.x * 11.0 - uvW.y * 26.0 - time * 2.1) * 0.5 + 0.5;
    color += caustic * waterAmount * 0.18;

    gl_FragColor = vec4(color, tex.a);
  }
`

function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2 }

function Strip({ params, speedMultiplierRef, transitionRef, blurRef }) {
  const { viewport } = useThree()
  const texture = useLoader(THREE.TextureLoader, '/water2_seamless.webp')

  const tileWorldHeight = viewport.height * TILE_SCALE
  const tileWorldWidth = tileWorldHeight * TILE_ASPECT
  const repeatX = viewport.width / tileWorldWidth

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      repeatX: { value: 1 },
      offsetX: { value: 0 },
      fromHue: { value: 0 },
      fromSaturation: { value: 1 },
      fromLightness: { value: 0 },
      fromBw: { value: 0 },
      fromExposure: { value: 0 },
      fromOverlayColor: { value: new THREE.Color('#ff0000') },
      fromOverlayOpacity: { value: 0 },
      fromBlendMode: { value: 1 },
      toHue: { value: 0 },
      toSaturation: { value: 1 },
      toLightness: { value: 0 },
      toBw: { value: 0 },
      toExposure: { value: 0 },
      toOverlayColor: { value: new THREE.Color('#ff0000') },
      toOverlayOpacity: { value: 0 },
      toBlendMode: { value: 1 },
      crossfade: { value: 0 },
      time: { value: 0 },
      waterAmount: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  }), [texture])

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.ClampToEdgeWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
  }, [texture])

  const offsetRef = useRef(0)
  const speedBlurRef = useRef(0)
  const transitionBlurRef = useRef(0)

  const applyGrade = (prefix, p) => {
    material.uniforms[prefix + 'Hue'].value = p.hue
    material.uniforms[prefix + 'Saturation'].value = p.saturation
    material.uniforms[prefix + 'Lightness'].value = p.lightness
    material.uniforms[prefix + 'Bw'].value = p.bw
    material.uniforms[prefix + 'Exposure'].value = p.exposure
    material.uniforms[prefix + 'OverlayColor'].value.set(p.overlayColor)
    material.uniforms[prefix + 'OverlayOpacity'].value = p.overlayOpacity
    material.uniforms[prefix + 'BlendMode'].value = p.blendMode
  }

  useFrame((state, delta) => {
    offsetRef.current += SCROLL_SPEED * speedMultiplierRef.current * delta
    material.uniforms.repeatX.value = repeatX
    material.uniforms.offsetX.value = offsetRef.current
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.waterAmount.value = params.current.waterAmount

    const tr = transitionRef.current
    if (tr.active) {
      tr.t += delta
      const progress = Math.min(tr.t / TRANSITION_DURATION, 1)
      const eased = easeInOut(progress)
      applyGrade('from', tr.from)
      applyGrade('to', tr.to)
      material.uniforms.crossfade.value = eased
      transitionBlurRef.current = Math.sin(progress * Math.PI) * MAX_BLUR_PX

      if (progress >= 1) {
        tr.active = false
        tr.onComplete?.()
      }
    } else {
      applyGrade('from', params.current)
      applyGrade('to', params.current)
      material.uniforms.crossfade.value = 0
      transitionBlurRef.current = 0
    }

    // Motion blur eases toward a target tied to how extreme the speed is —
    // smoothed so speed-doubling swipes feel like a continuous push, not a pop.
    const speedMagnitude = Math.min(Math.abs(Math.log2(speedMultiplierRef.current)), 5)
    const targetSpeedBlur = (speedMagnitude / 5) * MAX_SPEED_BLUR_PX
    speedBlurRef.current += (targetSpeedBlur - speedBlurRef.current) * 0.05

    blurRef.current = Math.max(transitionBlurRef.current, speedBlurRef.current)
  })

  return (
    <mesh material={material}>
      <planeGeometry args={[viewport.width, viewport.height]} />
    </mesh>
  )
}

const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif"

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{
        width: 78, fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
      }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 160 }}
      />
      <span style={{
        width: 40, fontFamily: FONT, fontSize: 10,
        color: 'rgba(255,255,255,0.35)', textAlign: 'right',
      }}>{value.toFixed(2)}</span>
    </div>
  )
}

const BLEND_MODES = [
  'Normal', 'Multiply', 'Screen', 'Overlay', 'Darken', 'Lighten',
  'Color Dodge', 'Color Burn', 'Hard Light', 'Soft Light', 'Difference', 'Exclusion',
]

function ControlPanel({ params, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 40,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '16px 20px', borderRadius: 8,
    }}>
      <Slider label="Hue" value={params.hue} min={-0.5} max={0.5} step={0.001}
        onChange={(v) => onChange({ ...params, hue: v })} />
      <Slider label="Saturation" value={params.saturation} min={0} max={2} step={0.01}
        onChange={(v) => onChange({ ...params, saturation: v })} />
      <Slider label="Lightness" value={params.lightness} min={-0.5} max={0.5} step={0.001}
        onChange={(v) => onChange({ ...params, lightness: v })} />
      <Slider label="B&W" value={params.bw} min={0} max={1} step={0.01}
        onChange={(v) => onChange({ ...params, bw: v })} />
      <Slider label="Exposure" value={params.exposure} min={-3} max={3} step={0.01}
        onChange={(v) => onChange({ ...params, exposure: v })} />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '4px 0 12px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          width: 78, fontFamily: FONT, fontSize: 10, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)',
        }}>Color</span>
        <input
          type="color"
          value={params.overlayColor}
          onChange={(e) => onChange({ ...params, overlayColor: e.target.value })}
          style={{ width: 40, height: 22, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
        />
        <select
          value={params.blendMode}
          onChange={(e) => onChange({ ...params, blendMode: parseInt(e.target.value, 10) })}
          style={{
            fontFamily: FONT, fontSize: 10, letterSpacing: '0.06em',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)',
            border: 'none', borderRadius: 4, padding: '4px 6px',
          }}
        >
          {BLEND_MODES.map((name, i) => (
            <option key={name} value={i} style={{ color: '#000' }}>{name}</option>
          ))}
        </select>
      </div>
      <Slider label="Opacity" value={params.overlayOpacity} min={0} max={1} step={0.01}
        onChange={(v) => onChange({ ...params, overlayOpacity: v })} />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '4px 0 12px' }} />

      <Slider label="Water" value={params.waterAmount} min={0} max={3} step={0.01}
        onChange={(v) => onChange({ ...params, waterAmount: v })} />
    </div>
  )
}

// Locked-in looks, chosen 2026-07-20 — restore by resetting params to one of these.
const PRESET_V1 = {
  hue: -0.5, saturation: 0, lightness: 0.32, bw: 1, exposure: 0.19,
  overlayColor: '#9efffd', overlayOpacity: 1, blendMode: 1,
}
const PRESET_V2 = {
  hue: -0.5, saturation: 0, lightness: 0.32, bw: 1, exposure: 0.19,
  overlayColor: '#fffa61', overlayOpacity: 1, blendMode: 4,
}
const PRESET_V3 = {
  hue: -0.5, saturation: 0, lightness: 0.32, bw: 1, exposure: 0.19,
  overlayColor: '#e6e6e6', overlayOpacity: 1, blendMode: 4,
}
const PRESETS = [PRESET_V1, PRESET_V2, PRESET_V3]
const DEFAULT_PRESET_INDEX = 2

export default function WaterMarquee({ controls = true }) {
  const [params, setParams] = useState({ ...PRESETS[DEFAULT_PRESET_INDEX], waterAmount: 0.18 })
  const paramsRef = useRef(params)
  paramsRef.current = params

  const speedMultiplierRef = useRef(1)
  const presetIndexRef = useRef(DEFAULT_PRESET_INDEX)
  const transitionRef = useRef({ active: false, from: null, to: null, t: 0, onComplete: null })
  const blurRef = useRef(0)
  const containerRef = useRef(null)

  const goToPreset = (nextIdx) => {
    if (transitionRef.current.active) return
    const wrapped = (nextIdx + PRESETS.length) % PRESETS.length
    transitionRef.current = {
      active: true,
      from: { ...paramsRef.current },
      to: PRESETS[wrapped],
      t: 0,
      onComplete: () => {
        presetIndexRef.current = wrapped
        setParams({ ...PRESETS[wrapped], waterAmount: paramsRef.current.waterAmount })
      },
    }
  }

  // Swipe gestures: trackpad/wheel deltas treated as swipes.
  // Left = speed up (x2 per swipe), right = slow back down (/2 per swipe).
  // Up/down = cycle presets with a blur crossfade.
  useEffect(() => {
    const gesture = { x: 0, y: 0, resetTimer: null, cooldownX: 0, cooldownY: 0 }
    const H_THRESH = 70
    const V_THRESH = 70
    const COOLDOWN_MS = 380

    const handleGesture = (dx, dy) => {
      gesture.x += dx
      gesture.y += dy
      clearTimeout(gesture.resetTimer)
      gesture.resetTimer = setTimeout(() => { gesture.x = 0; gesture.y = 0 }, 150)

      const now = performance.now()
      if (Math.abs(gesture.x) > H_THRESH && now - gesture.cooldownX > COOLDOWN_MS) {
        if (gesture.x < 0) {
          speedMultiplierRef.current = Math.min(speedMultiplierRef.current * 2, MAX_SPEED_MULT)
        } else {
          speedMultiplierRef.current = Math.max(speedMultiplierRef.current * 0.5, MIN_SPEED_MULT)
        }
        gesture.cooldownX = now
        gesture.x = 0
      }

      if (Math.abs(gesture.y) > V_THRESH && now - gesture.cooldownY > COOLDOWN_MS) {
        const dir = gesture.y < 0 ? -1 : 1
        goToPreset(presetIndexRef.current + dir)
        gesture.cooldownY = now
        gesture.y = 0
      }
    }

    const onWheel = (e) => handleGesture(e.deltaX, e.deltaY)

    let lastX = 0, lastY = 0
    const onTouchStart = (e) => { lastX = e.touches[0].clientX; lastY = e.touches[0].clientY }
    const onTouchMove = (e) => {
      const dx = lastX - e.touches[0].clientX
      const dy = lastY - e.touches[0].clientY
      lastX = e.touches[0].clientX
      lastY = e.touches[0].clientY
      handleGesture(dx, dy)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      clearTimeout(gesture.resetTimer)
    }
  }, [])

  // Apply blur imperatively so the crossfade animates at full frame rate
  // without pushing React re-renders every frame.
  useEffect(() => {
    let raf
    const tick = () => {
      if (containerRef.current) {
        containerRef.current.style.filter = blurRef.current > 0.01 ? `blur(${blurRef.current}px)` : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
          <Strip params={paramsRef} speedMultiplierRef={speedMultiplierRef} transitionRef={transitionRef} blurRef={blurRef} />
        </Canvas>
      </div>
      {controls && <ControlPanel params={params} onChange={setParams} />}
    </div>
  )
}
