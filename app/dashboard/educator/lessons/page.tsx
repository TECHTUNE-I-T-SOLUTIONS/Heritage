'use client'

import { useState, useMemo } from 'react'
import { BookOpen, Edit2, Calendar, Clock, Video, Lock, Unlock, Plus, Trash2, Globe, ExternalLink, StopCircle, Users } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { convertNigeriaTimeToCanada, convertCanadaTimeToNigeria, getCanadaTimezone } from '@/lib/timezone'
import { useRouter } from 'next/navigation'

interface Lesson { id: string; pillar: string; module: string; title: string; customTitle?: string; week: number; session?: number; xpReward: number; status: string; meetingLink?: string; recordingLink?: string; scheduledDate?: string; scheduledDay?: string; scheduledTime?: string; ended?: boolean }
interface Module { id: string; title: string; status: string; unlockedByEducator?: boolean; lessons: Lesson[] }
interface Pillar { id: string; title: string; slug: string; status: string; modules: Module[] }

export default function EducatorLessons() {
  const { data, loading, error, refetch } = useApi<Pillar[]>('/api/curriculum')
  const { push } = useToast()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  
  // Lesson creation/editing state
  const [creatingLesson, setCreatingLesson] = useState<{ moduleId: string; week: number } | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null)
  
  const [lessonForm, setLessonForm] = useState({
    title: '',
    customTitle: '',
    meetingLink: '',
    recordingLink: '',
    scheduledDate: '',
    scheduledTime: '', // Nigeria time (WAT)
    session: '1', // 1 = Saturday, 2 = Sunday
    ended: false,
    notifyStudents: false,
  })

  // Calculate Canada time equivalent based on Nigeria time input
  const canadaTime = useMemo(() => {
    if (!lessonForm.scheduledTime) return null
    return convertNigeriaTimeToCanada(lessonForm.scheduledTime)
  }, [lessonForm.scheduledTime])

  async function saveLesson() {
    if (!creatingLesson && !editingLesson) return
    setBusy(true)
    try {
      if (creatingLesson) {
        // Create new lesson - store Nigeria time, Canada time will be calculated server-side
        await apiPost('/api/educator/lessons', {
          moduleId: creatingLesson.moduleId,
          title: lessonForm.title,
          customTitle: lessonForm.customTitle || undefined,
          week: creatingLesson.week,
          session: lessonForm.session,
          meetingLink: lessonForm.meetingLink || undefined,
          recordingLink: lessonForm.recordingLink || undefined,
          scheduledDate: lessonForm.scheduledDate || undefined,
          scheduledTime: lessonForm.scheduledTime || undefined, // Nigeria time (WAT)
          notifyStudents: lessonForm.notifyStudents,
        })
        push('Lesson created successfully.')
      } else if (editingLesson) {
        // Update existing lesson
        // Only send ended field if it was explicitly changed or is true
        const payload: any = {
          lessonId: editingLesson.id,
          customTitle: lessonForm.customTitle || undefined,
          meetingLink: lessonForm.meetingLink || undefined,
          recordingLink: lessonForm.recordingLink || undefined,
          scheduledDate: lessonForm.scheduledDate || undefined,
          scheduledTime: lessonForm.scheduledTime || undefined, // Nigeria time (WAT)
          session: lessonForm.session || undefined,
          notifyStudents: lessonForm.notifyStudents,
        }
        
        // Only include ended field if it's explicitly true or if it changed from the original value
        if (lessonForm.ended !== editingLesson.ended) {
          payload.ended = lessonForm.ended
        }
        
        await apiPost('/api/educator/lessons/schedule', payload)
        push('Lesson updated successfully.')
      }
      setCreatingLesson(null)
      setEditingLesson(null)
      resetLessonForm()
      // Refetch to show the new/updated lesson
      await refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save lesson', 'error')
    } finally { setBusy(false) }
  }

  async function deleteLesson() {
    if (!deletingLesson) return
    setBusy(true)
    try {
      await fetch(`/api/educator/lessons?id=${deletingLesson.id}`, { method: 'DELETE' })
      push('Lesson deleted successfully.')
      setDeletingLesson(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete lesson', 'error')
    } finally { setBusy(false) }
  }

  async function endLesson(lesson: Lesson) {
    setBusy(true)
    try {
      await apiPost('/api/educator/lessons/schedule', {
        lessonId: lesson.id,
        ended: true,
      })
      push('Class marked as ended successfully.')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not end class', 'error')
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

  function openCreateModal(moduleId: string, week: number) {
    setCreatingLesson({ moduleId, week })
    setEditingLesson(null)
    resetLessonForm()
  }

  function openEditModal(lesson: Lesson) {
    setEditingLesson(lesson)
    setCreatingLesson(null)
    setLessonForm({
      title: lesson.title,
      customTitle: lesson.customTitle || '',
      meetingLink: lesson.meetingLink || '',
      recordingLink: lesson.recordingLink || '',
      scheduledDate: lesson.scheduledDate ? lesson.scheduledDate.split('T')[0] : '',
      scheduledTime: lesson.scheduledTime || '', // Nigeria time (WAT)
      session: lesson.session === 2 ? '2' : '1',
      ended: lesson.ended || false,
      notifyStudents: false,
    })
  }

  function resetLessonForm() {
    setLessonForm({
      title: '',
      customTitle: '',
      meetingLink: '',
      recordingLink: '',
      scheduledDate: '',
      scheduledTime: '',
      session: '1',
      ended: false,
      notifyStudents: false,
    })
  }

  // Check if a class is upcoming (hasn't ended yet)
  function isClassUpcoming(scheduledDate: string | null, ended: boolean = false): boolean {
    if (!scheduledDate || ended) return false
    const now = new Date()
    const classDate = new Date(scheduledDate)
    return classDate > now
  }

  return (
    <>
      <PageHeading eyebrow="Lessons" title="The curriculum." description="The full programme across the four pillars. Add and schedule class sessions." />
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
                    <div key={m.id} className="border border-border rounded-xl p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">Week {pillar.modules.indexOf(m) + 1}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                          <button
                            onClick={() => toggleModuleUnlock(m.id, m.unlockedByEducator || false)}
                            disabled={busy}
                            className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary flex items-center gap-1"
                          >
                            {m.unlockedByEducator ? <><Unlock className="h-3 w-3" /> Unlocked</> : <><Lock className="h-3 w-3" /> Locked</>}
                          </button>
                          <button
                            onClick={() => openCreateModal(m.id, pillar.modules.indexOf(m) + 1)}
                            className="rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground flex items-center gap-1 hover:bg-primary/90"
                          >
                            <Plus className="h-3 w-3" /> Add Session
                          </button>
                        </div>
                      </div>
                      
                      {m.lessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No sessions scheduled yet. Click "Add Session" to create Saturday or Sunday classes.</p>
                      ) : (
                        <div className="space-y-2">
                          {m.lessons.map((l) => (
                            <div key={l.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-3 bg-secondary/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge tone="neutral">Wk {l.week}</Badge>
                                  {l.session && (
                                    <Badge tone={l.session === 1 ? 'success' : 'accent'}>{l.session === 1 ? 'Saturday' : 'Sunday'}</Badge>
                                  )}
                                  <span className="font-medium">{l.customTitle || l.title}</span>
                                </div>
                                {(l.scheduledDate || l.scheduledTime || l.meetingLink || l.recordingLink || l.ended) && (
                                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {l.ended && (
                                      <Badge tone="neutral">Ended</Badge>
                                    )}
                                    {l.scheduledDate && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(l.scheduledDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                    {l.scheduledTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{l.scheduledTime} WAT</span>
                                      </div>
                                    )}
                                    {l.scheduledTime && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        <span>Students see local time</span>
                                      </div>
                                    )}
                                    {l.meetingLink && (
                                      <div className="flex items-center gap-1">
                                        <Video className="h-3 w-3" />
                                        <span>Meeting link set</span>
                                      </div>
                                    )}
                                    {l.recordingLink && (
                                      <div className="flex items-center gap-1">
                                        <Video className="h-3 w-3" />
                                        <span>Recording available</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <span className="text-xs text-accent">+{l.xpReward} XP</span>
                                {l.meetingLink && isClassUpcoming(l.scheduledDate, l.ended) && (
                                  <a
                                    href={l.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground flex items-center gap-1 hover:bg-primary/90"
                                  >
                                    <ExternalLink className="h-3 w-3" /> Start Class
                                  </a>
                                )}
                                {!l.ended && (
                                  <button
                                    onClick={() => endLesson(l)}
                                    disabled={busy}
                                    className="rounded-full border border-amber-500/20 text-amber-600 bg-amber-500/5 hover:bg-amber-500/10 px-2.5 py-1 text-xs flex items-center gap-1 disabled:opacity-60"
                                  >
                                    <StopCircle className="h-3 w-3" /> End Class
                                  </button>
                                )}
                                <button
                                  onClick={() => router.push(`/dashboard/educator/lessons/${l.id}`)}
                                  className="rounded-full border border-blue-500/20 text-blue-600 bg-blue-500/5 hover:bg-blue-500/10 px-2.5 py-1 text-xs flex items-center gap-1"
                                >
                                  <Users className="h-3 w-3" /> Details
                                </button>
                                <button onClick={() => openEditModal(l)} className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary flex items-center gap-1">
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                                <button onClick={() => setDeletingLesson(l)} className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-2.5 py-1 text-xs flex items-center gap-1">
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}

      {/* Create/Edit Lesson Modal */}
      <Modal 
        open={!!creatingLesson || !!editingLesson} 
        onClose={() => { setCreatingLesson(null); setEditingLesson(null); resetLessonForm(); }} 
        title={creatingLesson ? 'Schedule New Session' : 'Edit Session'} 
        footer={
          <>
            <button onClick={() => { setCreatingLesson(null); setEditingLesson(null); resetLessonForm(); }} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
            <button onClick={saveLesson} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-4">
          {creatingLesson && (
            <Field label="Session Title">
              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g., Introduction to African Languages" />
            </Field>
          )}
          <Field label="Custom Title (Optional)">
            <Input value={lessonForm.customTitle} onChange={(e) => setLessonForm({ ...lessonForm, customTitle: e.target.value })} placeholder="Override the default title for this session" />
          </Field>
          <Field label="Session Type">
            <Select value={lessonForm.session} onChange={(e) => setLessonForm({ ...lessonForm, session: e.target.value })}>
              <option value="1">Session 1 - Saturday (Main Teaching)</option>
              <option value="2">Session 2 - Sunday (Quiz/Assignment/Further Explanation)</option>
            </Select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date">
              <Input type="date" value={lessonForm.scheduledDate} onChange={(e) => setLessonForm({ ...lessonForm, scheduledDate: e.target.value })} />
            </Field>
            <Field label="Time (Nigeria - WAT)">
              <Input type="time" value={lessonForm.scheduledTime} onChange={(e) => setLessonForm({ ...lessonForm, scheduledTime: e.target.value })} />
            </Field>
          </div>
          
          {/* Timezone Conversion Display */}
          {lessonForm.scheduledTime && canadaTime && (
            <div className="bg-secondary/50 p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-accent" />
                <p className="text-xs font-semibold">Time Conversion</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Nigeria (WAT):</span>
                  <span className="ml-2 font-medium">{lessonForm.scheduledTime}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Canada ({canadaTime.timezone}):</span>
                  <span className="ml-2 font-medium">{canadaTime.time}</span>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Students in Canada will see this class at {canadaTime.time} {canadaTime.timezone}
              </p>
            </div>
          )}
          <Field label="Meeting Link (Zoom/Google Meet)">
            <Input value={lessonForm.meetingLink} onChange={(e) => setLessonForm({ ...lessonForm, meetingLink: e.target.value })} placeholder="https://zoom.us/j/..." />
          </Field>
          <Field label="Recording Link (Google Drive/YouTube)">
            <Input value={lessonForm.recordingLink} onChange={(e) => setLessonForm({ ...lessonForm, recordingLink: e.target.value })} placeholder="https://drive.google.com/..." />
            <p className="mt-1 text-xs text-muted-foreground">
              💡 Tip: Convert recordings to WebM format for lighter streaming and better browser compatibility. Direct video files (MP4, WebM) work best for in-platform playback.
            </p>
          </Field>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifyStudents"
              checked={lessonForm.notifyStudents}
              onChange={(e) => setLessonForm({ ...lessonForm, notifyStudents: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="notifyStudents" className="text-sm text-muted-foreground">
              Notify all students via email about this scheduled class
            </label>
          </div>
          {editingLesson && editingLesson.ended && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ended"
                checked={lessonForm.ended}
                onChange={(e) => setLessonForm({ ...lessonForm, ended: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <label htmlFor="ended" className="text-sm text-muted-foreground">
                Unmark class as ended (allow students to see join button again)
              </label>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        open={!!deletingLesson} 
        onClose={() => setDeletingLesson(null)} 
        title="Delete Session" 
        footer={
          <>
            <button onClick={() => setDeletingLesson(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
            <button onClick={deleteLesson} disabled={busy} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete the session <strong>{deletingLesson?.customTitle || deletingLesson?.title}</strong>? This action is permanent and cannot be undone.
        </p>
      </Modal>
    </>
  )
}
