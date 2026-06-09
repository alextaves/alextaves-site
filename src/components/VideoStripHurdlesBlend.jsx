import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const TILE_COUNT = 10
const FRAME_H = 2 * Math.tan((60 / 2) * (Math.PI / 180)) * 4
const TILE_W = FRAME_H * (16 / 9)
const OVERLAP = 0.3
const SPACING = TILE_W * (1 - OVERLAP)
const TOTAL_W = TILE_COUNT * SPACING
const BASE_SPEED = SPACING * 0.4

function Strip({ texture }) {
  const groupRef = useRef()
  const scrollRef = useRef(0)
  const speedRef = useRef(BASE_SPEED)
  const targetSpeedRef = useRef(BASE_SPEED)

  const geometry = useMemo(() => new THREE.PlaneGeometry(TILE_W, FRAME_H), [])

  const material = useMemo(() => new THREE.MeshBasicMaterial({
    map: texture,
    blending: THREE.MultiplyBlending,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  }), [texture])

  useEffect(() => {
    const onWheel = (e) => {
      targetSpeedRef.current = THREE.MathUtils.clamp(
        targetSpeedRef.current + e.deltaY * 0.3,
        BASE_SPEED * 0.1,
        BASE_SPEED * 15
      )
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  useFrame((_, delta) => {
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeedRef.current, 0.05)
    scrollRef.current += speedRef.current * delta
    const scroll = scrollRef.current
    const children = groupRef.current?.children
    if (!children) return
    for (let i = 0; i < children.length; i++) {
      const x = ((i * SPACING - scroll % TOTAL_W) % TOTAL_W + TOTAL_W) % TOTAL_W - TOTAL_W / 2
      children[i].position.x = x
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <mesh key={i} geometry={geometry} material={material} />
      ))}
    </group>
  )
}

function Scene() {
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    const v = document.createElement('video')
    v.src = '/videos/desktop_hurdles.mp4'
    v.loop = true
    v.muted = true
    v.playsInline = true
    v.play()
    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace
    setTexture(tex)
    return () => { v.pause(); v.src = ''; tex.dispose() }
  }, [])

  if (!texture) return null
  return <Strip texture={texture} />
}

export default function VideoStripHurdlesBlend() {
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
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
        fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)', pointerEvents: 'none',
      }}>
        scroll to change speed
      </div>
    </div>
  )
}
