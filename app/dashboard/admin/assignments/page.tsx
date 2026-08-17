'use client'

import { FileText } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'
import { formatDate } from '@/lib/format'

interface Row extends Record<string, unknown> {
  id: string
  title: string
  instructions: string
  dueDate: string | null
  xpReward: number
  status: string
}

export default function AdminAssignments() {
  const { data, loading, error } = useApi<Row[]>('/api/educator/assignments')

  const columns: Column<Row>[] = [
    { key: 'title', header: 'Assignment' },
    { key: 'dueDate', header: 'Due', render: (r) => (r.dueDate ? formatDate(r.dueDate) : '—') },
    { key: 'xpReward', header: 'XP', render: (r) => `+${r.xpReward}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'published' ? 'success' : 'neutral'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Assignments" title="All assignments." description="Every assignment set across cohorts." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load assignments" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<FileText size={20} />} title="No assignments yet" description="Educators can create assignments from their dashboard." />} />}
    </>
  )
}
