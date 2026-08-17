'use client'

import { Users, FileText, CheckCircle2, CalendarDays } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'

interface Overview {
  cohorts: { id: string; code: string; name: string; schedule: string | null; capacity: number }[]
  studentCount: number
  pendingSubmissions: number
  quizCount: number
}

export default function EducatorOverview() {
  const { data, loading, error } = useApi<Overview>('/api/educator')

  return (
    <>
      <PageHeading eyebrow="Educator workspace" title="Teach with the full picture." description="Plan, connect, and celebrate every learner." />

      {loading && <SkeletonCards count={3} />}
      {error && <EmptyState title="Couldn't load your workspace" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cohorts" value={data.cohorts.length} icon={<CalendarDays size={18} />} />
            <StatCard label="Students" value={data.studentCount} icon={<Users size={18} />} />
            <StatCard label="To review" value={data.pendingSubmissions} icon={<FileText size={18} />} />
            <StatCard label="Quizzes" value={data.quizCount} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-serif text-xl">Your cohorts</h2>
            {data.cohorts.length === 0 ? (
              <EmptyState title="No cohorts assigned" description="An admin will assign you to cohorts soon." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.cohorts.map((c) => (
                  <Card key={c.id}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg">{c.name}</h3>
                      <Badge tone="accent">{c.code}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{c.schedule ?? 'Schedule TBC'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Capacity {c.capacity}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
