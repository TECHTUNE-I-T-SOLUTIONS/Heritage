'use client'

import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

const HIGHLIGHTS: Record<'educator' | 'admin', { label: string; points: string[] }> = {
  educator: {
    label: 'Educator portal',
    points: [
      'Lead live small-group sessions with your assigned cohorts.',
      'Publish lessons, quizzes and assignments in a few clicks.',
      'Track every learner’s progress and give timely feedback.',
    ],
  },
  admin: {
    label: 'Operations centre',
    points: [
      'Assign learners to cohorts and manage educators.',
      'Oversee subscriptions, payments and curriculum.',
      'Moderate content and keep the community safe.',
    ],
  },
}

/**
 * Split-screen shell for staff (educator / admin) auth pages.
 * Distinct from the member AuthSplit: a calm, credential-forward panel
 * that reads as a private staff portal rather than a marketing signup.
 */
export function StaffAuthSplit({
  portal,
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  portal: 'educator' | 'admin'
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const info = HIGHLIGHTS[portal]
  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[1.05fr_1fr]">
      <div className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Logo />
            <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-[.18em] text-accent">
              <ShieldCheck className="h-3.5 w-3.5" /> {eyebrow}
            </span>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{subtitle}</p>
            {children}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md text-center text-xs leading-5 text-muted-foreground lg:mx-0 lg:text-left">
          {footer}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, currentColor 0, transparent 45%), radial-gradient(circle at 80% 60%, currentColor 0, transparent 40%)',
          }}
        />
        <div className="relative">
          <span className="inline-flex items-center rounded-full border border-current/25 px-3 py-1 text-xs uppercase tracking-[.22em]">
            {info.label}
          </span>
          <p className="mt-10 max-w-md font-serif text-3xl leading-snug">
            The people who make Heritage Club feel like home.
          </p>
        </div>

        <ul className="relative max-w-md space-y-4">
          {info.points.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm leading-relaxed">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/80" />
              <span className="text-primary-foreground/90">{p}</span>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  )
}
