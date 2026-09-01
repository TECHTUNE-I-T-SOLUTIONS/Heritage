"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Trophy, Flame, BookOpen, ArrowRight, LogIn } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { useToast } from '@/components/ui/interactive'
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
  childSubscriptions?: Array<{
    id: string
    planKey: string
    price: number
    currency: string
    status: string
    childName: string
    childPreferredName: string | null
  }>
  childPayments?: Array<{
    id: string
    amount: number
    currency: string
    status: string
    childName: string
    paymentType: string
  }>
}

export default function ParentOverview() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/parent')
  const { push } = useToast()

  const totalXp = data?.children.reduce((s, c) => s + c.xp, 0) ?? 0
  const bestStreak = data?.children.reduce((s, c) => Math.max(s, c.streak), 0) ?? 0

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
          <Link href="/dashboard/parent/children/add" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground font-semibold">
            <Users className="h-4 w-4" /> Add Child
          </Link>
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

          {/* Child Subscriptions Section */}
          {data.childSubscriptions && data.childSubscriptions.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-2xl mb-4">Child Subscriptions</h3>
              <p className="text-sm text-muted-foreground mb-4">Individual subscriptions for children who enrolled independently before being linked to your account.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {data.childSubscriptions.map((childSub) => (
                  <Card key={childSub.id}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-lg">{childSub.childPreferredName || childSub.childName}</h4>
                        <Badge tone={childSub.status === 'active' ? 'success' : 'warning'} className="mt-1 text-xs">{childSub.status}</Badge>
                      </div>
                      <p className="font-medium">{formatCurrency(childSub.price, childSub.currency)}<span className="text-xs text-muted-foreground"> / month</span></p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Child Payments Section */}
          {data.childPayments && data.childPayments.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-2xl mb-4">Recent Child Payments</h3>
              <p className="text-sm text-muted-foreground mb-4">Individual payments for children who enrolled independently and payments for additional children.</p>
              <div className="space-y-3">
                {data.childPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium">{payment.childName}</p>
                      <p className="text-sm text-muted-foreground">{payment.paymentType === 'subscription' ? 'Subscription' : 'Individual Child'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                      <Badge tone={payment.status === 'succeeded' ? 'success' : payment.status === 'pending' ? 'warning' : 'error'} className="text-xs">{payment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

