import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'
import { pulseScroll } from '../schoenbergPiano'

const TILE_COUNT = 10
const FRAME_H = 2 * Math.tan((60 / 2) * (Math.PI / 180)) * 4
const TILE_W = FRAME_H * (16 / 9)
const OVERLAP = 0.3
const SPACING = TILE_W * (1 - OVERLAP)
const TOTAL_W = TILE_COUNT * SPACING
const BASE_SPEED = SPACING * 0.4
const PLAY_SPEED = 0.5

function Strip({ texture, video }) {
  const groupRef = useRef()
  const scrollRef = useRef(0)
  const videoTimeRef = useRef(0)
  const directionRef = useRef(-1)  // start reversed
  const keysRef = useRef(new Set())

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
      if (e.deltaY > 5)  directionRef.current = -1
      if (e.deltaY < -5) directionRef.current = 1
      pulseScroll()
    }
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') directionRef.current = -1
      if (e.key === 'ArrowUp')   directionRef.current = 1
      keysRef.current.add(e.key)
    }
    const onKeyUp = (e) => keysRef.current.delete(e.key)
    let lastY = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      lastY = e.touches[0].clientY
      if (dy > 2)  directionRef.current = -1
      if (dy < -2) directionRef.current = 1
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  useFrame((_, delta) => {
    const dir = directionRef.current

    // Tiles and video advance/retreat together
    scrollRef.current += BASE_SPEED * delta * dir

    const dur = video?.duration || 30
    videoTimeRef.current += PLAY_SPEED * delta * dir
    videoTimeRef.current = ((videoTimeRef.current % dur) + dur) % dur
    if (video?.readyState >= 2) video.currentTime = videoTimeRef.current

    const scroll = scrollRef.current
    const children = groupRef.current?.children
    if (!children) return
    for (let i = 0; i < children.length; i++) {
      children[i].position.x = ((i * SPACING - scroll % TOTAL_W) % TOTAL_W + TOTAL_W) % TOTAL_W - TOTAL_W / 2
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
  const videoRef = useRef(null)

  useEffect(() => {
    const v = document.createElement('video')
    v.src = '/videos/desktop_hurdles.mp4'
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    videoRef.current = v

    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace

    v.addEventListener('canplay', () => {
      v.currentTime = 0
      v.pause()
      setTexture(tex)
    }, { once: true })
    v.load()

    return () => { v.src = ''; tex.dispose() }
  }, [])

  if (!texture) return null
  return <Strip texture={texture} video={videoRef.current} />
}

export default function VideoStripHurdlesReverse() {
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
