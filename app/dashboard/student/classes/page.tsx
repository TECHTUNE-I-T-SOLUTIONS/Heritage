'use client'

import { Video, CheckCircle2, Circle } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, ProgressBar, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { useToast } from '@/components/ui/interactive'

interface LessonItem { id: string; title: string; summary: string | null; week: number; xpReward: number; completed: boolean }
interface Classes {
  cohort: { code: string; name: string; schedule: string | null; meetingLink: string | null; timezone: string | null } | null
  pillars: { id: string; title: string; lessons: LessonItem[] }[]
}

export default function StudentClasses() {
  const { data, loading, error, refetch } = useApi<Classes>('/api/student/classes')
  const { push } = useToast()

  async function complete(id: string) {
    try {
      const res = await apiPost<{ xpEarned?: number; alreadyCompleted?: boolean }>(`/api/student/lessons/${id}/complete`)
      push(res.alreadyCompleted ? 'Already completed.' : `Lesson complete! +${res.xpEarned} XP`)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    }
  }

  const allLessons = data?.pillars.flatMap((p) => p.lessons) ?? []
  const done = allLessons.filter((l) => l.completed).length
  const pct = allLessons.length ? Math.round((done / allLessons.length) * 100) : 0

  return (
    <>
      <PageHeading eyebrow="Classes & lessons" title="Your learning home." description="Live sessions and self-paced lessons across the four pillars." />

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load your classes" description={error} />}

      {data && (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary"><Video className="h-5 w-5 text-accent" /></span>
                <div>
                  <p className="font-medium">{data.cohort ? data.cohort.name : 'Cohort pending'}</p>
                  <p className="text-sm text-muted-foreground">{data.cohort ? `${data.cohort.code} · ${data.cohort.schedule ?? 'Schedule TBC'}` : 'You will be assigned soon.'}</p>
                </div>
              </div>
              {data.cohort?.meetingLink && <a href={data.cohort.meetingLink} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Join live session</a>}
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Overall completion</span><span>{done}/{allLessons.length}</span></div>
              <ProgressBar value={pct} tone="accent" />
            </div>
          </Card>

          {allLessons.length === 0 && <EmptyState title="No lessons yet" description="Lessons will appear here once your programme begins." />}

          <div className="space-y-6">
            {data.pillars.filter((p) => p.lessons.length).map((pillar) => (
              <div key={pillar.id}>
                <h2 className="mb-3 font-serif text-xl">{pillar.title}</h2>
                <div className="grid gap-3">
                  {pillar.lessons.map((lesson) => (
                    <Card key={lesson.id} className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge tone="neutral">Week {lesson.week}</Badge>
                          <h3 className="font-medium">{lesson.title}</h3>
                        </div>
                        {lesson.summary && <p className="mt-2 text-sm text-muted-foreground">{lesson.summary}</p>}
                        <p className="mt-2 text-xs text-accent">+{lesson.xpReward} XP</p>
                      </div>
                      <button
                        onClick={() => !lesson.completed && complete(lesson.id)}
                        disabled={lesson.completed}
                        className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${lesson.completed ? 'text-emerald-600 dark:text-emerald-400' : 'border border-border hover:bg-secondary'}`}
                      >
                        {lesson.completed ? <><CheckCircle2 className="h-4 w-4" /> Done</> : <><Circle className="h-4 w-4" /> Mark done</>}
                      </button>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
