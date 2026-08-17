'use client'

import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'

interface QuizItem {
  id: string
  title: string
  description: string | null
  questionCount: number
  xpReward: number
  attempt: { percentage: number; score: number; totalPoints: number; xpEarned: number } | null
}

export default function StudentQuizzes() {
  const { data, loading, error } = useApi<QuizItem[]>('/api/student/quizzes')

  return (
    <>
      <PageHeading eyebrow="Quizzes" title="Test what you've learned." description="Auto-scored quizzes that celebrate your progress and earn XP." />

      {loading && <SkeletonCards count={3} />}
      {error && <EmptyState title="Couldn't load quizzes" description={error} />}

      {data && (data.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={20} />} title="No quizzes yet" description="New quizzes will appear here as your cohort progresses." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-xl">{quiz.title}</h3>
                {quiz.attempt && <Badge tone={quiz.attempt.percentage >= 70 ? 'success' : 'warning'}>{quiz.attempt.percentage}%</Badge>}
              </div>
              {quiz.description && <p className="mt-2 text-sm text-muted-foreground">{quiz.description}</p>}
              <p className="mt-3 text-xs text-muted-foreground">{quiz.questionCount} questions · +{quiz.xpReward} XP</p>
              <Link
                href={`/dashboard/student/quizzes/${quiz.id}`}
                className={`mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium ${quiz.attempt ? 'border border-border hover:bg-secondary' : 'bg-primary text-primary-foreground'}`}
              >
                {quiz.attempt ? 'Review' : 'Start quiz'} <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      ))}
    </>
  )
}
