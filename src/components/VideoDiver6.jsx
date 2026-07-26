import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { pulseScroll } from '../schoenbergPiano'

const SRCS = ['/videos/diver4.mp4', '/videos/diver2.mp4']
const ASPECTS = [1280 / 1956, 1280 / 766]
const TILE_COUNT = 8
const OVERLAPS = [0.15, 0.05]
const PARTICLE_COUNT = 12000
const PLAY_SPEED = 0.45

// ── Video tile shaders ────────────────────────────────────────────────────────

const videoVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const videoFrag = `
  uniform sampler2D map;
  uniform float time;
  uniform float colorShift;
  uniform float overlap;
  uniform vec2 uvScale;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 uv = (vUv - 0.5) * uvScale + 0.5;
    float lineId = floor(uv.y * 60.0);
    float glitchOn = step(0.97, hash(vec2(lineId, floor(time * 4.0))));
    float shift = (hash(vec2(lineId + 0.5, floor(time * 4.0))) - 0.5) * 0.04 * glitchOn;
    vec3 tex = texture2D(map, vec2(uv.x + shift, uv.y)).rgb;
    vec3 blue      = vec3(0.0, 0.05, 0.5);
    vec3 blueColor = tex * blue;
    vec3 fullColor = tex;
    vec3 negColor  = (vec3(1.0) - tex) * blue;
    vec3 colored = mix(blueColor, fullColor, max(colorShift, 0.0));
    colored      = mix(colored,   negColor,  max(-colorShift, 0.0));
    float noise = hash(vUv * 300.0 + fract(time * 11.3)) * 0.06;
    colored += vec3(0.0, noise * 0.1, noise);
    float alpha = smoothstep(0.0, overlap, uv.y)
                * smoothstep(0.0, overlap, 1.0 - uv.y);
    gl_FragColor = vec4(colored, alpha);
  }
`

// ── Particle shaders ──────────────────────────────────────────────────────────

const particleVert = `
  uniform float time;
  uniform float turbulence;
  attribute vec3 aInit;
  attribute float aSpeed;
  attribute float aSize;
  varying float vAlpha;
  varying vec3 vColor;

  float sn(vec3 p) {
    return sin(p.x * 2.1 + p.y * 1.3) * cos(p.y * 1.7 + p.z * 2.9) * sin(p.z * 1.4 + p.x * 3.1);
  }

  void main() {
    vec3 pos = aInit;
    float t = time * aSpeed;
    pos.y = mod(aInit.y + t, 16.0) - 8.0;
    float n1 = sn(aInit * 0.4 + time * 0.08);
    float n2 = sn(aInit * 0.7 + time * 0.05 + 4.3);
    pos.x += n1 * 0.4 + n2 * turbulence * 1.2;
    pos.z += sn(aInit * 0.5 + time * 0.06 + 8.7) * 0.2;
    pos.z += sin(time * 0.25 + aInit.x * 1.5 + aInit.z * 2.1) * 0.15;
    float edgeFade = smoothstep(8.0, 5.5, abs(pos.y));
    vAlpha = edgeFade * (0.35 + 0.55 * aSize);
    vColor = mix(vec3(0.1, 0.55, 1.0), vec3(0.85, 0.96, 1.0), clamp(aSize + n1 * 0.3, 0.0, 1.0));
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * 5.0 * (280.0 / -mvPos.z);
    gl_Position = projectionMatrix * mvPos;
  }
`

const particleFrag = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    float circle = smoothstep(0.5, 0.05, r);
    gl_FragColor = vec4(vColor, circle * vAlpha);
  }
`

// ── Components ────────────────────────────────────────────────────────────────

function VideoStrip({ textures, videos, velocityRef }) {
  const { viewport } = useThree()
  const TILE_W = viewport.width

  const meshRefs = useRef([])
  const scrollRef = useRef(0)
  const videoTimeRef = useRef(0)
  const colorShiftRef = useRef(0)
  const activeIdxRef = useRef(0)

  const geos = useMemo(() => ASPECTS.map((a, i) => new THREE.PlaneGeometry(TILE_W, TILE_W / a)), [TILE_W])
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { map: { value: textures[0] }, time: { value: 0 }, colorShift: { value: 0 }, overlap: { value: OVERLAPS[0] }, uvScale: { value: new THREE.Vector2(1, 1) } },
    vertexShader: videoVert,
    fragmentShader: videoFrag,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }), [textures])

  useEffect(() => {
    const onWheel = (e) => {
      velocityRef.current += e.deltaY * 0.005
      colorShiftRef.current = THREE.MathUtils.clamp(
        colorShiftRef.current - e.deltaX * 0.008, -1, 1
      )
      pulseScroll()
    }
    let lastY = 0, lastX = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY; lastX = e.touches[0].clientX }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      const dx = lastX - e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastX = e.touches[0].clientX
      velocityRef.current += dy * 0.005
      colorShiftRef.current = THREE.MathUtils.clamp(colorShiftRef.current - dx * 0.008, -1, 1)
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  useFrame((state, delta) => {
    colorShiftRef.current = THREE.MathUtils.lerp(colorShiftRef.current, 0, 0.03)
    material.uniforms.time.value = state.clock.elapsedTime
    material.uniforms.colorShift.value = colorShiftRef.current

    const dur0 = videos[0]?.duration || 13
    const dur1 = videos[1]?.duration || 31
    const total = dur0 + dur1
    videoTimeRef.current += PLAY_SPEED * delta
    videoTimeRef.current = videoTimeRef.current % total

    const t = videoTimeRef.current
    const idx = t < dur0 ? 0 : 1
    if (idx === 0) {
      if (videos[0].readyState >= 2) videos[0].currentTime = t
    } else {
      if (videos[1].readyState >= 2) videos[1].currentTime = t - dur0
    }
    material.uniforms.map.value = textures[idx]
    material.uniforms.overlap.value = OVERLAPS[idx]
    material.uniforms.uvScale.value.set(1, 1)

    const TILE_H  = TILE_W / ASPECTS[idx]
    const SPACING = TILE_H * (1 - OVERLAPS[idx])
    const TOTAL_H = TILE_COUNT * SPACING

    scrollRef.current += TILE_H * 0.022 * delta
    velocityRef.current *= 0.88
    scrollRef.current += velocityRef.current

    for (let i = 0; i < TILE_COUNT; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      mesh.geometry = geos[idx]
      mesh.position.y = ((i * SPACING + scrollRef.current % TOTAL_H) % TOTAL_H + TOTAL_H) % TOTAL_H - TOTAL_H / 2
    }
  })

  return (
    <>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el }} geometry={geos[0]} material={material} />
      ))}
    </>
  )
}

function Particles({ velocityRef }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const init  = new Float32Array(PARTICLE_COUNT * 3)
    const speed = new Float32Array(PARTICLE_COUNT)
    const size  = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      init[i * 3]     = (Math.random() - 0.5) * 9
      init[i * 3 + 1] = (Math.random() - 0.5) * 16
      init[i * 3 + 2] = (Math.random() - 0.5) * 1.5
      speed[i] = 0.15 + Math.random() * 0.35
      size[i]  = Math.random()
    }
    g.setAttribute('aInit',  new THREE.BufferAttribute(init,  3))
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('aSize',  new THREE.BufferAttribute(size,  1))
    return g
  }, [])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, turbulence: { value: 0 } },
    vertexShader: particleVert,
    fragmentShader: particleFrag,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }), [])

  useFrame((state) => {
    mat.uniforms.time.value = state.clock.elapsedTime
    mat.uniforms.turbulence.value = THREE.MathUtils.lerp(
      mat.uniforms.turbulence.value,
      Math.min(Math.abs(velocityRef.current) * 2, 1.0),
      0.08
    )
  })

  return <points geometry={geo} material={mat} />
}

function Scene({ textures, videos, velocityRef }) {
  if (!textures) return null
  return (
    <>
      <VideoStrip textures={textures} videos={videos} velocityRef={velocityRef} />
      <Particles velocityRef={velocityRef} />
    </>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export default function VideoDiver6() {
  const containerRef = useRef(null)
  const [textures, setTextures] = useState(null)
  const velocityRef = useRef(0)
  const videosRef = useRef([])
  const glassRef = useRef(null)
  const blurRef = useRef(5)
  const rafRef = useRef(null)

  useEffect(() => {
    const videos = SRCS.map(src => {
      const v = document.createElement('video')
      v.src = src; v.muted = true; v.playsInline = true; v.preload = 'auto'
      return v
    })
    videosRef.current = videos

    const texs = videos.map(v => {
      const t = new THREE.VideoTexture(v)
      t.colorSpace = THREE.SRGBColorSpace
      return t
    })

    let ready = 0
    const onReady = () => {
      if (++ready === videos.length) {
        videos.forEach(v => { v.currentTime = 0; v.pause() })
        setTextures(texs)
      }
    }
    videos.forEach(v => v.addEventListener('canplay', onReady, { once: true }))
    videos.forEach(v => v.load())

    return () => {
      videos.forEach(v => { v.src = '' })
      texs.forEach(t => t.dispose())
      videosRef.current = []
    }
  }, [])

  useEffect(() => {
    const tick = () => {
      const targetBlur = 5 + Math.abs(velocityRef.current) * 50
      blurRef.current += (targetBlur - blurRef.current) * 0.06
      if (glassRef.current) {
        const b = blurRef.current.toFixed(1)
        glassRef.current.style.backdropFilter = `blur(${b}px)`
        glassRef.current.style.WebkitBackdropFilter = `blur(${b}px)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100dvh', background: '#000', position: 'relative' }}>
      <div style={{ width: '100%', height: '100%', filter: 'saturate(2.2) brightness(0.75)' }}>
        <Canvas camera={{ position: [0, 0, 4], fov: 60 }} scene={{ background: new THREE.Color('#000') }}>
          <Scene textures={textures} videos={videosRef.current} velocityRef={velocityRef} />
        </Canvas>
      </div>

      <div
        ref={glassRef}
        style={{
          position: 'absolute', inset: 0,
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          background: 'rgba(0, 4, 40, 0.15)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
