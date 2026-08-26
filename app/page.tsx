'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicFooter, PublicHeader } from '@/components/public-chrome'
import { HeroVideoBackground } from '@/components/hero-video'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Play,
  Quote,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'

type Role = 'student' | 'parent' | 'educator' | 'admin'

const roles: { id: Role; label: string; icon: typeof GraduationCap }[] = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'parent', label: 'Parent', icon: Users },
  { id: 'educator', label: 'Educator', icon: BookOpen },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
]

const pillars = [
  { number: '01', title: 'Identity', text: 'Know where you come from, and carry it forward with confidence.', icon: Sparkles },
  { number: '02', title: 'Language', text: 'Learn language as a living bridge between generations.', icon: BookOpen },
  { number: '03', title: 'History', text: 'Understand the stories, people, and places that shaped us.', icon: Clock3 },
  { number: '04', title: 'Community', text: 'Grow alongside a cohort that celebrates every milestone.', icon: Users },
]

const journey = [
  { label: 'Discover', title: 'Start with a story', text: 'Explore the people, places, and traditions that make your heritage yours.' },
  { label: 'Practice', title: 'Make it part of you', text: 'Build language fluency through live lessons, creative projects, and repetition.' },
  { label: 'Share', title: 'Pass it on', text: 'Turn learning into family rituals, conversations, and a legacy of your own.' },
]

function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <a href="#top" className={`group inline-flex items-center gap-3 ${inverse ? 'text-primary-foreground' : 'text-foreground'}`} aria-label="Heritage Club home">
      <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${inverse ? 'border-primary-foreground/50' : 'border-foreground/30'}`}>
        <span className="font-serif text-lg leading-none">H</span>
      </span>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.26em]">Heritage Club</span>
    </a>
  )
}

function Button({ children, href, variant = 'dark', onClick, className = '' }: { children: React.ReactNode; href?: string; variant?: 'dark' | 'outline' | 'light'; onClick?: () => void; className?: string }) {
  const styles = variant === 'dark' ? 'bg-foreground text-background hover:opacity-85' : variant === 'light' ? 'bg-background text-foreground hover:bg-muted' : 'border border-border text-foreground hover:bg-muted'
  const props = { onClick, className: `inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition ${styles} ${className}` }
  return href ? <a href={href} {...props}>{children}</a> : <button type="button" {...props}>{children}</button>
}

function ProgressBar({ value, tone = 'default' }: { value: number; tone?: 'default' | 'warm' }) {
  return <div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all ${tone === 'warm' ? 'bg-accent' : 'bg-foreground'}`} style={{ width: `${value}%` }} /></div>
}

function DashboardPreview({ role }: { role: Role }) {
  const content = {
    student: { eyebrow: 'Good morning, Amara', title: 'Your next chapter starts here.', description: 'Keep building your story, one lesson at a time.', stats: [['Current streak', '12 days'], ['XP earned', '2,480'], ['Lessons done', '18']], focus: 'Yoruba Language & Identity', detail: 'Module 04 · Greetings & introductions', progress: 68, action: 'Continue lesson' },
    parent: { eyebrow: 'Family overview', title: 'A clearer view of Amara’s journey.', description: 'Support the moments that make learning stick.', stats: [['This week', '3h 20m'], ['Lessons complete', '18'], ['Current streak', '12 days']], focus: 'Saturday class', detail: 'Yoruba Language & Identity · 6:00 PM', progress: 74, action: 'View progress' },
    educator: { eyebrow: 'Educator workspace', title: 'Teach with the full picture.', description: 'Plan, connect, and celebrate every learner.', stats: [['Active learners', '24'], ['Avg. attendance', '92%'], ['Submissions', '8']], focus: 'Next live session', detail: 'HC-09-12-A · Saturday · 6:00 PM', progress: 86, action: 'Open class room' },
    admin: { eyebrow: 'Admin overview', title: 'The whole community, in one place.', description: 'Keep the club moving with calm, useful visibility.', stats: [['Active members', '184'], ['Cohorts', '12'], ['Attendance', '94%']], focus: 'Cohort health', detail: '9 of 12 cohorts are on track this week', progress: 78, action: 'View operations' },
  }[role]

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-foreground/10">
      <div className="flex min-h-14 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-accent" /><span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">HC / {role}</span></div>
        <div className="flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">HC-09-12-A</span><div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">AJ</div></div>
      </div>
      <div className="grid md:grid-cols-[170px_1fr]">
        <aside className="hidden border-r border-border bg-muted/40 p-4 md:block"><div className="mb-8 font-mono text-[10px] uppercase tracking-[0.2em]">Workspace</div><nav className="space-y-1">{['Overview', 'My learning', 'Community', 'Resources'].map((item, index) => <button type="button" key={item} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs ${index === 0 ? 'bg-background font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><LayoutDashboard className="h-3.5 w-3.5" />{item}</button>)}</nav></aside>
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-accent">{content.eyebrow}</p><h3 className="max-w-md text-2xl font-semibold tracking-tight sm:text-3xl">{content.title}</h3><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{content.description}</p></div><button type="button" aria-label="Notifications" className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted"><CircleHelp className="h-4 w-4" /></button></div>
          <div className="mb-7 grid grid-cols-3 gap-2 sm:gap-3">{content.stats.map(([label, value]) => <div key={label} className="rounded-2xl border border-border p-3 sm:p-4"><div className="mb-2 font-mono text-[9px] uppercase leading-4 tracking-widest text-muted-foreground">{label}</div><div className="text-lg font-semibold sm:text-xl">{value}</div></div>)}</div>
          <div className="grid gap-4 sm:grid-cols-[1.1fr_.9fr]"><div className="rounded-2xl bg-foreground p-5 text-background"><div className="mb-8 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest opacity-60">Focus now</span><ArrowRight className="h-4 w-4" /></div><h4 className="text-xl font-semibold">{content.focus}</h4><p className="mt-2 text-sm leading-6 opacity-65">{content.detail}</p><div className="mt-6"><div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-widest opacity-60"><span>Progress</span><span>{content.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-background/20"><div className="h-full rounded-full bg-accent" style={{ width: `${content.progress}%` }} /></div></div><button type="button" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">{content.action}<ChevronRight className="h-4 w-4" /></button></div><div className="rounded-2xl border border-border p-5"><div className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"><Zap className="h-3.5 w-3.5 text-accent" /> This week</div><div className="space-y-5"><div><div className="mb-2 flex justify-between text-sm"><span>Learning goal</span><span className="font-semibold">4 / 5</span></div><ProgressBar value={80} tone="warm" /></div><div><div className="mb-2 flex justify-between text-sm"><span>Community moments</span><span className="font-semibold">3 / 4</span></div><ProgressBar value={68} /></div></div><div className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Small, consistent steps become a lifelong connection.</div></div></div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const [role, setRole] = useState<Role>('student')
  const [enrolled, setEnrolled] = useState(false)
  const [plan, setPlan] = useState('Full Club')

  return <div id="top">
    <PublicHeader />
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative isolate overflow-hidden px-5 pb-20 pt-26 sm:px-8 sm:pb-28 sm:pt-24"><HeroVideoBackground /><div className="mx-auto grid max-w-7xl items-end gap-14 lg:grid-cols-[1.05fr_.95fr]"><div><p className="mb-7 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> A learning home for the next generation</p><h1 className="max-w-4xl text-balance font-serif text-5xl leading-[.98] tracking-[-.045em] text-white sm:text-7xl lg:text-[6.5rem]">Know your story.<br /><span className="text-white/60">Shape what’s next.</span></h1><p className="mt-8 max-w-lg text-base leading-7 text-white/80 sm:text-lg">Heritage Club is a modern learning community helping young people connect with their culture, their families, and the future they’re building.</p><div className="mt-9 flex flex-wrap gap-3"><Button href="/enroll" variant="light">Enroll Now <ArrowRight className="h-4 w-4" /></Button><Button href="/login" variant="outline" className="!border-white/40 !text-white hover:!bg-white/10"><Play className="h-4 w-4" /> Sign In</Button></div>
        <div className="mt-12 flex items-center gap-3 text-xs text-white/70">
          <div className="flex -space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-accent text-[10px] font-bold">AJ</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-white/20 text-[10px] font-bold text-white">KO</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-[10px] font-bold text-white">MS</span>
          </div>
          <span>Built for curious minds and the people who raise them.</span>
        </div>
      </div>
        <div className="relative"><div className="relative aspect-[.92] overflow-hidden rounded-[2rem] bg-foreground/85 p-6 text-background backdrop-blur-sm sm:p-10 w-120"><div className="absolute right-7 top-7 h-20 w-20 rounded-full border border-background/25 sm:h-28 sm:w-28" /><div className="absolute bottom-10 left-10 h-36 w-36 rounded-full border border-background/15" />
          <div className="relative flex h-full flex-col justify-between"><div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.26em] opacity-60">Field notes / 001</span><span className="rounded-full border border-background/25 px-3 py-1 font-mono text-[9px] uppercase tracking-widest opacity-70">Est. 2026</span></div><div><p className="mb-6 max-w-xs font-serif text-4xl leading-[1.02] sm:text-5xl">The future remembers what we choose to carry.</p><div className="flex items-center gap-3 border-t border-background/20 pt-5 text-xs opacity-65"><span className="h-2 w-2 rounded-full bg-accent" /> Learn deeply. Live fully. Pass it on.</div></div></div></div><div className="absolute -bottom-14 -left-4 rounded-2xl border border-border bg-card p-4 shadow-xl sm:-left-8"><div className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">This week’s prompt</div><p className="max-w-[170px] text-sm font-medium leading-5">What story from home do you want to remember?</p></div></div></div></section>
      <section id="why" className="border-y border-border bg-muted/40 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="mb-12 grid gap-6 lg:grid-cols-[.7fr_1.3fr]"><p className="font-mono text-[10px] uppercase tracking-[.26em] text-accent">01 / Why heritage</p><div><h2 className="max-w-3xl text-balance text-4xl font-semibold tracking-[-.035em] sm:text-6xl">A stronger sense of self is a superpower.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">Not a textbook. Not a one-off workshop. A living, breathing space to learn who you are and find your people.</p></div></div><div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">{pillars.map((pillar) => <div key={pillar.title} className="group bg-background p-6 transition hover:bg-foreground hover:text-background sm:p-7"><div className="mb-16 flex items-center justify-between"><span className="font-mono text-[10px] text-muted-foreground group-hover:text-background/60">{pillar.number}</span><pillar.icon className="h-5 w-5 text-accent" /></div><h3 className="text-xl font-semibold">{pillar.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground group-hover:text-background/65">{pillar.text}</p></div>)}</div></div></section>
      <section id="journey" className="px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="mb-14 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.26em] text-accent">02 / The journey</p><h2 className="text-4xl font-semibold tracking-[-.035em] sm:text-6xl">Learn in a way<br /><span className="text-muted-foreground">that stays with you.</span></h2></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">Every part of Heritage Club is designed to move from screen to real life.</p></div><div className="grid gap-10 lg:grid-cols-3">{journey.map((item, index) => <div key={item.label} className="relative border-t border-border pt-5"><div className="mb-16 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.22em] text-accent">{item.label}</span><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span></div><h3 className="max-w-sm text-2xl font-semibold tracking-tight">{item.title}</h3><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{item.text}</p></div>)}</div></div></section>
      <section id="preview" className="bg-muted/40 px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.26em] text-accent">03 / Explore the club</p><h2 className="max-w-2xl text-4xl font-semibold tracking-[-.035em] sm:text-6xl">One club.<br /><span className="text-muted-foreground">Every perspective.</span></h2></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">Take a look around. This is a preview of the experience we’re building together.</p></div><div className="mb-7 flex gap-2 overflow-x-auto pb-2">{roles.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setRole(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${role === id ? 'border-foreground bg-foreground text-background' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}><Icon className="h-4 w-4" />{label}</button>)}</div><DashboardPreview role={role} /></div></section>
      <section id="membership" className="px-5 py-20 sm:px-8 sm:py-28"><div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="mb-5 font-mono text-[10px] uppercase tracking-[.26em] text-accent">04 / Membership</p><h2 className="text-4xl font-semibold tracking-[-.035em] sm:text-6xl">A place to<br /><span className="text-muted-foreground">belong and become.</span></h2><p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">Choose the rhythm that fits your family. Every membership includes access to the Heritage Club learning home.</p></div><div className="grid gap-4 sm:grid-cols-2"><div onClick={() => setPlan('Full Club')} className={`cursor-pointer rounded-3xl border p-6 transition sm:p-8 ${plan === 'Full Club' ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:border-foreground/40'}`}><div className="mb-12 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest opacity-60">Most popular</span><Check className="h-4 w-4 text-accent" /></div><h3 className="text-2xl font-semibold">Individual</h3><p className="mt-2 text-sm leading-6 opacity-65">Full access for one child.</p><div className="mt-8 text-3xl font-semibold">$59<span className="text-sm font-normal opacity-60"> CAD / month</span></div><div className="mt-7 space-y-3 text-sm">{['Full programme access', 'Live weekend classes', 'Quizzes, assignments & projects'].map(item => <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{item}</div>)}</div></div><div onClick={() => setPlan('Library')} className={`cursor-pointer rounded-3xl border p-6 transition sm:p-8 ${plan === 'Library' ? 'border-foreground bg-foreground text-background' : 'border-border bg-card hover:border-foreground/40'}`}><div className="mb-12 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">For families</span><BookOpen className="h-4 w-4 text-accent" /></div><h3 className="text-2xl font-semibold">Family</h3><p className="mt-2 text-sm leading-6 opacity-65">Enroll 2–4 children with sibling learning paths.</p><div className="mt-8 text-3xl font-semibold">$109<span className="text-sm font-normal opacity-60"> CAD / month</span></div><div className="mt-7 space-y-3 text-sm">{['2 children (up to 4 available)', 'Everything in Individual', 'Family progress dashboard'].map(item => <div key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" />{item}</div>)}</div></div></div></div><div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-4 sm:p-5"><div className="flex items-center gap-3 text-sm"><CreditCard className="h-4 w-4 text-accent" /><span>Plans from <strong>CAD $59/month</strong></span><Link href="/pricing" className="hidden text-muted-foreground underline sm:inline">Compare all plans</Link></div><Button href="/enroll" className="min-h-10 px-5 text-xs">Enroll Now <ArrowRight className="h-4 w-4" /></Button></div></div></section>
      <section className="border-y border-border bg-foreground px-5 py-20 text-background sm:px-8 sm:py-28"><div className="mx-auto max-w-5xl text-center"><Quote className="mx-auto mb-8 h-8 w-8 text-accent" /><p className="font-serif text-3xl leading-tight sm:text-5xl">“The best inheritance we can give the next generation is a clear connection to who they are.”</p><p className="mt-7 font-mono text-[10px] uppercase tracking-[.25em] opacity-55">A principle at the heart of Heritage Club</p></div></section>
    </main>
    <PublicFooter />
  </div>
}
