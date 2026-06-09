import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

const TILE_COUNT = 10
const FRAME_H = 2 * Math.tan((60 / 2) * (Math.PI / 180)) * 4
const TILE_W = FRAME_H * (16 / 9)
const OVERLAP = 0
const SPACING = TILE_W * (1 - OVERLAP)
const TOTAL_W = TILE_COUNT * SPACING
const BASE_SPEED = SPACING * 0.4

// colorShift: -1 = bubble gum pink, 0 = blue, +1 = forest green
const PALETTES = [
  { pink: [0.45, 0.22, 0.08], blue: [0.0, 0.05, 0.5], green: [0.0, 0.4,  0.1] },
  { pink: [0.55, 0.30, 0.12], blue: [0.1, 0.4,  1.0], green: [0.1, 0.8,  0.2] },
]

function lerpMask(a, b, t) {
  return a.map((v, i) => v + (b[i] - v) * t)
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const fragmentShader = `
  uniform sampler2D map;
  uniform vec3 channelMask;
  uniform float desaturate;
  varying vec2 vUv;
  void main() {
    vec3 tex = texture2D(map, vUv).rgb;
    vec3 colored = tex * channelMask;
    float luma = dot(tex, vec3(0.299, 0.587, 0.114));
    gl_FragColor = vec4(mix(colored, vec3(luma), desaturate), 1.0);
  }
`

function Strip({ texture, reverse, mirror, paletteIdx, targetDesaturate, targetColorShift }) {
  const groupRef = useRef()
  const scrollRef = useRef(0)
  const speedRef = useRef(BASE_SPEED)
  const palette = PALETTES[paletteIdx]

  const geometry = useMemo(() => new THREE.PlaneGeometry(TILE_W, FRAME_H), [])
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      channelMask: { value: new THREE.Vector3(...palette.blue) },
      desaturate: { value: 0 },
    },
    vertexShader,
    fragmentShader,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  }), [texture])

  useFrame((_, delta) => {
    // Lerp desaturation
    material.uniforms.desaturate.value = THREE.MathUtils.lerp(
      material.uniforms.desaturate.value,
      targetDesaturate.current,
      0.04
    )

    // Compute target mask from colorShift
    const cs = targetColorShift.current
    const targetMask = cs < 0
      ? lerpMask(palette.blue, palette.pink, -cs)
      : lerpMask(palette.blue, palette.green, cs)
    const u = material.uniforms.channelMask.value
    u.x = THREE.MathUtils.lerp(u.x, targetMask[0], 0.04)
    u.y = THREE.MathUtils.lerp(u.y, targetMask[1], 0.04)
    u.z = THREE.MathUtils.lerp(u.z, targetMask[2], 0.04)

    scrollRef.current += speedRef.current * delta
    const scroll = reverse ? -scrollRef.current : scrollRef.current
    const children = groupRef.current?.children
    if (!children) return
    for (let i = 0; i < children.length; i++) {
      const x = ((i * SPACING - scroll % TOTAL_W) % TOTAL_W + TOTAL_W) % TOTAL_W - TOTAL_W / 2
      children[i].position.x = x
    }
  })

  return (
    <group ref={groupRef} scale={[mirror ? -1 : 1, 1, 1]}>
      {Array.from({ length: TILE_COUNT }, (_, i) => (
        <mesh key={i} geometry={geometry} material={material} />
      ))}
    </group>
  )
}

function ColorDecay({ targetColorShift }) {
  useFrame(() => {
    targetColorShift.current = THREE.MathUtils.lerp(targetColorShift.current, 0, 0.015)
  })
  return null
}

function Scene() {
  const [texture, setTexture] = useState(null)
  const targetDesaturate  = useRef(0)
  const targetColorShift  = useRef(0)

  useEffect(() => {
    const v = document.createElement('video')
    v.src = '/videos/desktop_preRace2.mp4'
    v.loop = true
    v.muted = true
    v.playsInline = true
    v.play()
    v.playbackRate = 0.5
    const tex = new THREE.VideoTexture(v)
    tex.colorSpace = THREE.SRGBColorSpace
    setTexture(tex)
    return () => { v.pause(); v.src = ''; tex.dispose() }
  }, [])

  useEffect(() => {
    const onWheel = (e) => {
      targetDesaturate.current = THREE.MathUtils.clamp(targetDesaturate.current + e.deltaY * 0.005, 0, 1)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) + 3) {
        targetColorShift.current = THREE.MathUtils.clamp(targetColorShift.current + e.deltaX * 0.005, -1, 1)
      }
    }
    let lastY = 0, lastX = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY; lastX = e.touches[0].clientX }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      const dx = lastX - e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastX = e.touches[0].clientX
      targetDesaturate.current = THREE.MathUtils.clamp(targetDesaturate.current + dy * 0.005, 0, 1)
      if (Math.abs(dx) > Math.abs(dy) + 3) {
        targetColorShift.current = THREE.MathUtils.clamp(targetColorShift.current + dx * 0.005, -1, 1)
      }
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

  if (!texture) return null
  return (
    <>
      <ColorDecay targetColorShift={targetColorShift} />
      <Strip texture={texture} reverse={false} mirror={false} paletteIdx={0} targetDesaturate={targetDesaturate} targetColorShift={targetColorShift} />
      <Strip texture={texture} reverse={true}  mirror={true}  paletteIdx={1} targetDesaturate={targetDesaturate} targetColorShift={targetColorShift} />
    </>
  )
}

export default function VideoStripPreRaceCrossBlueGlass() {
  const glassRef = useRef(null)
  const velocityRef = useRef(0)
  const blurRef = useRef(4)
  const rafRef = useRef(null)

  useEffect(() => {
    const onWheel = (e) => {
      velocityRef.current += Math.abs(e.deltaY) * 0.01 + Math.abs(e.deltaX) * 0.01
    }
    let lastY = 0, lastX = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY; lastX = e.touches[0].clientX }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      const dx = lastX - e.touches[0].clientX
      lastY = e.touches[0].clientY
      lastX = e.touches[0].clientX
      velocityRef.current += Math.abs(dy) * 0.01 + Math.abs(dx) * 0.01
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

  useEffect(() => {
    const tick = () => {
      velocityRef.current *= 0.88
      const targetBlur = 4 + velocityRef.current * 40
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
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'relative' }}>
      <div style={{ width: '100%', height: '100%', filter: 'saturate(2.2) brightness(0.75)' }}>
        <Canvas
          camera={{ position: [0, 0, 4], fov: 60 }}
          scene={{ background: new THREE.Color('#000') }}
        >
          <Scene />
        </Canvas>
      </div>

      {/* Animated frosted glass overlay */}
      <div
        ref={glassRef}
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          background: 'rgba(0, 4, 40, 0.12)',
          pointerEvents: 'none',
        }}
      />

    </div>
  )
}
