'use client'

import { Users } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'

interface Row extends Record<string, unknown> {
  id: string
  name: string
  age: number | null
  cohortCode: string | null
  xp: number
  level: number
  streak: number
  status: string
  lessonsPct: number
  avgQuizScore: number
}

export default function EducatorStudents() {
  const { data, loading, error } = useApi<Row[]>('/api/educator/students')

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Student' },
    { key: 'cohortCode', header: 'Cohort', render: (r) => r.cohortCode ?? '—' },
    { key: 'level', header: 'Level', render: (r) => `Lv ${r.level}` },
    { key: 'xp', header: 'XP', render: (r) => r.xp.toLocaleString() },
    { key: 'lessonsPct', header: 'Lessons', render: (r) => `${r.lessonsPct}%` },
    { key: 'avgQuizScore', header: 'Avg quiz', render: (r) => `${r.avgQuizScore}%` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Students" title="Your learners." description="Everyone across your cohorts, with progress at a glance." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load students" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Users size={20} />} title="No students yet" description="Students appear here once assigned to your cohorts." />} />}
    </>
  )
}
