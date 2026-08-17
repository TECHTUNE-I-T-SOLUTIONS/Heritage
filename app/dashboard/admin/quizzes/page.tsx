'use client'

import { CheckCircle2 } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'

interface Row extends Record<string, unknown> {
  id: string
  title: string
  description: string | null
  questionCount: number
  xpReward: number
  status: string
}

export default function AdminQuizzes() {
  const { data, loading, error } = useApi<Row[]>('/api/educator/quizzes')

  const columns: Column<Row>[] = [
    { key: 'title', header: 'Quiz' },
    { key: 'questionCount', header: 'Questions' },
    { key: 'xpReward', header: 'XP', render: (r) => `+${r.xpReward}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'published' ? 'success' : 'neutral'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Quizzes" title="All quizzes." description="Every quiz across the platform." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load quizzes" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<CheckCircle2 size={20} />} title="No quizzes yet" description="Educators can create quizzes from their dashboard." />} />}
    </>
  )
}
