'use client'

import { useState } from 'react'
import { Users, CalendarDays, Award, ClipboardCheck } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'

interface Row extends Record<string, unknown> {
  id: string
  name: string
  age: number | null
  cohortCode: string | null
  xp: number
  level: number
  streak: number
  status: string
  lessonsPct: number
  avgQuizScore: number
}

interface Cohort { id: string; code: string; name: string }

export default function EducatorStudents() {
  const { data, loading, error, refetch } = useApi<Row[]>('/api/educator/students')
  const overview = useApi<{ cohorts: Cohort[] }>('/api/educator')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)

  // Attendance states
  const [attOpen, setAttOpen] = useState(false)
  const [attCohort, setAttCohort] = useState('')
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0])
  const [attRecords, setAttRecords] = useState<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; note: string }>>({})

  // Assessment states
  const [assStudent, setAssStudent] = useState<Row | null>(null)
  const [assForm, setAssForm] = useState({ title: '', score: 80, maxScore: 100, feedback: '', xpAmount: 50 })

  // XP states
  const [xpStudent, setXpStudent] = useState<Row | null>(null)
  const [xpForm, setXpForm] = useState({ amount: 100, note: '' })

  const cohorts = overview.data?.cohorts ?? []
  const attStudents = data?.filter((s) => s.cohortCode === cohorts.find((c) => c.id === attCohort)?.code) ?? []

  // Initialize attendance records when cohort changes
  function handleCohortChange(cohortId: string) {
    setAttCohort(cohortId)
    const code = cohorts.find((c) => c.id === cohortId)?.code
    const filtered = data?.filter((s) => s.cohortCode === code) ?? []
    const records: typeof attRecords = {}
    filtered.forEach((s) => {
      records[s.id] = { status: 'present', note: '' }
    })
    setAttRecords(records)
  }

  async function submitAttendance() {
    if (!attCohort) return push('Select a cohort.', 'error')
    setBusy(true)
    try {
      const recordsPayload = Object.entries(attRecords).map(([studentId, r]) => ({
        studentId,
        status: r.status,
        note: r.note,
      }))
      await apiPost('/api/educator/attendance', {
        cohortId: attCohort,
        sessionDate: attDate,
        records: recordsPayload,
      })
      push('Attendance logged and XP awarded.')
      setAttOpen(false)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not log attendance', 'error')
    } finally { setBusy(false) }
  }

  async function submitAssessment() {
    if (!assStudent || !assStudent.cohortCode) return
    const cohortId = cohorts.find((c) => c.code === assStudent.cohortCode)?.id
    if (!cohortId) return push('No cohort found for student.', 'error')
    if (!assForm.title.trim()) return push('Add assessment title.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/educator/assessments', {
        studentId: assStudent.id,
        cohortId,
        title: assForm.title,
        score: Number(assForm.score),
        maxScore: Number(assForm.maxScore),
        feedback: assForm.feedback,
        xpAmount: Number(assForm.xpAmount),
      })
      push('Assessment saved and XP awarded.')
      setAssStudent(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save assessment', 'error')
    } finally { setBusy(false) }
  }

  async function submitXp() {
    if (!xpStudent) return
    setBusy(true)
    try {
      await apiPost('/api/educator/assessments', {
        studentId: xpStudent.id,
        cohortId: cohorts.find((c) => c.code === xpStudent.cohortCode)?.id || '',
        title: 'Manual XP Award',
        score: 1,
        maxScore: 1,
        feedback: xpForm.note || 'Awarded XP',
        xpAmount: Number(xpForm.amount),
      })
      push('XP awarded successfully.')
      setXpStudent(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not award XP', 'error')
    } finally { setBusy(false) }
  }

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Student' },
    { key: 'cohortCode', header: 'Cohort', render: (r) => r.cohortCode ?? '—' },
    { key: 'level', header: 'Level', render: (r) => `Lv ${r.level}` },
    { key: 'xp', header: 'XP', render: (r) => r.xp.toLocaleString() },
    { key: 'lessonsPct', header: 'Lessons', render: (r) => `${r.lessonsPct}%` },
    { key: 'avgQuizScore', header: 'Avg quiz', render: (r) => `${r.avgQuizScore}%` },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => { setAssStudent(r); setAssForm({ title: '', score: 80, maxScore: 100, feedback: '', xpAmount: 50 }) }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1"><ClipboardCheck size={12} /> Assess</button>
          <button onClick={() => { setXpStudent(r); setXpForm({ amount: 100, note: '' }) }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1"><Award size={12} /> Award XP</button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        eyebrow="Students"
        title="Your learners."
        description="Everyone across your cohorts, with progress at a glance."
        action={
          <button onClick={() => { setAttOpen(true); handleCohortChange(cohorts[0]?.id ?? '') }} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">
            <CalendarDays className="h-4 w-4" /> Record Attendance
          </button>
        }
      />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load students" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Users size={20} />} title="No students yet" description="Students appear here once assigned to your cohorts." />} />}

      {/* Attendance Modal */}
      <Modal open={attOpen} onClose={() => setAttOpen(false)} title="Record live class attendance" footer={
        <>
          <button onClick={() => setAttOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submitAttendance} disabled={busy || !attCohort} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save Attendance'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Cohort">
            <Select value={attCohort} onChange={(e) => handleCohortChange(e.target.value)}>
              <option value="">Select Cohort</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </Select>
          </Field>
          <Field label="Session Date">
            <Input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} />
          </Field>

          {attStudents.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Roll Call</p>
              <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                {attStudents.map((s) => (
                  <div key={s.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-border pb-2">
                    <span className="text-sm font-medium">{s.name}</span>
                    <div className="flex gap-2">
                      {(['present', 'absent', 'late', 'excused'] as const).map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setAttRecords({ ...attRecords, [s.id]: { ...attRecords[s.id], status } })}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize border transition ${attRecords[s.id]?.status === status ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Assessment Modal */}
      <Modal open={!!assStudent} onClose={() => setAssStudent(null)} title={`Add assessment for ${assStudent?.name}`} footer={
        <>
          <button onClick={() => setAssStudent(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submitAssessment} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save assessment'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Assessment Title"><Input value={assForm.title} onChange={(e) => setAssForm({ ...assForm, title: e.target.value })} placeholder="Yoruba Presentation, History Quiz, etc." /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Score"><Input type="number" value={assForm.score} onChange={(e) => setAssForm({ ...assForm, score: Number(e.target.value) })} /></Field>
            <Field label="Max Score"><Input type="number" value={assForm.maxScore} onChange={(e) => setAssForm({ ...assForm, maxScore: Number(e.target.value) })} /></Field>
          </div>
          <Field label="XP Reward"><Input type="number" value={assForm.xpAmount} onChange={(e) => setAssForm({ ...assForm, xpAmount: Number(e.target.value) })} /></Field>
          <Field label="Feedback / Remarks"><Textarea value={assForm.feedback} onChange={(e) => setAssForm({ ...assForm, feedback: e.target.value })} placeholder="Great work presenting your family tree!" /></Field>
        </div>
      </Modal>

      {/* XP Modal */}
      <Modal open={!!xpStudent} onClose={() => setXpStudent(null)} title={`Award XP to ${xpStudent?.name}`} footer={
        <>
          <button onClick={() => setXpStudent(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submitXp} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Awarding…' : 'Award XP'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="XP Amount"><Input type="number" value={xpForm.amount} onChange={(e) => setXpForm({ ...xpForm, amount: Number(e.target.value) })} /></Field>
          <Field label="Reason / Note"><Input value={xpForm.note} onChange={(e) => setXpForm({ ...xpForm, note: e.target.value })} placeholder="Active participation, helping a classmate, etc." /></Field>
        </div>
      </Modal>
    </>
  )
}

