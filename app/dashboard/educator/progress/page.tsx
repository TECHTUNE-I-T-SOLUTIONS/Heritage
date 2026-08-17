'use client'

import { BarChart3 } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, Skeleton } from '@/components/ui/kit'

interface Row { id: string; name: string; cohortCode: string | null; xp: number; lessonsPct: number; avgQuizScore: number }

export default function EducatorProgress() {
  const { data, loading, error } = useApi<Row[]>('/api/educator/students')

  const avg = (key: 'lessonsPct' | 'avgQuizScore') => (data && data.length ? Math.round(data.reduce((s, r) => s + r[key], 0) / data.length) : 0)
  const totalXp = data?.reduce((s, r) => s + r.xp, 0) ?? 0

  return (
    <>
      <PageHeading eyebrow="Progress" title="Cohort insights." description="See how your learners are doing overall." />

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load progress" description={error} />}

      {data && (data.length === 0 ? (
        <EmptyState icon={<BarChart3 size={20} />} title="No data yet" description="Analytics appear once students are active." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Avg lesson completion" value={`${avg('lessonsPct')}%`} />
            <StatCard label="Avg quiz score" value={`${avg('avgQuizScore')}%`} />
            <StatCard label="Total XP earned" value={totalXp.toLocaleString()} />
          </div>

          <div className="mt-6 space-y-3">
            {data.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-muted-foreground">{r.cohortCode ?? '—'}</span>
                </div>
                <div className="mt-3"><ProgressBar value={r.lessonsPct} tone="accent" /></div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{r.lessonsPct}% lessons</span><span>{r.avgQuizScore}% avg quiz</span></div>
              </Card>
            ))}
          </div>
        </>
      ))}
    </>
  )
}
