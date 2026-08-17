import Link from 'next/link'
import { ArrowRight, UserPlus, Users, Video, BookOpen, ClipboardCheck, PenTool, Trophy, LineChart } from 'lucide-react'
import { PublicChrome } from '@/components/public-chrome'

export const metadata = { title: 'How it works — Heritage Club' }

const steps = [
  { icon: UserPlus, title: 'Enroll', text: 'Create a family account and add one or more children, or register as an independent student.' },
  { icon: Users, title: 'Join a cohort', text: 'Each learner is placed into an age-appropriate cohort with a small group and a dedicated educator.' },
  { icon: Video, title: 'Live sessions', text: 'Weekend live classes bring language, stories, and culture to life with a real teacher and peers.' },
  { icon: BookOpen, title: 'Lessons', text: 'Structured lessons across the four pillars, organised by module and week, at a sustainable pace.' },
  { icon: ClipboardCheck, title: 'Quizzes', text: 'Auto-scored quizzes reinforce learning and celebrate progress with instant feedback.' },
  { icon: PenTool, title: 'Assignments & projects', text: 'Creative projects let children express what they learn and share it with family.' },
  { icon: Trophy, title: 'Earn XP', text: 'Lessons, quizzes, and projects award XP — powering levels, streaks, and a friendly leaderboard.' },
  { icon: LineChart, title: 'Track progress', text: 'Parents and learners follow the journey with a clear, encouraging view of every milestone.' },
]

export default function HowItWorksPage() {
  return (
    <PublicChrome>
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-20 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[.24em] text-accent">How it works</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] text-balance sm:text-7xl">From first lesson to lifelong connection.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Heritage Club is a guided journey. Every step is designed to move learning from the screen into everyday family life.
            </p>
          </div>
        </section>

        <section className="border-t border-border bg-muted/40 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.title} className="group bg-background p-7 transition hover:bg-foreground hover:text-background">
                  <div className="flex items-center justify-between">
                    <s.icon className="h-6 w-6 text-accent" />
                    <span className="font-mono text-[10px] text-muted-foreground group-hover:text-background/60">0{i + 1}</span>
                  </div>
                  <h3 className="mt-14 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground group-hover:text-background/65">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12">
            <h2 className="max-w-2xl font-serif text-3xl sm:text-4xl">Ready to begin the journey?</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">Enroll today and give your child a meaningful connection to their African heritage.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/enroll" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Enroll Now <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/pricing" className="rounded-full border border-border px-5 py-3 text-sm">View pricing</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicChrome>
  )
}
