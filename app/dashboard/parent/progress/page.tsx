'use client'

import { useApi } from '@/lib/client'
import { PageHeading, Card, ProgressBar, EmptyState, SkeletonCards, StatCard } from '@/components/ui/kit'
import { BookOpen, CheckCircle2, FileText } from 'lucide-react'

interface ChildCard {
  id: string
  fullName: string
  preferredName: string | null
  progress: { lessonsCompleted: number; lessonsTotal: number; lessonsPct: number; avgQuizScore: number; quizzesTaken: number; submissions: number }
}

export default function ParentProgress() {
  const { data, loading, error } = useApi<{ children: ChildCard[] }>('/api/parent')

  return (
    <>
      <PageHeading eyebrow="Progress" title="Follow every milestone." description="A clear, encouraging view of how your children are learning." />

      {loading && <SkeletonCards count={2} />}
      {error && <EmptyState title="Couldn't load progress" description={error} />}

      {data && (data.children.length === 0 ? (
        <EmptyState title="No progress yet" description="Once children are enrolled, their progress will appear here." />
      ) : (
        <div className="space-y-6">
          {data.children.map((child) => (
            <Card key={child.id}>
              <h3 className="font-serif text-xl">{child.preferredName || child.fullName}</h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <StatCard label="Lessons" value={`${child.progress.lessonsCompleted}/${child.progress.lessonsTotal}`} icon={<BookOpen size={18} />} />
                <StatCard label="Avg quiz score" value={`${child.progress.avgQuizScore}%`} detail={`${child.progress.quizzesTaken} taken`} icon={<CheckCircle2 size={18} />} />
                <StatCard label="Submissions" value={child.progress.submissions} icon={<FileText size={18} />} />
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Overall lesson completion</span><span>{child.progress.lessonsPct}%</span></div>
                <ProgressBar value={child.progress.lessonsPct} tone="accent" />
              </div>
            </Card>
          ))}
        </div>
      ))}
    </>
  )
}
