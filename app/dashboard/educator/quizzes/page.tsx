'use client'

import { useState } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea } from '@/components/ui/form'

interface QuizRow { id: string; title: string; description: string | null; questionCount: number; xpReward: number; status: string }
interface QBuilder { prompt: string; options: string[]; correctIndex: number; points: number }

const emptyQ = (): QBuilder => ({ prompt: '', options: ['', ''], correctIndex: 0, points: 1 })

export default function EducatorQuizzes() {
  const { data, loading, error, refetch } = useApi<QuizRow[]>('/api/educator/quizzes')
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [xpReward, setXpReward] = useState(100)
  const [questions, setQuestions] = useState<QBuilder[]>([emptyQ()])

  function reset() {
    setTitle(''); setDescription(''); setXpReward(100); setQuestions([emptyQ()])
  }

  async function create() {
    if (!title.trim()) return push('Add a title.', 'error')
    if (questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) return push('Complete every question and option.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/educator/quizzes', { title, description, xpReward: Number(xpReward), questions: questions.map((q) => ({ ...q, points: Number(q.points) })) })
      push('Quiz created.')
      setOpen(false); reset(); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not create', 'error')
    } finally {
      setBusy(false)
    }
  }

  const setQ = (i: number, patch: Partial<QBuilder>) => setQuestions(questions.map((q, x) => (x === i ? { ...q, ...patch } : q)))

  return (
    <>
      <PageHeading eyebrow="Quizzes" title="Build and manage quizzes." action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> New quiz</button>} />

      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load quizzes" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={20} />} title="No quizzes yet" description="Create your first quiz to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((q) => (
            <Card key={q.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-lg">{q.title}</h3>
                <Badge tone={q.status === 'published' ? 'success' : 'neutral'}>{q.status}</Badge>
              </div>
              {q.description && <p className="mt-2 text-sm text-muted-foreground">{q.description}</p>}
              <p className="mt-3 text-xs text-muted-foreground">{q.questionCount} questions · +{q.xpReward} XP</p>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="New quiz" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={create} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Creating…' : 'Create quiz'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="XP reward"><Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} /></Field>

          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Question {i + 1}</p>
                  {questions.length > 1 && <button onClick={() => setQuestions(questions.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <Field label="Prompt"><Input value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} /></Field>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct-${i}`} checked={q.correctIndex === oi} onChange={() => setQ(i, { correctIndex: oi })} aria-label="Correct answer" />
                      <Input value={opt} onChange={(e) => setQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })} placeholder={`Option ${oi + 1}`} />
                      {q.options.length > 2 && <button onClick={() => setQ(i, { options: q.options.filter((_, x) => x !== oi), correctIndex: 0 })} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setQ(i, { options: [...q.options, ''] })} className="text-xs text-accent">+ Add option</button>
                </div>
              </div>
            ))}
            <button onClick={() => setQuestions([...questions, emptyQ()])} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Plus className="h-4 w-4" /> Add question</button>
          </div>
        </div>
      </Modal>
    </>
  )
}
