'use client'

import { useState } from 'react'
import { FileText, Plus } from 'lucide-react'
import { useApi, apiPost, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, Tabs, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface AssignmentRow { id: string; title: string; instructions: string; dueDate: string | null; xpReward: number; status: string }
interface SubmissionRow { id: string; studentName: string; assignmentTitle: string; status: string; moderation: string; grade: number | null; feedback: string | null; note: string | null; files: { kind: string; name?: string; url: string }[]; submittedAt: string | null }

export default function EducatorAssignments() {
  const [tab, setTab] = useState('assignments')
  const { push } = useToast()

  const assignments = useApi<AssignmentRow[]>('/api/educator/assignments')
  const submissions = useApi<SubmissionRow[]>('/api/educator/submissions')

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: '', instructions: '', dueDate: '', xpReward: 150 })

  const [grading, setGrading] = useState<SubmissionRow | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')

  async function createAssignment() {
    if (!form.title.trim() || !form.instructions.trim()) return push('Add a title and instructions.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/educator/assignments', { ...form, xpReward: Number(form.xpReward), allowedTypes: ['document', 'image', 'link'] })
      push('Assignment created.')
      setOpen(false); setForm({ title: '', instructions: '', dueDate: '', xpReward: 150 }); assignments.refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not create', 'error')
    } finally { setBusy(false) }
  }

  function openGrade(s: SubmissionRow) {
    setGrading(s); setGrade(s.grade?.toString() ?? ''); setFeedback(s.feedback ?? '')
  }

  async function saveGrade(moderation?: string) {
    if (!grading) return
    setBusy(true)
    try {
      await apiPatch(`/api/educator/submissions/${grading.id}`, {
        grade: grade ? Number(grade) : undefined,
        feedback: feedback || undefined,
        ...(moderation ? { moderation } : {}),
      })
      push('Submission updated.')
      setGrading(null); submissions.refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Assignments" title="Set work and review submissions." action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> New assignment</button>} />

      <div className="mb-6"><Tabs tabs={[{ key: 'assignments', label: 'Assignments' }, { key: 'submissions', label: 'Submissions' }]} value={tab} onChange={setTab} /></div>

      {tab === 'assignments' && (
        <>
          {assignments.loading && <Skeleton className="h-48" />}
          {assignments.error && <EmptyState title="Couldn't load assignments" description={assignments.error} />}
          {assignments.data && (assignments.data.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No assignments yet" description="Create your first assignment." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {assignments.data.map((a) => (
                <Card key={a.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg">{a.title}</h3>
                    <Badge tone={a.status === 'published' ? 'success' : 'neutral'}>{a.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.instructions}</p>
                  <p className="mt-3 text-xs text-muted-foreground">{a.dueDate ? `Due ${formatDate(a.dueDate)}` : 'No due date'} · +{a.xpReward} XP</p>
                </Card>
              ))}
            </div>
          ))}
        </>
      )}

      {tab === 'submissions' && (
        <>
          {submissions.loading && <Skeleton className="h-48" />}
          {submissions.error && <EmptyState title="Couldn't load submissions" description={submissions.error} />}
          {submissions.data && (submissions.data.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No submissions yet" description="Student work will appear here." />
          ) : (
            <div className="grid gap-3">
              {submissions.data.map((s) => (
                <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{s.studentName} · <span className="text-muted-foreground">{s.assignmentTitle}</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : '—'} · {s.files.length} file(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={s.status === 'graded' ? 'success' : 'info'}>{s.status}</Badge>
                    <Badge tone={s.moderation === 'approved' ? 'success' : s.moderation === 'flagged' || s.moderation === 'rejected' ? 'error' : 'warning'}>{s.moderation}</Badge>
                    <button onClick={() => openGrade(s)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Review</button>
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New assignment" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={createAssignment} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Creating…' : 'Create'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Instructions"><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field>
          <Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="XP reward"><Input type="number" value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })} /></Field>
        </div>
      </Modal>

      <Modal open={!!grading} onClose={() => setGrading(null)} title="Review submission" footer={
        <>
          <button onClick={() => saveGrade('flagged')} disabled={busy} className="rounded-full border border-border px-4 py-2.5 text-sm">Flag</button>
          <button onClick={() => saveGrade('approved')} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">Approve & save</button>
        </>
      }>
        {grading && (
          <div className="space-y-4">
            <p className="text-sm"><span className="text-muted-foreground">Student:</span> {grading.studentName}</p>
            {grading.note && <p className="text-sm text-muted-foreground">Note: {grading.note}</p>}
            {grading.files.length > 0 && (
              <ul className="space-y-1 text-sm">
                {grading.files.map((f, i) => <li key={i}><a href={f.url} target="_blank" rel="noreferrer" className="text-accent underline">{f.name || f.url}</a></li>)}
              </ul>
            )}
            <Field label="Grade (0–100)"><Input type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} /></Field>
            <Field label="Feedback"><Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}
