import { useRef, useEffect } from 'react'
import { pulseScroll } from '../schoenbergPiano'

export default function VideoPlayback() {
  const videoRef = useRef()
  const targetRate = useRef(1)
  const currentRate = useRef(1)

  useEffect(() => {
    const onWheel = (e) => {
      targetRate.current = Math.max(0.1, Math.min(2, targetRate.current - e.deltaY * 0.005))
      pulseScroll()
    }
    let lastY = 0
    const onTouchStart = (e) => { lastY = e.touches[0].clientY }
    const onTouchMove = (e) => {
      const dy = lastY - e.touches[0].clientY
      lastY = e.touches[0].clientY
      targetRate.current = Math.max(0.1, Math.min(2, targetRate.current - dy * 0.005))
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
    let raf
    const tick = () => {
      const video = videoRef.current
      if (video) {
        currentRate.current += (targetRate.current - currentRate.current) * 0.04
        video.playbackRate = currentRate.current
        if (video.paused) video.play().catch(() => {})
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        src="/videos/chris_desktop_bluedancer.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </div>
  )
}
