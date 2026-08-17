'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Trophy } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { Card, EmptyState, Skeleton, Badge, ProgressBar } from '@/components/ui/kit'
import { useToast } from '@/components/ui/interactive'

interface Quiz {
  id: string
  title: string
  description: string | null
  xpReward: number
  questions: { prompt: string; options: string[]; points: number }[]
  attempt: { answers: number[]; percentage: number; score: number; totalPoints: number } | null
}
interface Result { score: number; totalPoints: number; percentage: number; xpEarned: number }

export default function QuizTake() {
  const params = useParams<{ id: string }>()
  const { data, loading, error } = useApi<Quiz>(`/api/quizzes/${params.id}`)
  const { push } = useToast()
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  useEffect(() => {
    if (data) setAnswers(data.attempt ? data.attempt.answers : new Array(data.questions.length).fill(-1))
  }, [data])

  const done = data?.attempt || result
  const allAnswered = data && answers.length === data.questions.length && answers.every((a) => a >= 0)

  async function submit() {
    if (!allAnswered) return push('Please answer every question.', 'error')
    setSubmitting(true)
    try {
      const res = await apiPost<Result>(`/api/quizzes/${params.id}/attempt`, { answers })
      setResult(res)
      push(`Scored ${res.percentage}% · +${res.xpEarned} XP`)
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not submit', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Link href="/dashboard/student/quizzes" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to quizzes</Link>

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load quiz" description={error} />}

      {data && (
        <>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl">{data.title}</h1>
              {data.description && <p className="mt-2 text-muted-foreground">{data.description}</p>}
            </div>
            <Badge tone="accent">+{data.xpReward} XP</Badge>
          </div>

          {(result || data.attempt) && (
            <Card className="mb-6">
              <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-accent" /><h2 className="font-serif text-xl">Your result</h2></div>
              {(() => {
                const r = result ?? data.attempt!
                return (
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm"><span>Score</span><span className="font-semibold">{r.score}/{r.totalPoints} ({r.percentage}%)</span></div>
                    <ProgressBar value={r.percentage} tone="accent" />
                  </div>
                )
              })()}
            </Card>
          )}

          <div className="space-y-4">
            {data.questions.map((q, i) => {
              const chosen = answers[i]
              return (
                <Card key={i}>
                  <p className="font-medium">{i + 1}. {q.prompt}</p>
                  <div className="mt-4 grid gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = chosen === oi
                      return (
                        <button
                          key={oi}
                          disabled={!!done}
                          onClick={() => setAnswers(answers.map((a, x) => (x === i ? oi : a)))}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'} disabled:opacity-70`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>

          {!done && (
            <button onClick={submit} disabled={submitting || !allAnswered} className="mt-6 h-12 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto sm:px-10">
              {submitting ? 'Submitting…' : 'Submit quiz'}
            </button>
          )}
        </>
      )}
    </>
  )
}
