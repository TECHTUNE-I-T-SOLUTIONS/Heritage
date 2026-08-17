import Link from 'next/link'
import { ArrowRight, BookOpen, Feather, Landmark, Languages, Sparkles } from 'lucide-react'
import { PublicChrome } from '@/components/public-chrome'

export const metadata = { title: 'About — Heritage Club' }

const pillars = [
  { icon: Languages, title: 'Language', text: 'Helping children discover and engage with African languages as a living bridge between generations.' },
  { icon: BookOpen, title: 'Stories & History', text: 'African stories, historical knowledge, and cultural narratives that make the past vivid and relevant.' },
  { icon: Landmark, title: 'Values & Symbols', text: 'Understanding values, traditions, symbols, and the many expressions of cultural identity.' },
  { icon: Feather, title: 'Creative Expression', text: 'Encouraging children to express what they learn through creative, shareable projects.' },
]

export default function AboutPage() {
  return (
    <PublicChrome>
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-14 pt-20 lg:px-8 lg:pb-20 lg:pt-28">
          <div className="max-w-4xl">
            <p className="text-xs font-medium uppercase tracking-[.24em] text-accent">About Heritage Club</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] text-balance sm:text-7xl">A meaningful connection to where we come from.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Heritage Club is a structured online cultural heritage programme for African children in the diaspora — bringing African
              languages, history, stories, values, traditions, identity, and creative expression into one thoughtful learning journey.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-primary p-8 text-primary-foreground">
              <Sparkles className="h-6 w-6 text-accent" />
              <h2 className="mt-6 font-serif text-2xl">Why heritage matters</h2>
              <p className="mt-3 leading-7 text-primary-foreground/75">
                Growing up far from where your family's story began can make heritage feel distant. Heritage Club helps children keep a
                meaningful, everyday connection to their culture — building confidence, belonging, and a sense of who they are.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-8">
              <BookOpen className="h-6 w-6 text-accent" />
              <h2 className="mt-6 font-serif text-2xl">Built for families across borders</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                Live sessions, visual storytelling, quizzes, projects, and progress tracking make heritage learning easy to sustain — a
                modern international education experience that celebrates African heritage.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-border bg-muted/40 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="font-mono text-[10px] uppercase tracking-[.26em] text-accent">The four pillars</p>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl tracking-tight sm:text-5xl">Four ways to discover, understand, and carry heritage forward.</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {pillars.map((p) => (
                <div key={p.title} className="group bg-background p-7 transition hover:bg-foreground hover:text-background">
                  <p.icon className="h-6 w-6 text-accent" />
                  <h3 className="mt-16 text-xl font-semibold">{p.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground group-hover:text-background/65">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="rounded-3xl border border-border bg-card p-8 sm:p-12">
            <h2 className="max-w-2xl font-serif text-3xl sm:text-4xl">A modern cultural learning experience helping the next generation connect with their African heritage.</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">Heritage Club is a new education product under Damzy Next Gen — its own identity, part of a growing ecosystem.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/enroll" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground">Enroll Now <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/how-it-works" className="rounded-full border border-border px-5 py-3 text-sm">See how it works</Link>
            </div>
          </div>
        </section>
      </main>
    </PublicChrome>
  )
}
