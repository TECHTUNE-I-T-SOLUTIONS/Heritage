'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

const VIDEO_SOURCES = [
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

/** Dimmed video carousel used as the backdrop of the auth panel. */
function AuthVideoBackground() {
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
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        className="h-full w-full object-cover opacity-45"
        src={VIDEO_SOURCES[index]}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={() => setIndex((i) => (i + 1) % VIDEO_SOURCES.length)}
      />
      <div className="absolute inset-0 bg-primary/75 mix-blend-multiply" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/40 to-primary/70" />
    </div>
  )
}

export interface AuthTestimonial {
  quote: string
  name: string
  role: string
  initials: string
}

const DEFAULT_TESTIMONIAL: AuthTestimonial = {
  quote:
    'My children finally have words for who they are. Heritage Club gave them language, stories, and a pride they carry everywhere.',
  name: 'Ngozi A.',
  role: 'Parent of two, Toronto',
  initials: 'NA',
}

/**
 * Split-screen authentication shell.
 * Left: brand chrome + form content. Right: decorative testimonial panel,
 * hidden below `lg` so mobile shows a clean, centered form-only view.
 */
export function AuthSplit({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  testimonial = DEFAULT_TESTIMONIAL,
  wide = false,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
  testimonial?: AuthTestimonial
  wide?: boolean
}) {
  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* Form panel */}
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
            <Logo />
            <p className="mt-8 text-xs font-medium uppercase tracking-[.22em] text-accent">{eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            {children}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md text-center text-xs leading-5 text-muted-foreground lg:mx-0 lg:text-left">
          {footer ?? (
            <p>
              By continuing you agree to our{' '}
              <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link>,{' '}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>{' '}and{' '}
              <Link href="/cookies" className="underline underline-offset-4 hover:text-foreground">Cookie Policy</Link>.
            </p>
          )}
        </div>
      </div>

      {/* Decorative testimonial panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <AuthVideoBackground />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, currentColor 0, transparent 45%), radial-gradient(circle at 80% 60%, currentColor 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-current/25 px-3 py-1 text-xs uppercase tracking-[.22em]">
            Heritage Club
          </span>
          <p className="mt-10 max-w-md font-serif text-3xl leading-snug">
            Roots that travel with them — wherever life takes your family.
          </p>
        </div>

        <figure className="relative max-w-md">
          <blockquote className="font-serif text-xl leading-relaxed">“{testimonial.quote}”</blockquote>
          <figcaption className="mt-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/15 text-sm font-medium">
              {testimonial.initials}
            </span>
            <span className="text-sm">
              <span className="block font-medium">{testimonial.name}</span>
              <span className="block text-primary-foreground/70">{testimonial.role}</span>
            </span>
          </figcaption>
        </figure>
      </aside>
    </main>
  )
}
