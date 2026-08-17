'use client'

import { BookOpen } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'

interface Lesson { id: string; title: string; week: number; xpReward: number; status: string }
interface Module { id: string; title: string; status: string; lessons: Lesson[] }
interface Pillar { id: string; title: string; slug: string; status: string; modules: Module[] }

export default function EducatorLessons() {
  const { data, loading, error } = useApi<Pillar[]>('/api/curriculum')

  return (
    <>
      <PageHeading eyebrow="Lessons" title="The curriculum." description="The full programme across the four pillars." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load curriculum" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<BookOpen size={20} />} title="No curriculum yet" description="Pillars and lessons will appear here once created." />
      ) : (
        <div className="space-y-6">
          {data.map((pillar) => (
            <Card key={pillar.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">{pillar.title}</h2>
                <Badge tone={pillar.status === 'published' ? 'success' : 'neutral'}>{pillar.status}</Badge>
              </div>
              {pillar.modules.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No modules yet.</p> : (
                <div className="mt-4 space-y-4">
                  {pillar.modules.map((m) => (
                    <div key={m.id}>
                      <p className="text-sm font-medium">{m.title}</p>
                      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                        {m.lessons.length === 0 ? <li className="px-4 py-2.5 text-sm text-muted-foreground">No lessons</li> : m.lessons.map((l) => (
                          <li key={l.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                            <span><Badge tone="neutral">Wk {l.week}</Badge> <span className="ml-2">{l.title}</span></span>
                            <span className="text-xs text-accent">+{l.xpReward} XP</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}
    </>
  )
}
