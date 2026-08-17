'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { FileUploader, Field, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface SubmissionFile { kind: string; name?: string; url: string }
interface AssignmentItem {
  id: string
  title: string
  instructions: string
  dueDate: string | null
  allowedTypes: string[]
  xpReward: number
  submission: { id: string; status: string; moderation: string; grade: number | null; feedback: string | null; files: SubmissionFile[]; note: string | null } | null
}

const statusTone: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'error'> = {
  submitted: 'info', graded: 'success', returned: 'warning', late: 'warning', draft: 'neutral',
}

export default function StudentAssignments() {
  const { data, loading, error, refetch } = useApi<AssignmentItem[]>('/api/student/assignments')
  const { push } = useToast()
  const [active, setActive] = useState<AssignmentItem | null>(null)
  const [files, setFiles] = useState<SubmissionFile[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  function open(a: AssignmentItem) {
    setActive(a)
    setFiles(a.submission?.files ?? [])
    setNote(a.submission?.note ?? '')
  }

  async function submit() {
    if (!active) return
    if (!files.length) return push('Attach at least one file or link.', 'error')
    setBusy(true)
    try {
      await apiPost(`/api/student/assignments/${active.id}/submit`, { note, files })
      push('Submitted for review.')
      setActive(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not submit', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="Assignments & projects" title="Show what you've learned." description="Creative projects and assignments to bring your heritage to life." />

      {loading && <SkeletonCards count={3} />}
      {error && <EmptyState title="Couldn't load assignments" description={error} />}

      {data && (data.length === 0 ? (
        <EmptyState icon={<FileText size={20} />} title="No assignments yet" description="New projects will appear here soon." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-xl">{a.title}</h3>
                {a.submission ? <Badge tone={statusTone[a.submission.status] ?? 'neutral'}>{a.submission.status}</Badge> : <Badge tone="neutral">Not started</Badge>}
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.instructions}</p>
              <p className="mt-3 text-xs text-muted-foreground">{a.dueDate ? `Due ${formatDate(a.dueDate)}` : 'No due date'} · +{a.xpReward} XP</p>
              {a.submission?.grade != null && <p className="mt-2 text-sm">Grade: <span className="font-semibold">{a.submission.grade}</span></p>}
              {a.submission?.feedback && <p className="mt-1 text-sm text-muted-foreground">“{a.submission.feedback}”</p>}
              <button onClick={() => open(a)} className={`mt-5 rounded-full px-5 py-2.5 text-sm font-medium ${a.submission ? 'border border-border hover:bg-secondary' : 'bg-primary text-primary-foreground'}`}>
                {a.submission ? 'View / resubmit' : 'Submit work'}
              </button>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={!!active} onClose={() => setActive(null)} title={active?.title} footer={
        <>
          <button onClick={() => setActive(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Submitting…' : 'Submit'}</button>
        </>
      }>
        {active && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{active.instructions}</p>
            <FileUploader onAdd={(url, name) => setFiles([...files, { kind: 'link', name, url }])} />
            {files.length > 0 && (
              <ul className="space-y-2 text-sm">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span className="truncate">{f.name || f.url}</span>
                    <button onClick={() => setFiles(files.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-red-500">Remove</button>
                  </li>
                ))}
              </ul>
            )}
            <Field label="Note (optional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything you'd like your educator to know" /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}
