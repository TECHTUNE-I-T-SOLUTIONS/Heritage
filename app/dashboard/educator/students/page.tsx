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
interface Pillar { id: string; title: string }
interface Module { id: string; title: string; pillar: string }
interface ScheduledLesson {
  id: string
  title: string
  customTitle?: string
  week: number
  session?: number
  scheduledDate?: string
  scheduledDay?: string
  scheduledTime?: string
  meetingLink?: string
  recordingLink?: string
  pillarId?: string
  moduleId?: string
}

export default function EducatorStudents() {
  const { data, loading, error, refetch } = useApi<Row[]>('/api/educator/students')
  const overview = useApi<{ cohorts: Cohort[] }>('/api/educator')
  const pillars = useApi<Pillar[]>('/api/curriculum/pillars')
  const modules = useApi<Module[]>('/api/curriculum/modules')
  const curriculum = useApi<Pillar[]>('/api/curriculum')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)

  // Attendance states
  const [attOpen, setAttOpen] = useState(false)
  const [attCohort, setAttCohort] = useState('')
  const [attPillar, setAttPillar] = useState('')
  const [attModule, setAttModule] = useState('')
  const [attLesson, setAttLesson] = useState('')
  const [attRecordingLink, setAttRecordingLink] = useState('')
  const [attNotifyStudents, setAttNotifyStudents] = useState(false)
  const [attRecords, setAttRecords] = useState<Record<string, { status: 'present' | 'absent' | 'late' | 'excused'; note: string }>>({})
  const [selectedLessonDetails, setSelectedLessonDetails] = useState<ScheduledLesson | null>(null)

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
    setAttNotifyStudents(false)
    setSelectedLessonDetails(null)
    setAttPillar('')
    setAttModule('')
    setAttLesson('')
    const code = cohorts.find((c) => c.id === cohortId)?.code
    const filtered = data?.filter((s) => s.cohortCode === code) ?? []
    const records: typeof attRecords = {}
    filtered.forEach((s) => {
      records[s.id] = { status: 'present', note: '' }
    })
    setAttRecords(records)
  }

  // Handle pillar selection
  function handlePillarChange(pillarId: string) {
    setAttPillar(pillarId)
    setAttModule('')
    setAttLesson('')
    setSelectedLessonDetails(null)
  }

  // Handle module selection
  function handleModuleChange(moduleId: string) {
    setAttModule(moduleId)
    setAttLesson('')
    setSelectedLessonDetails(null)
  }

  // Handle lesson selection
  function handleLessonSelect(lessonId: string) {
    setAttLesson(lessonId)
    const lesson = curriculum.data?.flatMap(pillar => 
      pillar.modules.flatMap(module => 
        module.lessons.filter(lesson => lesson.id === lessonId).map(lesson => ({
          ...lesson,
          pillarId: pillar.id,
          moduleId: module.id,
        }))
      )
    )?.[0]
    
    if (lesson) {
      setSelectedLessonDetails(lesson)
      setAttRecordingLink(lesson.recordingLink || '')
    }
  }

  // Get available modules for selected pillar
  const availableModules = curriculum.data?.find(p => p.id === attPillar)?.modules || []
  
  // Get available lessons for selected module
  const availableLessons = availableModules.find(m => m.id === attModule)?.lessons || []

  async function submitAttendance() {
    if (!attCohort) return push('Select a cohort.', 'error')
    if (!selectedLessonDetails) return push('Select a session to mark attendance.', 'error')
    setBusy(true)
    try {
      const recordsPayload = Object.entries(attRecords).map(([studentId, r]) => ({
        studentId,
        status: r.status,
        note: r.note,
      }))
      await apiPost('/api/educator/attendance', {
        cohortId: attCohort,
        sessionDate: selectedLessonDetails.scheduledDate || new Date().toISOString().split('T')[0],
        sessionTime: selectedLessonDetails.scheduledTime || undefined,
        week: selectedLessonDetails.week,
        session: selectedLessonDetails.session || 1,
        pillarId: selectedLessonDetails.pillarId || undefined,
        moduleId: selectedLessonDetails.moduleId || undefined,
        customTitle: selectedLessonDetails.customTitle || undefined,
        meetingLink: selectedLessonDetails.meetingLink || undefined,
        recordingLink: attRecordingLink || selectedLessonDetails.recordingLink || undefined,
        notifyStudents: attNotifyStudents,
        records: recordsPayload,
      })
      push('Attendance logged and XP awarded.')
      setAttOpen(false)
      setAttNotifyStudents(false)
      setSelectedLessonDetails(null)
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
          <button onClick={submitAttendance} disabled={busy || !attCohort || !selectedLessonDetails} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save Attendance'}</button>
        </>
      }>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Field label="Cohort">
            <Select value={attCohort} onChange={(e) => handleCohortChange(e.target.value)}>
              <option value="">Select Cohort</option>
              {cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </Select>
          </Field>

          {attCohort && (
            <>
              <Field label="Pillar">
                <Select value={attPillar} onChange={(e) => handlePillarChange(e.target.value)}>
                  <option value="">Select Pillar</option>
                  {curriculum.data?.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </Select>
              </Field>

              {attPillar && (
                <>
                  <Field label="Module">
                    <Select value={attModule} onChange={(e) => handleModuleChange(e.target.value)} disabled={!attPillar}>
                      <option value="">Select Module</option>
                      {availableModules.map((m) => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </Select>
                  </Field>

                  {attModule && (
                    <>
                      <Field label="Session">
                        <Select value={attLesson} onChange={(e) => handleLessonSelect(e.target.value)} disabled={!attModule}>
                          <option value="">Select Session</option>
                          {availableLessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.customTitle || l.title} - {l.scheduledDay || 'Not scheduled'} {l.scheduledTime || ''}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      {selectedLessonDetails && (
                        <div className="bg-secondary/50 p-4 rounded-lg border border-border">
                          <p className="text-xs font-semibold mb-3">Selected Session Details</p>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <span className="text-muted-foreground">Title:</span>
                            <span className="font-medium">{selectedLessonDetails.customTitle || selectedLessonDetails.title}</span>
                            <span className="text-muted-foreground">Week:</span>
                            <span className="font-medium">{selectedLessonDetails.week}</span>
                            <span className="text-muted-foreground">Session:</span>
                            <span className="font-medium">{selectedLessonDetails.session === 1 ? 'Saturday' : selectedLessonDetails.session === 2 ? 'Sunday' : 'Not set'}</span>
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{selectedLessonDetails.scheduledDate ? new Date(selectedLessonDetails.scheduledDate).toLocaleDateString() : 'Not set'}</span>
                            <span className="text-muted-foreground">Time (WAT):</span>
                            <span className="font-medium">{selectedLessonDetails.scheduledTime || 'Not set'}</span>
                            <span className="text-muted-foreground">Meeting:</span>
                            <span className="font-medium">{selectedLessonDetails.meetingLink ? 'Set' : 'Not set'}</span>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Students will see this time converted to their local timezone</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <Field label="Recording Link (After Class)">
            <Input value={attRecordingLink} onChange={(e) => setAttRecordingLink(e.target.value)} placeholder="https://youtube.com/..." />
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="attNotifyStudents"
              checked={attNotifyStudents}
              onChange={(e) => setAttNotifyStudents(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="attNotifyStudents" className="text-sm text-muted-foreground">
              Notify all students via email about this class update
            </label>
          </div>

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

