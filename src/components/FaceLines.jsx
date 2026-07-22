import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const BASE_SCROLL_SPEED = 0.12 // tile-widths per second, right-to-left

const vertexShader = `
  uniform float repeatX;
  uniform float offsetX;
  uniform float repeatY;
  varying vec2 vUv;
  void main() {
    vUv = vec2(uv.x * repeatX + offsetX, uv.y * repeatY);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D map;
  uniform float hue;
  uniform float saturation;
  uniform float lightness;
  uniform float bw;
  uniform float exposure;
  varying vec2 vUv;

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

  void main() {
    vec4 tex = texture2D(map, vUv);
    vec3 hsl = rgb2hsl(tex.rgb);
    hsl.x = fract(hsl.x + hue);
    hsl.y = clamp(hsl.y * saturation, 0.0, 1.0);
    hsl.z = clamp(hsl.z + lightness, 0.0, 1.0);
    vec3 color = hsl2rgb(hsl);
    color *= pow(2.0, exposure);
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), bw);
    gl_FragColor = vec4(color, tex.a);
  }
`

function Strip({ params }) {
  const { viewport, size } = useThree()
  const texture = useLoader(THREE.TextureLoader, '/face_glitch.webp')

  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      repeatX: { value: 1 },
      offsetX: { value: 0 },
      repeatY: { value: 1 },
      hue: { value: 0 },
      saturation: { value: 1 },
      lightness: { value: 0 },
      bw: { value: 0 },
      exposure: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  }), [texture])

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.needsUpdate = true
  }, [texture])

  const offsetRef = useRef(0)

  useFrame((_, delta) => {
    offsetRef.current += BASE_SCROLL_SPEED * params.current.speed * delta
    material.uniforms.repeatX.value = params.current.density
    material.uniforms.offsetX.value = offsetRef.current
    material.uniforms.repeatY.value = size.height / params.current.stripeHeight
    material.uniforms.hue.value = params.current.hue
    material.uniforms.saturation.value = params.current.saturation
    material.uniforms.lightness.value = params.current.lightness
    material.uniforms.bw.value = params.current.bw
    material.uniforms.exposure.value = params.current.exposure
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
        width: 44, fontFamily: FONT, fontSize: 10,
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
      <Slider label="Density" value={params.density} min={1} max={600} step={1}
        onChange={(v) => onChange({ ...params, density: v })} />
      <Slider label="Stripe px" value={params.stripeHeight} min={1} max={40} step={1}
        onChange={(v) => onChange({ ...params, stripeHeight: v })} />
      <Slider label="Speed" value={params.speed} min={-5} max={5} step={0.05}
        onChange={(v) => onChange({ ...params, speed: v })} />
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
    </div>
  )
}

// Same starting point as the WaterLines moiré preset — tune from here.
const PRESET_V1 = {
  density: 509, stripeHeight: 9, speed: 4.85, hue: 0.5, saturation: 2,
  lightness: 0.185, bw: 0.35, exposure: 1.38,
}

export default function FaceLines() {
  const [params, setParams] = useState(PRESET_V1)
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
