import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Trophy, Flame, BookOpen, ArrowRight, UserPlus, LogIn } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input } from '@/components/ui/form'
import { formatCurrency } from '@/lib/format'

interface ChildCard {
  id: string
  fullName: string
  preferredName: string | null
  email: string
  age: number | null
  status: string
  xp: number
  level: number
  streak: number
  cohortCode: string | null
  cohortName: string | null
  schedule: string | null
  progress: { lessonsCompleted: number; lessonsTotal: number; lessonsPct: number; avgQuizScore: number; quizzesTaken: number }
}
interface Overview {
  children: ChildCard[]
  subscription: { planKey: string; price: number; status: string; childrenCount: number; cancelAtPeriodEnd: boolean } | null
}

export default function ParentOverview() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/parent')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ fullName: '', preferredName: '', email: '', password: '', age: 10 })

  // Dynamic pricing settings
  const [pricingConfig, setPricingConfig] = useState({ basePrice: 70, discounts: [10, 5, 5] })

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.config) setPricingConfig(j.data.config)
      })
      .catch(() => {})
  }, [])

  // Calculate sibling price based on current children count
  const currentCount = data?.children.length ?? 0
  let addPrice = pricingConfig.basePrice
  if (currentCount === 1) addPrice = pricingConfig.basePrice - (pricingConfig.discounts[0] ?? 0)
  else if (currentCount === 2) addPrice = pricingConfig.basePrice - (pricingConfig.discounts[1] ?? 0)
  else if (currentCount >= 3) addPrice = pricingConfig.basePrice - (pricingConfig.discounts[2] ?? 0)

  const totalXp = data?.children.reduce((s, c) => s + c.xp, 0) ?? 0
  const bestStreak = data?.children.reduce((s, c) => Math.max(s, c.streak), 0) ?? 0

  async function handleAddChild() {
    if (!form.fullName.trim() || !form.email.trim() || form.password.length < 8) {
      return push('Please complete all fields. Password must be at least 8 characters.', 'error')
    }

    setBusy(true)
    try {
      const res = await apiPost<{ authorizationUrl?: string; simulated?: boolean }>('/api/parent/children', form)
      
      if (res.simulated) {
        push(`${form.fullName} added successfully (Simulated payment)!`)
        setOpen(false)
        setForm({ fullName: '', preferredName: '', email: '', password: '', age: 10 })
        refetch()
      } else if (res.authorizationUrl) {
        push('Redirecting to checkout payment page...')
        window.location.href = res.authorizationUrl
      }
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not add child', 'error')
    } finally { setBusy(false) }
  }

  async function handleSwitchToChild(childId: string) {
    try {
      await apiPost('/api/auth/switch', { childId })
      push('Switching portal...')
      window.location.href = '/dashboard/student'
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not log in as child', 'error')
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Family overview"
        title="A clearer view of your family's journey."
        description="Support the moments that make learning stick."
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground font-semibold">
            <UserPlus className="h-4 w-4" /> Add Child
          </button>
        }
      />

      {loading && <SkeletonCards count={4} />}
      {error && <EmptyState title="Couldn't load your overview" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Children" value={data.children.length} icon={<Users size={18} />} />
            <StatCard label="Total XP" value={totalXp.toLocaleString()} icon={<Trophy size={18} />} />
            <StatCard label="Best streak" value={`${bestStreak} days`} icon={<Flame size={18} />} />
            <StatCard label="Plan" value={data.subscription ? formatCurrency(data.subscription.price) : '—'} detail={data.subscription ? `${data.subscription.status}` : 'No subscription'} icon={<BookOpen size={18} />} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {data.children.length === 0 && (
              <div className="lg:col-span-2">
                <EmptyState title="No children enrolled yet" description="Add a child to begin their Heritage Club journey." action={<button onClick={() => setOpen(true)} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground font-semibold">Enroll a child</button>} />
              </div>
            )}
            {data.children.map((child) => (
              <Card key={child.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl">{child.preferredName || child.fullName}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{child.cohortCode ? `${child.cohortCode} · ${child.schedule ?? 'Schedule TBC'}` : 'Awaiting cohort assignment'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Username: {child.email.split('@')[0]}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone={child.status === 'active' ? 'success' : 'warning'}>{child.status}</Badge>
                      <Badge tone="accent">Level {child.level}</Badge>
                    </div>
                  </div>
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Lessons</span><span>{child.progress.lessonsCompleted}/{child.progress.lessonsTotal}</span></div>
                    <ProgressBar value={child.progress.lessonsPct} tone="accent" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-border p-3"><p className="text-lg font-semibold">{child.xp.toLocaleString()}</p><p className="text-[11px] text-muted-foreground">XP</p></div>
                    <div className="rounded-xl border border-border p-3"><p className="text-lg font-semibold">{child.streak}</p><p className="text-[11px] text-muted-foreground">Day streak</p></div>
                    <div className="rounded-xl border border-border p-3"><p className="text-lg font-semibold">{child.progress.avgQuizScore}%</p><p className="text-[11px] text-muted-foreground">Avg quiz</p></div>
                  </div>
                </div>
                <div className="mt-5 flex justify-between items-center border-t border-border pt-4">
                  <Link href="/dashboard/parent/progress" className="inline-flex items-center gap-2 text-sm font-medium text-accent">View progress <ArrowRight className="h-4 w-4" /></Link>
                  {child.status === 'active' && (
                    <button
                      onClick={() => handleSwitchToChild(child.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold hover:bg-secondary transition"
                    >
                      <LogIn size={12} /> Log in as child
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Child Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Enroll Sibling Child" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleAddChild} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60 font-semibold">{busy ? 'Redirecting…' : `Pay ${formatCurrency(addPrice)} & Add`}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-sm leading-relaxed mb-2 text-yellow-500">
            <strong>Child addition rate:</strong> {formatCurrency(addPrice)} / month.<br />
            {currentCount > 0 && <span>Sibling discount applied dynamically based on total child count.</span>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Child's Full Name"><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Abidemi Kolawole" /></Field>
            <Field label="Preferred Name"><Input value={form.preferredName} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} placeholder="Abi" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Direct Login Username"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="abidemi" /></Field>
            <Field label="Child password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" /></Field>
          </div>
          <Field label="Age"><Input type="number" min={3} max={19} value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></Field>
        </div>
      </Modal>
    </>
  )
}

