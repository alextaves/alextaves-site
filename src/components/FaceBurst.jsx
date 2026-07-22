import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const TILE_ASPECT = 1855 / 2560 // seamless tile's own width/height
const TILE_SCALE = 1.0          // how tall each figure reads relative to viewport height
const SCROLL_SPEED = 0.12       // tile-widths per second, right-to-left, for the calm outer border

const vertexShader = `
  uniform float repeatX;
  uniform float offsetX;
  varying vec2 vUv;
  varying vec2 vRawUv;
  void main() {
    vRawUv = uv;
    vUv = vec2(uv.x * repeatX + offsetX, uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D map;
  uniform float repeatX;
  uniform float offsetX;
  uniform float hue;
  uniform float saturation;
  uniform float lightness;
  uniform float bw;
  uniform float exposure;
  uniform float innerHue;
  uniform float innerSaturation;
  uniform float innerLightness;
  uniform float innerBw;
  uniform float innerExposure;
  uniform float time;
  uniform float inset;
  uniform float rightMargin;
  uniform float innerRepeatX;
  uniform float innerOffsetX;
  uniform float edgeSoftness;
  varying vec2 vUv;
  varying vec2 vRawUv;

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

  vec3 grade(vec3 base, float gHue, float gSaturation, float gLightness, float gBw, float gExposure) {
    vec3 hsl = rgb2hsl(base);
    hsl.x = fract(hsl.x + gHue);
    hsl.y = clamp(hsl.y * gSaturation, 0.0, 1.0);
    hsl.z = clamp(hsl.z + gLightness, 0.0, 1.0);
    vec3 color = hsl2rgb(hsl);
    color *= pow(2.0, gExposure);
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), gBw);
    return color;
  }

  void main() {
    float boxSize = 1.0 - 2.0 * inset;
    float xMax = 1.0 - rightMargin;
    float xMin = xMax - boxSize;
    vec2 innerLocal = vec2((vRawUv.x - xMin) / boxSize, (vRawUv.y - inset) / boxSize);
    bool inside = innerLocal.x > 0.0 && innerLocal.x < 1.0 && innerLocal.y > 0.0 && innerLocal.y < 1.0;

    float edge = min(
      min(innerLocal.x, 1.0 - innerLocal.x),
      min(innerLocal.y, 1.0 - innerLocal.y)
    );
    float mask = smoothstep(0.0, edgeSoftness, edge);

    vec3 outerColor = grade(texture2D(map, vUv).rgb, hue, saturation, lightness, bw, exposure);

    vec3 finalColor = outerColor;
    if (inside) {
      // Same repeating "train" of tiles as the background, just rescaled to
      // fit the smaller window and running at its own (much faster) speed.
      vec2 innerVUv = vec2(innerLocal.x * innerRepeatX + innerOffsetX, innerLocal.y);
      vec3 trainColor = grade(texture2D(map, innerVUv).rgb, innerHue, innerSaturation, innerLightness, innerBw, innerExposure);
      finalColor = mix(outerColor, trainColor, mask);
    }

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

function Strip({ params }) {
  const { viewport, size } = useThree()
  const texture = useLoader(THREE.TextureLoader, '/face_seamless.webp')

  const tileWorldHeight = viewport.height * TILE_SCALE
  const tileWorldWidth = tileWorldHeight * TILE_ASPECT
  const repeatX = viewport.width / tileWorldWidth

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      repeatX: { value: 1 },
      offsetX: { value: 0 },
      hue: { value: 0 },
      saturation: { value: 1 },
      lightness: { value: 0 },
      bw: { value: 0 },
      exposure: { value: 0 },
      innerHue: { value: 0 },
      innerSaturation: { value: 1.2 },
      innerLightness: { value: 0 },
      innerBw: { value: 0 },
      innerExposure: { value: 0.15 },
      time: { value: 0 },
      inset: { value: 0.25 },
      rightMargin: { value: 0.04 },
      innerRepeatX: { value: 1 },
      innerOffsetX: { value: 0 },
      edgeSoftness: { value: 0.06 },
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
  const innerOffsetRef = useRef(0)

  useFrame((state, delta) => {
    offsetRef.current += SCROLL_SPEED * delta
    material.uniforms.repeatX.value = repeatX
    material.uniforms.offsetX.value = offsetRef.current
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.hue.value = params.current.hue
    material.uniforms.saturation.value = params.current.saturation
    material.uniforms.lightness.value = params.current.lightness
    material.uniforms.bw.value = params.current.bw
    material.uniforms.exposure.value = params.current.exposure
    material.uniforms.innerHue.value = params.current.innerHue
    material.uniforms.innerSaturation.value = params.current.innerSaturation
    material.uniforms.innerLightness.value = params.current.innerLightness
    material.uniforms.innerBw.value = params.current.innerBw
    material.uniforms.innerExposure.value = params.current.innerExposure
    material.uniforms.inset.value = params.current.inset
    material.uniforms.rightMargin.value = params.current.rightMargin - (params.current.rightShiftPx / size.width)

    // Same train, rescaled so tiles keep the correct aspect ratio inside the
    // smaller window (which shares the screen's own aspect ratio), running
    // at its own much higher speed.
    const innerRepeatX = repeatX * params.current.innerScale
    innerOffsetRef.current += SCROLL_SPEED * params.current.innerSpeed * delta
    material.uniforms.innerRepeatX.value = innerRepeatX
    material.uniforms.innerOffsetX.value = innerOffsetRef.current
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

function ControlPanel({ params, onChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 40,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      padding: '16px 20px', borderRadius: 8,
    }}>
      <Slider label="Inset" value={params.inset} min={0.05} max={0.45} step={0.01}
        onChange={(v) => onChange({ ...params, inset: v })} />
      <Slider label="Right Gap" value={params.rightMargin} min={0} max={0.4} step={0.01}
        onChange={(v) => onChange({ ...params, rightMargin: v })} />
      <Slider label="Inner Scale" value={params.innerScale} min={0.1} max={4} step={0.05}
        onChange={(v) => onChange({ ...params, innerScale: v })} />
      <Slider label="Inner Speed" value={params.innerSpeed} min={1} max={80} step={0.5}
        onChange={(v) => onChange({ ...params, innerSpeed: v })} />

      <div style={{ height: 1, background: 'rgba(255,255,255,0.15)', margin: '4px 0 12px' }} />

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

      <Slider label="Inner Hue" value={params.innerHue} min={-0.5} max={0.5} step={0.001}
        onChange={(v) => onChange({ ...params, innerHue: v })} />
      <Slider label="Inner Sat" value={params.innerSaturation} min={0} max={2} step={0.01}
        onChange={(v) => onChange({ ...params, innerSaturation: v })} />
      <Slider label="Inner Light" value={params.innerLightness} min={-0.5} max={0.5} step={0.001}
        onChange={(v) => onChange({ ...params, innerLightness: v })} />
      <Slider label="Inner B&W" value={params.innerBw} min={0} max={1} step={0.01}
        onChange={(v) => onChange({ ...params, innerBw: v })} />
      <Slider label="Inner Exp" value={params.innerExposure} min={-3} max={3} step={0.01}
        onChange={(v) => onChange({ ...params, innerExposure: v })} />
    </div>
  )
}

export default function FaceBurst() {
  const [params, setParams] = useState({
    hue: 0, saturation: 1, lightness: 0, bw: 0, exposure: 0,
    innerHue: 0, innerSaturation: 1.2, innerLightness: 0, innerBw: 0, innerExposure: 0.15,
    inset: 0.25, rightMargin: 0.04, rightShiftPx: 100, innerScale: 1, innerSpeed: 3.2,
  })
  const paramsRef = useRef(params)
  paramsRef.current = params

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <Strip params={paramsRef} />
      </Canvas>
      <ControlPanel params={params} onChange={setParams} />
    </div>
  )
}
