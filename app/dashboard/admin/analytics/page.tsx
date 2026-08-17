'use client'

import { Gauge } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, SkeletonCards, EmptyState, ProgressBar, SectionTitle } from '@/components/ui/kit'
import { formatCurrency } from '@/lib/format'

interface Stats { students: number; parents: number; educators: number; cohorts: number; activeSubs: number; pendingMod: number; revenue: number }
interface Sub extends Record<string, unknown> { planKey: string; status: string }
interface Cohort extends Record<string, unknown> { code: string; studentCount: number; capacity: number }

export default function AdminAnalytics() {
  const stats = useApi<Stats>('/api/admin')
  const subs = useApi<Sub[]>('/api/admin/subscriptions')
  const cohorts = useApi<Cohort[]>('/api/admin/cohorts')

  const planCounts = (subs.data ?? []).reduce<Record<string, number>>((acc, s) => {
    if (s.status === 'active') acc[s.planKey] = (acc[s.planKey] ?? 0) + 1
    return acc
  }, {})
  const totalActive = Object.values(planCounts).reduce((a, b) => a + b, 0)

  return (
    <>
      <PageHeading eyebrow="Analytics" title="Platform health." description="Key metrics across membership, revenue, and capacity." />

      {stats.loading && <SkeletonCards count={4} />}
      {stats.error && <EmptyState title="Couldn't load analytics" description={stats.error} />}

      {stats.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total members" value={stats.data.students + stats.data.parents + stats.data.educators} icon={<Gauge size={18} />} />
            <StatCard label="Active subscriptions" value={stats.data.activeSubs} />
            <StatCard label="Revenue (paid)" value={formatCurrency(stats.data.revenue)} />
            <StatCard label="Cohorts" value={stats.data.cohorts} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionTitle>Active plans</SectionTitle>
              <div className="mt-4 space-y-4">
                {totalActive === 0 && <p className="text-sm text-muted-foreground">No active subscriptions yet.</p>}
                {Object.entries(planCounts).map(([plan, n]) => (
                  <div key={plan}>
                    <div className="mb-1 flex justify-between text-sm"><span className="capitalize">{plan}</span><span className="text-muted-foreground">{n}</span></div>
                    <ProgressBar value={totalActive ? Math.round((n / totalActive) * 100) : 0} tone="accent" />
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <SectionTitle>Cohort capacity</SectionTitle>
              <div className="mt-4 space-y-4">
                {(cohorts.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">No cohorts yet.</p>}
                {(cohorts.data ?? []).map((c) => (
                  <div key={c.code}>
                    <div className="mb-1 flex justify-between text-sm"><span>{c.code}</span><span className="text-muted-foreground">{c.studentCount}/{c.capacity}</span></div>
                    <ProgressBar value={c.capacity ? Math.round((c.studentCount / c.capacity) * 100) : 0} />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
