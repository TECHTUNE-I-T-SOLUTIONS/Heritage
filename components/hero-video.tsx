'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Full-bleed background that plays a set of videos back-to-back on loop.
 * When one clip ends, the next begins; after the last it wraps to the first.
 * Muted + playsInline so it can autoplay on mobile browsers.
 */
const SOURCES = [
  '/vic-2.webm',
  '/vic-3.webm',
  '/vic-4.webm',
  '/vic2-1.webm',
  '/vic2-2.webm',
  '/vic2-3.webm',
  '/vic2-4.webm',
  '/vic2-5.webm',
  '/vic2-6.webm',
  '/vic2-7.webm',
]

export function HeroVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.load()
    const play = v.play()
    if (play && typeof play.catch === 'function') play.catch(() => {})
  }, [index])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-foreground">
      <video
        ref={videoRef}
        className="h-full w-full object-cover opacity-100"
        src={SOURCES[index]}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setIndex((i) => (i + 1) % SOURCES.length)}
      />
      {/* Legibility scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/80" />
    </div>
  )
}
