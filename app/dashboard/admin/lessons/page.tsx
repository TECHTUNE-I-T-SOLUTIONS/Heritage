'use client'

import { BookOpen } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'

interface Lesson { id: string; title: string; week: number; xpReward: number; status: string }
interface Module { id: string; title: string; lessons: Lesson[] }
interface Pillar { id: string; title: string; modules: Module[] }

interface Row extends Record<string, unknown> {
  id: string
  title: string
  pillar: string
  module: string
  week: number
  xpReward: number
  status: string
}

export default function AdminLessons() {
  const { data, loading, error } = useApi<Pillar[]>('/api/curriculum')

  const rows: Row[] = (data ?? []).flatMap((p) =>
    p.modules.flatMap((m) =>
      m.lessons.map((l) => ({ id: l.id, title: l.title, pillar: p.title, module: m.title, week: l.week, xpReward: l.xpReward, status: l.status })),
    ),
  )

  const columns: Column<Row>[] = [
    { key: 'title', header: 'Lesson' },
    { key: 'pillar', header: 'Pillar' },
    { key: 'module', header: 'Module' },
    { key: 'week', header: 'Week', render: (r) => `Wk ${r.week}` },
    { key: 'xpReward', header: 'XP', render: (r) => `+${r.xpReward}` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'published' ? 'success' : 'neutral'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Lessons" title="Every lesson." description="A flat view of all lessons across the curriculum." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load lessons" description={error} />}
      {data && <DataTable columns={columns} rows={rows} empty={<EmptyState icon={<BookOpen size={20} />} title="No lessons yet" description="Add lessons from the Curriculum page." />} />}
    </>
  )
}
