'use client'

import { useState } from 'react'
import { Users, FileText, CheckCircle2, CalendarDays } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, Card, StatCard, EmptyState, SkeletonCards, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input } from '@/components/ui/form'

interface Cohort { id: string; code: string; name: string; schedule: string | null; meetingLink: string | null; capacity: number }
interface Overview {
  cohorts: Cohort[]
  studentCount: number
  pendingSubmissions: number
  quizCount: number
}

export default function EducatorOverview() {
  const { data, loading, error, refetch } = useApi<Overview>('/api/educator')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)

  const [scheduling, setScheduling] = useState<Cohort | null>(null)
  const [form, setForm] = useState({ schedule: '', meetingLink: '' })

  async function saveSchedule() {
    if (!scheduling) return
    setBusy(true)
    try {
      await apiPatch('/api/educator', { id: scheduling.id, schedule: form.schedule, meetingLink: form.meetingLink })
      push('Class schedule updated successfully.')
      setScheduling(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save schedule', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Educator workspace" title="Teach with the full picture." description="Plan, connect, and celebrate every learner." />

      {loading && <SkeletonCards count={3} />}
      {error && <EmptyState title="Couldn't load your workspace" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Cohorts" value={data.cohorts.length} icon={<CalendarDays size={18} />} />
            <StatCard label="Students" value={data.studentCount} icon={<Users size={18} />} />
            <StatCard label="To review" value={data.pendingSubmissions} icon={<FileText size={18} />} />
            <StatCard label="Quizzes" value={data.quizCount} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-serif text-xl">Your cohorts</h2>
            {data.cohorts.length === 0 ? (
              <EmptyState title="No cohorts assigned" description="An admin will assign you to cohorts soon." />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.cohorts.map((c) => (
                  <Card key={c.id} className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-lg">{c.name}</h3>
                        <Badge tone="accent">{c.code}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{c.schedule ?? 'Schedule TBC'}</p>
                      {c.meetingLink && <p className="mt-1 text-xs text-accent truncate">Link: {c.meetingLink}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">Capacity {c.capacity}</p>
                    </div>
                    <button
                      onClick={() => { setScheduling(c); setForm({ schedule: c.schedule ?? '', meetingLink: c.meetingLink ?? '' }) }}
                      className="mt-4 w-full rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary"
                    >
                      Schedule Class
                    </button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal open={!!scheduling} onClose={() => setScheduling(null)} title="Schedule live class" footer={
        <>
          <button onClick={() => setScheduling(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={saveSchedule} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save schedule'}</button>
        </>
      }>
        {scheduling && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Schedule live class time and add platform link (Google Meet, Zoom, Skype, etc.) for cohort <strong>{scheduling.name}</strong>.</p>
            <Field label="Schedule description"><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Saturdays at 10:00 AM EST" /></Field>
            <Field label="Meeting URL"><Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/xxx-xxxx-xxx" /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}

