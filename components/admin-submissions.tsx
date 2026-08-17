'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface SubmissionRow {
  id: string
  studentName: string
  assignmentTitle: string
  status: string
  moderation: string
  grade: number | null
  feedback: string | null
  note: string | null
  files: { kind: string; name?: string; url: string }[]
  submittedAt: string | null
}

const modTone = (m: string) => (m === 'approved' ? 'success' : m === 'flagged' || m === 'rejected' ? 'error' : 'warning')
const needsReview = ['pending', 'flagged', 'under_review']

export function AdminSubmissions({ mode }: { mode: 'all' | 'moderation' }) {
  const { data, loading, error, refetch } = useApi<SubmissionRow[]>('/api/educator/submissions')
  const { push } = useToast()

  const [review, setReview] = useState<SubmissionRow | null>(null)
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const [busy, setBusy] = useState(false)

  function open(s: SubmissionRow) {
    setReview(s); setGrade(s.grade?.toString() ?? ''); setFeedback(s.feedback ?? '')
  }

  async function save(moderation?: string) {
    if (!review) return
    setBusy(true)
    try {
      await apiPatch(`/api/educator/submissions/${review.id}`, {
        grade: grade ? Number(grade) : undefined,
        feedback: feedback || undefined,
        ...(moderation ? { moderation } : {}),
      })
      push('Submission updated.')
      setReview(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally { setBusy(false) }
  }

  const rows = (data ?? []).filter((s) => (mode === 'moderation' ? needsReview.includes(s.moderation) : true))

  const heading = mode === 'moderation'
    ? { eyebrow: 'Moderation', title: 'Content review queue.', description: 'Submissions flagged or awaiting a safety review.' }
    : { eyebrow: 'Submissions', title: 'All submissions.', description: 'Every piece of work submitted across cohorts.' }

  return (
    <>
      <PageHeading {...heading} />
      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load submissions" description={error} />}
      {data && (rows.length === 0 ? (
        <EmptyState icon={<FileText size={20} />} title={mode === 'moderation' ? 'Nothing to review' : 'No submissions yet'} description={mode === 'moderation' ? 'All submissions are approved.' : 'Student work will appear here.'} />
      ) : (
        <div className="grid gap-3">
          {rows.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium">{s.studentName} · <span className="text-muted-foreground">{s.assignmentTitle}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{s.submittedAt ? formatDate(s.submittedAt) : '—'} · {s.files.length} file(s)</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={s.status === 'graded' ? 'success' : 'info'}>{s.status}</Badge>
                <Badge tone={modTone(s.moderation)}>{s.moderation}</Badge>
                <button onClick={() => open(s)} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Review</button>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={!!review} onClose={() => setReview(null)} title="Review submission" footer={
        <>
          <button onClick={() => save('rejected')} disabled={busy} className="rounded-full border border-border px-4 py-2.5 text-sm">Reject</button>
          <button onClick={() => save('flagged')} disabled={busy} className="rounded-full border border-border px-4 py-2.5 text-sm">Flag</button>
          <button onClick={() => save('approved')} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">Approve & save</button>
        </>
      }>
        {review && (
          <div className="space-y-4">
            <p className="text-sm"><span className="text-muted-foreground">Student:</span> {review.studentName}</p>
            <p className="text-sm"><span className="text-muted-foreground">Assignment:</span> {review.assignmentTitle}</p>
            {review.note && <p className="text-sm text-muted-foreground">Note: {review.note}</p>}
            {review.files.length > 0 && (
              <ul className="space-y-1 text-sm">
                {review.files.map((f, i) => <li key={i}><a href={f.url} target="_blank" rel="noreferrer" className="text-accent underline">{f.name || f.url}</a></li>)}
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
