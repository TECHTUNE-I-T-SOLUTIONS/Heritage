'use client'

import { useState } from 'react'
import { Sparkles, Trophy, ClipboardList, Settings, Trash2 } from 'lucide-react'
import { useApi, apiPost, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'

interface LeaderRow { rank: number; id: string; name: string; xp: number; level: number; streak: number }
interface Student extends Record<string, unknown> { id: string; fullName: string }
interface XpEventItem { id: string; source: string; amount: number; note: string | null; createdAt: string }

export default function AdminGamification() {
  const { data, loading, error, refetch } = useApi<LeaderRow[]>('/api/admin/gamification')
  const students = useApi<Student[]>('/api/admin/users?role=student')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ studentId: '', amount: 100, note: '' })

  // Details state
  const [viewStudent, setViewStudent] = useState<LeaderRow | null>(null)
  const xpEvents = useApi<XpEventItem[]>(viewStudent ? `/api/admin/gamification?studentId=${viewStudent.id}` : null)

  // Adjust state
  const [adjustStudent, setAdjustStudent] = useState<LeaderRow | null>(null)
  const [adjustForm, setAdjustForm] = useState({ xp: 0, streak: 0, level: 1 })

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

  async function adjust() {
    if (!adjustStudent) return
    setBusy(true)
    try {
      await apiPatch('/api/admin/gamification', { id: adjustStudent.id, xp: Number(adjustForm.xp), streak: Number(adjustForm.streak), level: Number(adjustForm.level) })
      push('Student stats updated.')
      setAdjustStudent(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not adjust stats', 'error')
    } finally { setBusy(false) }
  }

  async function deleteXpEvent(eventId: string) {
    setBusy(true)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/gamification?id=${eventId}`)
      push('XP event deleted. Totals recalculated.')
      xpEvents.refetch()
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete XP event', 'error')
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
            <Card key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3">
              <div className="flex items-center gap-4">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{r.rank}</span>
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.streak} day streak</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                <Badge tone="accent">Level {r.level}</Badge>
                <span className="text-sm font-semibold mr-2">{r.xp.toLocaleString()} XP</span>
                <div className="flex gap-2">
                  <button onClick={() => setViewStudent(r)} className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground" title="View details"><ClipboardList size={16} /></button>
                  <button onClick={() => { setAdjustStudent(r); setAdjustForm({ xp: r.xp, streak: r.streak, level: r.level }) }} className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground" title="Adjust Stats"><Settings size={16} /></button>
                </div>
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

      {/* Details / History Modal */}
      <Modal open={!!viewStudent} onClose={() => setViewStudent(null)} title={`${viewStudent?.name} - XP History`}>
        <div className="space-y-4">
          {xpEvents.loading && <Skeleton className="h-32" />}
          {xpEvents.data && (xpEvents.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No XP events logged yet.</p>
          ) : (
            <ul className="divide-y divide-border text-sm max-h-[40vh] overflow-y-auto pr-2">
              {xpEvents.data.map((e) => (
                <li key={e.id} className="py-2.5 flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-semibold">{e.source.replace('_', ' ')}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
                    </div>
                    {e.note && <p className="text-xs text-muted-foreground mt-1">{e.note}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-accent">+{e.amount} XP</span>
                    <button onClick={() => deleteXpEvent(e.id)} className="text-muted-foreground hover:text-red-500" title="Delete XP event"><Trash2 size={14} /></button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </Modal>

      {/* Adjust Modal */}
      <Modal open={!!adjustStudent} onClose={() => setAdjustStudent(null)} title={`Adjust Stats for ${adjustStudent?.name}`} footer={
        <>
          <button onClick={() => setAdjustStudent(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={adjust} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Total XP"><Input type="number" value={adjustForm.xp} onChange={(e) => setAdjustForm({ ...adjustForm, xp: Number(e.target.value) })} /></Field>
          <Field label="Streak (days)"><Input type="number" value={adjustForm.streak} onChange={(e) => setAdjustForm({ ...adjustForm, streak: Number(e.target.value) })} /></Field>
          <Field label="Level"><Input type="number" value={adjustForm.level} onChange={(e) => setAdjustForm({ ...adjustForm, level: Number(e.target.value) })} /></Field>
        </div>
      </Modal>
    </>
  )
}
