'use client'

import Link from 'next/link'
import { Users, Trophy, Flame, BookOpen, ArrowRight } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { formatCurrency } from '@/lib/format'

interface ChildCard {
  id: string
  fullName: string
  preferredName: string | null
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
  const { data, loading, error } = useApi<Overview>('/api/parent')

  const totalXp = data?.children.reduce((s, c) => s + c.xp, 0) ?? 0
  const bestStreak = data?.children.reduce((s, c) => Math.max(s, c.streak), 0) ?? 0

  return (
    <>
      <PageHeading eyebrow="Family overview" title="A clearer view of your family's journey." description="Support the moments that make learning stick." />

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
                <EmptyState title="No children enrolled yet" description="Add a child to begin their Heritage Club journey." action={<Link href="/enroll" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Enroll a child</Link>} />
              </div>
            )}
            {data.children.map((child) => (
              <Card key={child.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-xl">{child.preferredName || child.fullName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{child.cohortCode ? `${child.cohortCode} · ${child.schedule ?? 'Schedule TBC'}` : 'Awaiting cohort assignment'}</p>
                  </div>
                  <Badge tone="accent">Level {child.level}</Badge>
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
                <Link href="/dashboard/parent/progress" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent">View progress <ArrowRight className="h-4 w-4" /></Link>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  )
}
