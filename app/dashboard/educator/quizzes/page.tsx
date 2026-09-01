'use client'

import { useState } from 'react'
import { CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea, Select } from '@/components/ui/form'

interface QuizRow { id: string; title: string; description: string | null; questionCount: number; xpReward: number; status: string; questions?: QBuilder[] }
interface QBuilder { prompt: string; options: string[]; correctIndex: number; points: number }
interface Pillar { id: string; title: string }
interface Module { id: string; title: string; pillar: string }

const emptyQ = (): QBuilder => ({ prompt: '', options: ['', ''], correctIndex: 0, points: 1 })

export default function EducatorQuizzes() {
  const { data, loading, error, refetch } = useApi<QuizRow[]>('/api/educator/quizzes')
  const pillars = useApi<Pillar[]>('/api/curriculum/pillars')
  const modules = useApi<Module[]>('/api/curriculum/modules')
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [xpReward, setXpReward] = useState(100)
  const [pillarId, setPillarId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [questions, setQuestions] = useState<QBuilder[]>([emptyQ()])

  const [editing, setEditing] = useState<QuizRow | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editXpReward, setEditXpReward] = useState(100)
  const [editQuestions, setEditQuestions] = useState<QBuilder[]>([emptyQ()])

  const [deleting, setDeleting] = useState<QuizRow | null>(null)

  function reset() {
    setTitle(''); setDescription(''); setXpReward(100); setPillarId(''); setModuleId(''); setQuestions([emptyQ()])
  }

  async function create() {
    if (!title.trim()) return push('Add a title.', 'error')
    if (questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) return push('Complete every question and option.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/educator/quizzes', { 
        title, 
        description, 
        xpReward: Number(xpReward), 
        pillarId: pillarId || undefined,
        moduleId: moduleId || undefined,
        questions: questions.map((q) => ({ ...q, points: Number(q.points) })) 
      })
      push('Quiz created.')
      setOpen(false); reset(); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not create', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function edit() {
    if (!editing) return
    if (!editTitle.trim()) return push('Add a title.', 'error')
    if (editQuestions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) return push('Complete every question and option.', 'error')
    setBusy(true)
    try {
      const { apiPatch } = await import('@/lib/client')
      await apiPatch('/api/educator/quizzes', { id: editing.id, title: editTitle, description: editDescription, xpReward: Number(editXpReward), questions: editQuestions.map((q) => ({ ...q, points: Number(q.points) })) })
      push('Quiz updated.')
      setEditing(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!deleting) return
    setBusy(true)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/educator/quizzes?id=${deleting.id}`)
      push('Quiz deleted.')
      setDeleting(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete', 'error')
    } finally {
      setBusy(false)
    }
  }

  const setQ = (i: number, patch: Partial<QBuilder>) => setQuestions(questions.map((q, x) => (x === i ? { ...q, ...patch } : q)))
  const setEditQ = (i: number, patch: Partial<QBuilder>) => setEditQuestions(editQuestions.map((q, x) => (x === i ? { ...q, ...patch } : q)))

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
            <Card key={q.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-lg">{q.title}</h3>
                  <Badge tone={q.status === 'published' ? 'success' : 'neutral'}>{q.status}</Badge>
                </div>
                {q.description && <p className="mt-2 text-sm text-muted-foreground">{q.description}</p>}
                <p className="mt-3 text-xs text-muted-foreground">{q.questionCount} questions · +{q.xpReward} XP</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditing(q); setEditTitle(q.title); setEditDescription(q.description ?? ''); setEditXpReward(q.xpReward); setEditQuestions(q.questions && q.questions.length ? q.questions : [emptyQ()]) }} className="flex-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">Edit</button>
                <button onClick={() => setDeleting(q)} className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 text-xs">Delete</button>
              </div>
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
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pillar (Optional)">
              <Select value={pillarId} onChange={(e) => { setPillarId(e.target.value); setModuleId('') }}>
                <option value="">Select Pillar</option>
                {pillars.data?.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </Select>
            </Field>
            <Field label="Module (Optional)">
              <Select value={moduleId} onChange={(e) => setModuleId(e.target.value)} disabled={!pillarId}>
                <option value="">Select Module</option>
                {modules.data?.filter((m) => m.pillar === pillarId).map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </Select>
            </Field>
          </div>
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

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit quiz" footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={edit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Title"><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></Field>
          <Field label="Description"><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></Field>
          <Field label="XP reward"><Input type="number" value={editXpReward} onChange={(e) => setEditXpReward(Number(e.target.value))} /></Field>

          <div className="space-y-4">
            {editQuestions.map((q, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium">Question {i + 1}</p>
                  {editQuestions.length > 1 && <button onClick={() => setEditQuestions(editQuestions.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                </div>
                <Field label="Prompt"><Input value={q.prompt} onChange={(e) => setEditQ(i, { prompt: e.target.value })} /></Field>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`edit-correct-${i}`} checked={q.correctIndex === oi} onChange={() => setEditQ(i, { correctIndex: oi })} aria-label="Correct answer" />
                      <Input value={opt} onChange={(e) => setEditQ(i, { options: q.options.map((o, x) => (x === oi ? e.target.value : o)) })} placeholder={`Option ${oi + 1}`} />
                      {q.options.length > 2 && <button onClick={() => setEditQ(i, { options: q.options.filter((_, x) => x !== oi), correctIndex: 0 })} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  ))}
                  <button onClick={() => setEditQ(i, { options: [...q.options, ''] })} className="text-xs text-accent">+ Add option</button>
                </div>
              </div>
            ))}
            <button onClick={() => setEditQuestions([...editQuestions, emptyQ()])} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Plus className="h-4 w-4" /> Add question</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete quiz" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={remove} disabled={busy} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the quiz <strong>{deleting?.title}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}

