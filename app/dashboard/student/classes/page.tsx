'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Video, Calendar, Clock, ExternalLink, Lock, Play, AlertCircle, Globe, TrendingUp, CheckCircle2, XCircle } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, ProgressBar, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Textarea } from '@/components/ui/form'

interface LessonItem { id: string; title: string; customTitle: string | null; summary: string | null; week: number; session?: number; xpReward: number; completed: boolean; meetingLink: string | null; recordingLink: string | null; scheduledDate: string | null; scheduledDay: string | null; scheduledTime: string | null; ended?: boolean; attendanceId?: string; attendanceStatus?: string; recordingWatched?: boolean }
interface ModuleItem { id: string; title: string; unlocked: boolean; lessons: LessonItem[] }
interface Classes {
  cohort: { code: string; name: string; schedule: string | null; meetingLink: string | null; timezone: string | null } | null
  pillars: { id: string; title: string; modules: ModuleItem[] }[]
  attendanceStats?: { total: number; present: number; absent: number; rate: number }
}

export default function StudentClasses() {
  const { data, loading, error, refetch } = useApi<Classes>('/api/student/classes')
  const { push } = useToast()
  const router = useRouter()
  const [appealLesson, setAppealLesson] = useState<LessonItem | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [busy, setBusy] = useState(false)

  function openAppeal(lesson: LessonItem) {
    setAppealLesson(lesson)
    setAppealReason('')
  }

  function watchRecording(lessonId: string) {
    router.push(`/dashboard/student/classes/${lessonId}/watch`)
  }

  async function submitAppeal() {
    if (!appealLesson || !appealLesson.attendanceId) return
    setBusy(true)
    try {
      await apiPost('/api/student/appeals', {
        attendanceId: appealLesson.attendanceId,
        lessonId: appealLesson.id,
        reason: appealReason,
      })
      push('Appeal submitted successfully')
      setAppealLesson(null)
      setAppealReason('')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not submit appeal', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Convert stored Nigeria time to user's local timezone for display
  function getLocalTime(nigeriaTime: string | null): string {
    if (!nigeriaTime) return ''
    try {
      const [hours, minutes] = nigeriaTime.split(':').map(Number)
      const nigeriaDate = new Date()
      nigeriaDate.setHours(hours, minutes, 0, 0)
      
      // Get user's local timezone
      const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const localOffset = -(new Date().getTimezoneOffset() / 60) // User's local offset from UTC
      const nigeriaOffset = 1 // Nigeria is UTC+1
      
      // Calculate local time
      const utcTime = nigeriaDate.getTime() - (nigeriaOffset * 60 * 60 * 1000)
      const localDate = new Date(utcTime + (localOffset * 60 * 60 * 1000))
      
      // Format with timezone name
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: localTimezone,
        timeZoneName: 'short'
      })
      
      const formattedTime = formatter.format(localDate)
      return formattedTime
    } catch {
      return nigeriaTime
    }
  }

  const allLessons = data?.pillars.flatMap((p) => p.modules.flatMap((m) => m.lessons)) ?? []
  const unlockedLessons = allLessons.filter((l) => {
    // Find the module this lesson belongs to
    for (const pillar of data?.pillars || []) {
      for (const module of pillar.modules) {
        if (module.lessons.some((lesson) => lesson.id === l.id)) {
          return module.unlocked
        }
      }
    }
    return false
  })
  // Count only attended lessons for progress (since XP is awarded by educators for attendance)
  const attendedLessons = unlockedLessons.filter((l) => l.attendanceStatus === 'present')
  const pct = unlockedLessons.length ? Math.round((attendedLessons.length / unlockedLessons.length) * 100) : 0
  
  // Use attendance stats from API if available
  const attendanceRate = data?.attendanceStats?.rate ?? pct
  const totalAttendance = data?.attendanceStats?.total ?? 0
  const presentAttendance = data?.attendanceStats?.present ?? 0

  return (
    <>
      <PageHeading eyebrow="Classes & lessons" title="Your learning home." description="Live sessions and self-paced lessons across the four pillars." />

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load your classes" description={error} />}

      {data && (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary"><Video className="h-5 w-5 text-accent" /></span>
                <div>
                  <p className="font-medium">{data.cohort ? data.cohort.name : 'Cohort pending'}</p>
                  <p className="text-sm text-muted-foreground">{data.cohort ? `${data.cohort.code} · ${data.cohort.schedule ?? 'Schedule TBC'}` : 'You will be assigned soon.'}</p>
                </div>
              </div>
              {data.cohort?.meetingLink && <a href={data.cohort.meetingLink} target="_blank" rel="noreferrer" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Join live session</a>}
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                <span>Attendance Rate</span>
                <span>{presentAttendance}/{totalAttendance} ({attendanceRate}%)</span>
              </div>
              <ProgressBar value={attendanceRate} tone="accent" />
            </div>
          </Card>

          {/* Attendance Summary Card */}
          {data.attendanceStats && data.attendanceStats.total > 0 && (
            <Card className="mb-6 p-6">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Attendance Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{data.attendanceStats.present}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Present
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{data.attendanceStats.absent}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Absent
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{data.attendanceStats.rate}%</div>
                  <div className="text-xs text-muted-foreground">Rate</div>
                </div>
              </div>
            </Card>
          )}

          {allLessons.length === 0 && <EmptyState title="No lessons yet" description="Lessons will appear here once your programme begins." />}

          <div className="space-y-6">
            {data.pillars.filter((p) => p.modules.length).map((pillar) => (
              <div key={pillar.id}>
                <h2 className="mb-3 font-serif text-xl">{pillar.title}</h2>
                <div className="space-y-4">
                  {pillar.modules.map((module) => (
                    <div key={module.id}>
                      <div className="flex items-center gap-2 mb-3">
                        {!module.unlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                        <h3 className={`text-sm font-medium ${!module.unlocked ? 'text-muted-foreground' : ''}`}>
                          {module.title}
                        </h3>
                        {!module.unlocked && <Badge tone="neutral">Locked</Badge>}
                      </div>
                      {module.unlocked && module.lessons.length > 0 ? (
                        <div className="grid gap-3">
                          {module.lessons.map((lesson) => {
                            // Determine if lesson is upcoming based on scheduled date
                            // Check if scheduled date is in the future (regardless of ended flag)
                            const scheduledDate = lesson.scheduledDate ? new Date(lesson.scheduledDate) : null
                            const isUpcoming = scheduledDate && scheduledDate > new Date()
                            const hasScheduledInfo = lesson.scheduledDate || lesson.scheduledDay || lesson.scheduledTime
                            
                            // For display purposes, consider it "ended" only if scheduled date has passed
                            const isActuallyEnded = scheduledDate && scheduledDate <= new Date()
                            
                            return (
                            <Card key={lesson.id} className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge tone="neutral">Week {lesson.week}</Badge>
                                  <Badge tone="neutral">Session {lesson.session}</Badge>
                                  {isUpcoming && hasScheduledInfo && (
                                    <Badge tone="accent">Upcoming</Badge>
                                  )}
                                  {lesson.attendanceStatus === 'present' && (
                                    <Badge tone="success">Present</Badge>
                                  )}
                                  {lesson.attendanceStatus === 'absent' && (
                                    <Badge tone="danger">Absent</Badge>
                                  )}
                                  {!lesson.attendanceStatus && isActuallyEnded && (
                                    <Badge tone="neutral">Attendance Pending</Badge>
                                  )}
                                  <h3 className="font-medium">{lesson.customTitle || lesson.title}</h3>
                                </div>
                                {lesson.summary && <p className="mt-2 text-sm text-muted-foreground">{lesson.summary}</p>}
                                
                                {/* Scheduled class details */}
                                {(lesson.scheduledDate || lesson.scheduledDay || lesson.scheduledTime) && (
                                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    {lesson.scheduledDay && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{lesson.scheduledDay}</span>
                                      </div>
                                    )}
                                    {lesson.scheduledTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{getLocalTime(lesson.scheduledTime)}</span>
                                      </div>
                                    )}
                                    {lesson.scheduledDate && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        <span>{new Date(lesson.scheduledDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Meeting and recording links */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {lesson.meetingLink && !isUpcoming && !isActuallyEnded && (
                                    <a href={lesson.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                      <ExternalLink className="h-3 w-3" />
                                      Join Live Class
                                    </a>
                                  )}
                                  {lesson.meetingLink && isUpcoming && (
                                    <span className="text-xs text-muted-foreground">Class scheduled for {lesson.scheduledDay || new Date(lesson.scheduledDate!).toLocaleDateString()}</span>
                                  )}
                                  {isActuallyEnded && !lesson.attendanceStatus && (
                                    <span className="text-xs text-muted-foreground">Class ended - waiting for educator to mark attendance</span>
                                  )}
                                  {lesson.recordingLink && (
                                    <button onClick={() => watchRecording(lesson.id)} className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                                      <Play className="h-3 w-3" />
                                      Watch Recording
                                    </button>
                                  )}
                                  {lesson.attendanceStatus === 'absent' && lesson.recordingWatched && (
                                    <button onClick={() => openAppeal(lesson)} className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:underline">
                                      <AlertCircle className="h-3 w-3" />
                                      Request Pardon
                                    </button>
                                  )}
                                </div>

                                {lesson.attendanceStatus === 'present' && (
                                  <p className="mt-2 text-xs text-green-600">+{lesson.xpReward} XP earned for attendance</p>
                                )}
                                {lesson.attendanceStatus === 'absent' && (
                                  <p className="mt-2 text-xs text-red-600">0 XP - marked absent (watch recording and request pardon)</p>
                                )}
                              </div>
                            </Card>
                            )
                          })}
                        </div>
                      ) : module.unlocked ? (
                        <p className="text-sm text-muted-foreground">No lessons in this module yet.</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Complete the previous module's attendance and quizzes to unlock this module.</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Appeal Modal */}
      <Modal open={!!appealLesson} onClose={() => setAppealLesson(null)} title="Request Absence Pardon" footer={
        <>
          <button onClick={() => setAppealLesson(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submitAppeal} disabled={busy || !appealReason.trim()} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Submitting…' : 'Submit Appeal'}</button>
        </>
      }>
        {appealLesson && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You were marked <Badge tone="danger">Absent</Badge> for <strong>Week {appealLesson.week}, Session {appealLesson.session}: {appealLesson.customTitle || appealLesson.title}</strong>. Since you have watched the recording, you can request a pardon for this absence.
            </p>
            <Field label="Reason for Appeal">
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you were absent and why you should be pardoned..."
                rows={4}
              />
            </Field>
          </div>
        )}
      </Modal>
    </>
  )
}
