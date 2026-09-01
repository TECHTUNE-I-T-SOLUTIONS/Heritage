'use client'

import Link from 'next/link'
import { Trophy, Flame, CheckCircle2, BookOpen, ArrowRight, Video, Calendar, Clock, ExternalLink } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, ProgressBar, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { formatDate } from '@/lib/format'

interface Overview {
  name: string
  xp: number
  level: number
  streak: number
  cohort: { code: string; name: string; schedule: string | null; meetingLink: string | null } | null
  progress: { lessonsCompleted: number; lessonsTotal: number; lessonsPct: number; avgQuizScore: number; xpInto: number; xpNeeded: number }
  quizzesAvailable: number
  quizzesTaken: number
  upcomingAssignments: { id: string; title: string; dueDate: string | null }[]
  nextClass: { id: string; title: string; customTitle: string | null; week: number; scheduledDate: string | null; scheduledDay: string | null; scheduledTime: string | null; meetingLink: string | null } | null
}

export default function StudentDashboard() {
  const { data, loading, error } = useApi<Overview>('/api/student')

  return (
    <>
      <PageHeading eyebrow={data ? `Welcome back, ${data.name}` : 'Welcome back'} title="Your next chapter starts here." description="Keep building your story, one lesson at a time." />

      {loading && <SkeletonCards count={4} />}
      {error && <EmptyState title="Couldn't load your dashboard" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Level" value={data.level} detail={`${data.progress.xpInto}/${data.progress.xpNeeded} XP to next`} icon={<Trophy size={18} />} />
            <StatCard label="Total XP" value={data.xp.toLocaleString()} icon={<Trophy size={18} />} />
            <StatCard label="Streak" value={`${data.streak} days`} icon={<Flame size={18} />} />
            <StatCard label="Avg quiz" value={`${data.progress.avgQuizScore}%`} detail={`${data.quizzesTaken}/${data.quizzesAvailable} taken`} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">Your progress</h2>
                <Badge tone="accent">{data.progress.lessonsPct}%</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{data.progress.lessonsCompleted} of {data.progress.lessonsTotal} lessons complete</p>
              <div className="mt-4"><ProgressBar value={data.progress.lessonsPct} tone="accent" /></div>
              <Link href="/dashboard/student/classes" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent">Continue learning <ArrowRight className="h-4 w-4" /></Link>
            </Card>

            <Card>
              <div className="mb-4 flex items-center gap-2"><Video className="h-4 w-4 text-accent" /><h2 className="font-serif text-xl">Live class</h2></div>
              {data.cohort ? (
                <div>
                  <p className="font-medium">{data.cohort.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{data.cohort.code} · {data.cohort.schedule ?? 'Schedule TBC'}</p>
                  
                  {data.nextClass ? (
                    <div className="mt-4 rounded-lg bg-secondary p-3">
                      <p className="text-sm font-medium">{data.nextClass.customTitle || data.nextClass.title}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {data.nextClass.scheduledDay && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{data.nextClass.scheduledDay}</span>
                          </div>
                        )}
                        {data.nextClass.scheduledTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{data.nextClass.scheduledTime}</span>
                          </div>
                        )}
                        {data.nextClass.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(data.nextClass.scheduledDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      {data.nextClass.meetingLink && (
                        <a href={data.nextClass.meetingLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          Join Meeting
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No upcoming class scheduled.</p>
                  )}
                  
                  {data.cohort.meetingLink && !data.nextClass?.meetingLink && (
                    <a href={data.cohort.meetingLink} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Join session</a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">You'll be assigned to a cohort soon.</p>
              )}
            </Card>
          </div>

          <div className="mt-4">
            <Card>
              <h2 className="font-serif text-xl">Upcoming assignments</h2>
              {data.upcomingAssignments.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nothing due right now. Nice work staying on top of things!</p>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {data.upcomingAssignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                      <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" />{a.title}</span>
                      <span className="text-muted-foreground">{a.dueDate ? formatDate(a.dueDate) : 'No due date'}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/dashboard/student/assignments" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent">View all assignments <ArrowRight className="h-4 w-4" /></Link>
            </Card>
          </div>
        </>
      )}
    </>
  )
}
