'use client'

import { useState } from 'react'
import { Sparkles, Trophy } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'

interface LeaderRow { rank: number; id: string; name: string; xp: number; level: number; streak: number }
interface Student extends Record<string, unknown> { id: string; fullName: string }

export default function AdminGamification() {
  const { data, loading, error, refetch } = useApi<LeaderRow[]>('/api/admin/gamification')
  const students = useApi<Student[]>('/api/admin/users?role=student')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ studentId: '', amount: 100, note: '' })

  async function grant() {
    if (!form.studentId) return push('Choose a student.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/admin/gamification', { studentId: form.studentId, amount: Number(form.amount), note: form.note || undefined })
      push('XP awarded.')
      setOpen(false); setForm({ studentId: '', amount: 100, note: '' }); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not award XP', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Gamification" title="XP & leaderboard." description="Reward standout effort and see the top learners." action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Sparkles className="h-4 w-4" /> Award XP</button>} />

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load leaderboard" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<Trophy size={20} />} title="No learners yet" description="XP standings appear once students earn points." />
      ) : (
        <div className="space-y-2">
          {data.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{r.rank}</span>
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.streak} day streak</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone="accent">Level {r.level}</Badge>
                <span className="text-sm font-semibold">{r.xp.toLocaleString()} XP</span>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Award XP" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={grant} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Awarding…' : 'Award'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Student"><Select value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}><option value="">Select student</option>{students.data?.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}</Select></Field>
          <Field label="XP amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
          <Field label="Note (optional)"><Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Reason for the award" /></Field>
        </div>
      </Modal>
    </>
  )
}
