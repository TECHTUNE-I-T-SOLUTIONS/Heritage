'use client'

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Tabs } from '@/components/ui/interactive'

interface Entry { rank: number; id: string; name: string; xp: number; level: number; isMe: boolean }

export default function StudentLeaderboard() {
  const [scope, setScope] = useState('cohort')
  const { data, loading, error } = useApi<{ scope: string; entries: Entry[] }>(`/api/leaderboard?scope=${scope}`)

  return (
    <>
      <PageHeading eyebrow="Leaderboard" title="Celebrate every milestone." description="A friendly view of how the community is growing together." />

      <div className="mb-6"><Tabs tabs={[{ key: 'cohort', label: 'My cohort' }, { key: 'global', label: 'Everyone' }]} value={scope} onChange={setScope} /></div>

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load leaderboard" description={error} />}

      {data && (data.entries.length === 0 ? (
        <EmptyState icon={<Trophy size={20} />} title="No rankings yet" description="As learners earn XP, they'll appear here." />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-border">
            {data.entries.map((e) => (
              <li key={e.id} className={`flex items-center gap-4 px-5 py-4 ${e.isMe ? 'bg-secondary/60' : ''}`}>
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${e.rank <= 3 ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>{e.rank}</span>
                <span className="flex-1 font-medium">{e.name}{e.isMe && <span className="ml-2 text-xs text-accent">You</span>}</span>
                <Badge tone="neutral">Lv {e.level}</Badge>
                <span className="w-24 text-right font-semibold">{e.xp.toLocaleString()} XP</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  )
}
