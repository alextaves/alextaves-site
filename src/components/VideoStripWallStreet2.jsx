import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const HALF_COUNT = 8
const FRAME_H = 2 * Math.tan((60 / 2) * (Math.PI / 180)) * 4
const TILE_W = FRAME_H * (9 / 16)
const SPACING = 2 * TILE_W
const TOTAL_W = HALF_COUNT * SPACING
const BASE_SPEED = TILE_W * 0.4

const staticVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Single base layer: #314858, black, white stripes at 50px
const stripeFrag = `
  uniform float time;
  varying vec2 vUv;
  void main() {
    float s = mod(floor((vUv.x + time * 0.15) * 38.0), 2.0);
    vec3 color = s < 1.0 ? vec3(0.192, 0.282, 0.345) : vec3(1.0);
    gl_FragColor = vec4(color, 1.0);
  }
`

function StripeBG() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: staticVert,
    fragmentShader: stripeFrag,
  }), [])
  const geometry = useMemo(() => new THREE.PlaneGeometry(30, 30), [])

  useFrame((state) => {
    material.uniforms.time.value = state.clock.elapsedTime
  })

  return <mesh geometry={geometry} material={material} position={[0, 0, -0.1]} />
}

function Weave({ texture, scrollRef, offset }) {
  const meshRefs = useRef([])

  const geometry = useMemo(() => new THREE.PlaneGeometry(TILE_W, FRAME_H), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    blending: THREE.MultiplyBlending,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  }), [texture])

  useFrame(() => {
    const scroll = scrollRef.current + offset
    for (let i = 0; i < HALF_COUNT; i++) {
      const fwd = meshRefs.current[i]
      if (fwd) {
        fwd.position.x = ((i * SPACING - scroll % TOTAL_W) % TOTAL_W + TOTAL_W) % TOTAL_W - TOTAL_W / 2
      }
      const bwd = meshRefs.current[HALF_COUNT + i]
      if (bwd) {
        bwd.position.x = ((i * SPACING + TILE_W + scroll % TOTAL_W) % TOTAL_W + TOTAL_W) % TOTAL_W - TOTAL_W / 2
      }
    }
  })

  return (
    <>
      {Array.from({ length: HALF_COUNT * 2 }, (_, i) => (
        <mesh key={i} ref={el => { meshRefs.current[i] = el }} geometry={geometry} material={material} />
      ))}
    </>
  )
}

function Scene() {
  const [texture, setTexture] = useState(null)
  const scrollRef = useRef(0)
  const speedRef = useRef(0)
  const targetSpeedRef = useRef(0)

  useEffect(() => {
    const v = document.createElement('video')
    v.src = '/videos/wallstreetwalking_panel1.mp4'
    v.loop = true
    v.muted = true
    v.playsInline = true
    v.play()
    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace
    setTexture(tex)
    return () => { v.pause(); v.src = ''; tex.dispose() }
  }, [])

  useEffect(() => {
    const onWheel = (e) => {
      targetSpeedRef.current = THREE.MathUtils.clamp(
        targetSpeedRef.current + e.deltaY * 0.04,
        0,
        BASE_SPEED * 1.5
      )
    }
    let lastY = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      lastY = e.touches[0].clientY
      targetSpeedRef.current = THREE.MathUtils.clamp(
        targetSpeedRef.current + dy * 0.04,
        0,
        BASE_SPEED * 1.5
      )
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

  useFrame((_, delta) => {
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeedRef.current, 0.05)
    scrollRef.current += speedRef.current * delta
  })

  if (!texture) return null
  return (
    <>
      <StripeBG />
      <Weave texture={texture} scrollRef={scrollRef} offset={0} />
      <Weave texture={texture} scrollRef={scrollRef} offset={TILE_W / 6} />
      <Weave texture={texture} scrollRef={scrollRef} offset={TILE_W * 2 / 6} />
      <Weave texture={texture} scrollRef={scrollRef} offset={TILE_W * 3 / 6} />
      <Weave texture={texture} scrollRef={scrollRef} offset={TILE_W * 4 / 6} />
      <Weave texture={texture} scrollRef={scrollRef} offset={TILE_W * 5 / 6} />
    </>
  )
}

export default function VideoStripWallStreet2() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      <div style={{ width: '100%', height: '100%', filter: 'blur(6px)' }}>
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
