import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const SRCS = ['/videos/diver2.mp4']
const N = SRCS.length
const VIDEO_ASPECT = 1280 / 766
const REPEATS = 15
const TILE_COUNT = N * REPEATS
const OVERLAP = 0.25
const PLAY_SPEED = 0.45

const vertShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragShader = `
  uniform sampler2D map;
  uniform float time;
  uniform float colorShift;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float lineId = floor(vUv.y * 60.0);
    float glitchOn = step(0.97, hash(vec2(lineId, floor(time * 4.0))));
    float shift = (hash(vec2(lineId + 0.5, floor(time * 4.0))) - 0.5) * 0.04 * glitchOn;

    vec3 tex = texture2D(map, vec2(vUv.x + shift, vUv.y)).rgb;

    vec3 blue      = vec3(0.0, 0.05, 0.5);
    vec3 blueColor = tex * blue;
    vec3 fullColor = tex;
    vec3 negColor  = (vec3(1.0) - tex) * blue;

    vec3 colored = mix(blueColor, fullColor, max(colorShift, 0.0));
    colored      = mix(colored,   negColor,  max(-colorShift, 0.0));

    float noise = hash(vUv * 300.0 + fract(time * 11.3)) * 0.06;
    colored += vec3(0.0, noise * 0.1, noise);

    float alpha = smoothstep(0.0, ${OVERLAP.toFixed(2)}, vUv.y)
                * smoothstep(0.0, ${OVERLAP.toFixed(2)}, 1.0 - vUv.y);

    gl_FragColor = vec4(colored, alpha);
  }
`

function Strip({ textures, videos }) {
  const { viewport } = useThree()
  const TILE_W = viewport.width
  const TILE_H = TILE_W / VIDEO_ASPECT
  const SPACING = TILE_H * (1 - OVERLAP)
  const TOTAL_H = TILE_COUNT * SPACING

  const meshRefs = useRef([])
  const scrollRef = useRef(0)
  const colorShiftRef = useRef(0)
  const speedMultRef = useRef(1)
  const directionRef = useRef(1)   // +1 forward, -1 backward
  const videoTimeRef = useRef(0)
  const keysRef = useRef(new Set())

  const geometry = useMemo(() => new THREE.PlaneGeometry(TILE_W, TILE_H), [TILE_W, TILE_H])
  const materials = useMemo(() => textures.map(tex => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, time: { value: 0 }, colorShift: { value: 0 } },
    vertexShader: vertShader,
    fragmentShader: fragShader,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })), [textures])

  useEffect(() => {
    const onWheel = (e) => {
      if (e.deltaY > 5)  directionRef.current = -1
      if (e.deltaY < -5) directionRef.current = 1
      colorShiftRef.current = THREE.MathUtils.clamp(
        colorShiftRef.current + e.deltaX * 0.008, -1, 1
      )
    }
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') directionRef.current = -1
      if (e.key === 'ArrowUp')   directionRef.current = 1
      keysRef.current.add(e.key)
    }
    const onKeyUp = (e) => keysRef.current.delete(e.key)
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    let ch
    try { ch = new BroadcastChannel('diver-control') } catch { return }
    ch.onmessage = (e) => {
      const d = e.data
      if (d.ping) { ch.postMessage({ pong: true }); return }
      if (d.colorShift != null) colorShiftRef.current = d.colorShift
      if (d.speedMult  != null) speedMultRef.current  = THREE.MathUtils.clamp(d.speedMult, 0, 3)
    }
    return () => ch.close()
  }, [])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // Arrow left/right → colour shift
    const keys = keysRef.current
    if (keys.has('ArrowRight')) colorShiftRef.current = THREE.MathUtils.clamp(colorShiftRef.current + 0.02, -1, 1)
    if (keys.has('ArrowLeft'))  colorShiftRef.current = THREE.MathUtils.clamp(colorShiftRef.current - 0.02, -1, 1)

    colorShiftRef.current = THREE.MathUtils.lerp(colorShiftRef.current, 0, 0.03)
    speedMultRef.current  = THREE.MathUtils.lerp(speedMultRef.current,  1, 0.02)

    materials.forEach(m => {
      m.uniforms.time.value = t
      m.uniforms.colorShift.value = colorShiftRef.current
    })

    // Advance video time manually — stays in direction until flipped
    const dur = videos[0]?.duration || 31
    videoTimeRef.current += PLAY_SPEED * delta * directionRef.current * speedMultRef.current
    videoTimeRef.current = ((videoTimeRef.current % dur) + dur) % dur
    videos.forEach(v => { if (v.readyState >= 2) v.currentTime = videoTimeRef.current })

    // Slow tile drift
    scrollRef.current += TILE_H * 0.025 * delta

    for (let i = 0; i < TILE_COUNT; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue
      const center = i * SPACING
      mesh.position.y = ((center + scrollRef.current % TOTAL_H) % TOTAL_H + TOTAL_H) % TOTAL_H - TOTAL_H / 2
    }
  })

  return (
    <>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el }}
          geometry={geometry}
          material={materials[i % N]}
        />
      ))}
    </>
  )
}

function Scene() {
  const [textures, setTextures] = useState(null)
  const videosRef = useRef([])

  useEffect(() => {
    const videos = SRCS.map(src => {
      const v = document.createElement('video')
      v.src = src
      v.muted = true
      v.playsInline = true
      v.preload = 'auto'
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
      ready++
      if (ready === videos.length) {
        videos.forEach(v => { v.currentTime = 0; v.pause() })
        setTextures(texs)
      }
    }
    videos.forEach(v => v.addEventListener('canplay', onReady, { once: true }))
    videos.forEach(v => v.load())

    return () => {
      videos.forEach(v => { v.src = '' })
      texs.forEach(t => t.dispose())
    }
  }, [])

  if (!textures) return null
  return <Strip textures={textures} videos={videosRef.current} />
}

export default function VideoDiver3() {
  // Lifted from ~/Three/src/spin. Its own fullscreen button and the container
  // that served it are gone — alextaves-site renders one globally, bottom
  // right, and two would sit on top of each other.
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', cursor: 'none' }}>
      <div style={{ width: '100%', height: '100%', filter: 'blur(3px) saturate(2.2) brightness(0.75)' }}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 60 }}
          scene={{ background: new THREE.Color('#000') }}
        >
          <Scene />
        </Canvas>
      </div>
    </div>
  )
}
