'use client'

import { Trophy, Flame, BookOpen, CheckCircle2, FileText } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, SkeletonCards } from '@/components/ui/kit'
import { formatDate } from '@/lib/format'

interface Progress {
  xp: number
  level: number
  streak: number
  progress: { lessonsCompleted: number; lessonsTotal: number; lessonsPct: number; avgQuizScore: number; quizzesTaken: number; submissions: number; xpInto: number; xpNeeded: number }
  xpEvents: { id: string; source: string; amount: number; note: string | null; createdAt: string }[]
  quizHistory: { id: string; title: string; percentage: number; score: number; totalPoints: number; createdAt: string }[]
}

export default function StudentProgress() {
  const { data, loading, error } = useApi<Progress>('/api/student/progress')

  return (
    <>
      <PageHeading eyebrow="My progress" title="How far you've come." description="Every lesson, quiz, and project adds up." />

      {loading && <SkeletonCards count={4} />}
      {error && <EmptyState title="Couldn't load progress" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Level" value={data.level} detail={`${data.progress.xpInto}/${data.progress.xpNeeded} XP`} icon={<Trophy size={18} />} />
            <StatCard label="Total XP" value={data.xp.toLocaleString()} icon={<Trophy size={18} />} />
            <StatCard label="Streak" value={`${data.streak} days`} icon={<Flame size={18} />} />
            <StatCard label="Avg quiz" value={`${data.progress.avgQuizScore}%`} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <StatCard label="Lessons completed" value={`${data.progress.lessonsCompleted}/${data.progress.lessonsTotal}`} icon={<BookOpen size={18} />} />
            <StatCard label="Quizzes taken" value={data.progress.quizzesTaken} icon={<CheckCircle2 size={18} />} />
            <StatCard label="Submissions" value={data.progress.submissions} icon={<FileText size={18} />} />
          </div>

          <div className="mt-6">
            <Card>
              <div className="mb-2 flex justify-between text-sm"><span>Lesson completion</span><span>{data.progress.lessonsPct}%</span></div>
              <ProgressBar value={data.progress.lessonsPct} tone="accent" />
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Card>
              <h2 className="font-serif text-xl">Recent XP</h2>
              {data.xpEvents.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No XP earned yet.</p> : (
                <ul className="mt-4 divide-y divide-border text-sm">
                  {data.xpEvents.map((e) => (
                    <li key={e.id} className="flex items-center justify-between py-2.5">
                      <span className="capitalize text-muted-foreground">{e.source.replace('_', ' ')}</span>
                      <span className="font-medium text-accent">+{e.amount}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h2 className="font-serif text-xl">Quiz history</h2>
              {data.quizHistory.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No quizzes taken yet.</p> : (
                <ul className="mt-4 divide-y divide-border text-sm">
                  {data.quizHistory.map((q) => (
                    <li key={q.id} className="flex items-center justify-between py-2.5">
                      <span>{q.title}<span className="ml-2 text-xs text-muted-foreground">{formatDate(q.createdAt)}</span></span>
                      <span className="font-medium">{q.percentage}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}
