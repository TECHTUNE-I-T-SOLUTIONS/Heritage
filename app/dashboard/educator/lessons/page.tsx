'use client'

import { useState } from 'react'
import { BookOpen, Edit2, Calendar, Clock, Video, Lock, Unlock } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'

interface Lesson { id: string; title: string; customTitle?: string; week: number; xpReward: number; status: string; meetingLink?: string; scheduledDate?: string; scheduledDay?: string; scheduledTime?: string }
interface Module { id: string; title: string; status: string; unlockedByEducator?: boolean; lessons: Lesson[] }
interface Pillar { id: string; title: string; slug: string; status: string; modules: Module[] }

export default function EducatorLessons() {
  const { data, loading, error, refetch } = useApi<Pillar[]>('/api/curriculum')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [classForm, setClassForm] = useState({
    customTitle: '',
    meetingLink: '',
    scheduledDate: '',
    scheduledTime: '',
    notifyStudents: false,
  })

  async function saveClassDetails() {
    if (!editingLesson) return
    setBusy(true)
    try {
      await apiPost('/api/educator/lessons/schedule', {
        lessonId: editingLesson.id,
        customTitle: classForm.customTitle || undefined,
        meetingLink: classForm.meetingLink || undefined,
        scheduledDate: classForm.scheduledDate || undefined,
        scheduledTime: classForm.scheduledTime || undefined,
        notifyStudents: classForm.notifyStudents,
      })
      push('Class details saved successfully.')
      setEditingLesson(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save class details', 'error')
    } finally { setBusy(false) }
  }

  async function toggleModuleUnlock(moduleId: string, currentStatus: boolean) {
    setBusy(true)
    try {
      await apiPost('/api/educator/modules/unlock', {
        moduleId,
        unlocked: !currentStatus,
      })
      push(`Module ${!currentStatus ? 'unlocked' : 'locked'} successfully.`)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update module', 'error')
    } finally { setBusy(false) }
  }

  function openEditModal(lesson: Lesson) {
    setEditingLesson(lesson)
    setClassForm({
      customTitle: lesson.customTitle || '',
      meetingLink: lesson.meetingLink || '',
      scheduledDate: lesson.scheduledDate ? lesson.scheduledDate.split('T')[0] : '',
      scheduledTime: lesson.scheduledTime || '',
      notifyStudents: false,
    })
  }

  return (
    <>
      <PageHeading eyebrow="Lessons" title="The curriculum." description="The full programme across the four pillars." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load curriculum" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<BookOpen size={20} />} title="No curriculum yet" description="Pillars and lessons will appear here once created." />
      ) : (
        <div className="space-y-6">
          {data.map((pillar) => (
            <Card key={pillar.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">{pillar.title}</h2>
                <Badge tone={pillar.status === 'published' ? 'success' : 'neutral'}>{pillar.status}</Badge>
              </div>
              {pillar.modules.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No modules yet.</p> : (
                <div className="mt-4 space-y-4">
                  {pillar.modules.map((m) => (
                    <div key={m.id}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{m.title}</p>
                        <button
                          onClick={() => toggleModuleUnlock(m.id, m.unlockedByEducator || false)}
                          disabled={busy}
                          className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary flex items-center gap-1"
                        >
                          {m.unlockedByEducator ? <><Unlock className="h-3 w-3" /> Unlocked</> : <><Lock className="h-3 w-3" /> Locked</>}
                        </button>
                      </div>
                      <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                        {m.lessons.length === 0 ? <li className="px-4 py-2.5 text-sm text-muted-foreground">No lessons</li> : m.lessons.map((l) => (
                          <li key={l.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 text-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge tone="neutral">Wk {l.week}</Badge>
                                <span className="font-medium">{l.customTitle || l.title}</span>
                              </div>
                              {(l.scheduledDate || l.scheduledTime || l.meetingLink) && (
                                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {l.scheduledDate && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(l.scheduledDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {l.scheduledTime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{l.scheduledTime}</span>
                                    </div>
                                  )}
                                  {l.meetingLink && (
                                    <div className="flex items-center gap-1">
                                      <Video className="h-3 w-3" />
                                      <span>Meeting link set</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-accent">+{l.xpReward} XP</span>
                              <button onClick={() => openEditModal(l)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary flex items-center gap-1">
                                <Edit2 className="h-3 w-3" /> Schedule
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}

      {/* Schedule Class Modal */}
      <Modal open={!!editingLesson} onClose={() => setEditingLesson(null)} title="Schedule Live Class" footer={
        <>
          <button onClick={() => setEditingLesson(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={saveClassDetails} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </>
      }>
        {editingLesson && (
          <div className="space-y-4">
            <Field label="Default Title">
              <Input value={editingLesson.title} disabled className="bg-muted" />
            </Field>
            <Field label="Custom Class Title (Optional)">
              <Input value={classForm.customTitle} onChange={(e) => setClassForm({ ...classForm, customTitle: e.target.value })} placeholder="Override the default title for this session" />
            </Field>
            <Field label="Meeting Link (Zoom/Google Meet)">
              <Input value={classForm.meetingLink} onChange={(e) => setClassForm({ ...classForm, meetingLink: e.target.value })} placeholder="https://zoom.us/j/..." />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date">
                <Input type="date" value={classForm.scheduledDate} onChange={(e) => setClassForm({ ...classForm, scheduledDate: e.target.value })} />
              </Field>
              <Field label="Time">
                <Input type="time" value={classForm.scheduledTime} onChange={(e) => setClassForm({ ...classForm, scheduledTime: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyStudents"
                checked={classForm.notifyStudents}
                onChange={(e) => setClassForm({ ...classForm, notifyStudents: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="notifyStudents" className="text-sm text-muted-foreground">
                Notify all students via email about this scheduled class
              </label>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
