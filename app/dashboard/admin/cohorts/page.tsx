'use client'

import { useState } from 'react'
import { Shapes, Plus } from 'lucide-react'
import { useApi, apiPost, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select } from '@/components/ui/form'

interface Cohort {
  id: string
  code: string
  name: string
  minAge: number
  maxAge: number
  capacity: number
  schedule: string | null
  status: string
  educatorName: string | null
  educatorId: string | null
  studentCount: number
}
interface Educator extends Record<string, unknown> { id: string; fullName: string }

export default function AdminCohorts() {
  const { data, loading, error, refetch } = useApi<Cohort[]>('/api/admin/cohorts')
  const educators = useApi<Educator[]>('/api/admin/users?role=educator')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', minAge: 6, maxAge: 9, capacity: 8, schedule: '' })

  const [assigning, setAssigning] = useState<Cohort | null>(null)
  const [educatorId, setEducatorId] = useState('')

  async function create() {
    if (!form.code.trim() || !form.name.trim()) return push('Add a code and name.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/admin/cohorts', {
        ...form,
        minAge: Number(form.minAge),
        maxAge: Number(form.maxAge),
        capacity: Number(form.capacity),
        schedule: form.schedule || undefined,
      })
      push('Cohort created.')
      setOpen(false)
      setForm({ code: '', name: '', minAge: 6, maxAge: 9, capacity: 8, schedule: '' })
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not create', 'error')
    } finally { setBusy(false) }
  }

  async function assign() {
    if (!assigning) return
    setBusy(true)
    try {
      await apiPatch('/api/admin/cohorts', { id: assigning.id, educatorId: educatorId || null })
      push('Educator assigned.')
      setAssigning(null); setEducatorId(''); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not assign', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Cohorts" title="Learning groups." description="Create cohorts, set age bands, and assign educators." action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> New cohort</button>} />

      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load cohorts" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<Shapes size={20} />} title="No cohorts yet" description="Create your first cohort to begin grouping students." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-serif text-lg">{c.name}</h3>
                  <p className="text-xs text-muted-foreground">{c.code} · ages {c.minAge}–{c.maxAge}</p>
                </div>
                <Badge tone={c.status === 'active' ? 'success' : c.status === 'forming' ? 'warning' : 'neutral'}>{c.status}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                <div className="rounded-xl border border-border p-3"><p className="text-lg font-semibold">{c.studentCount}/{c.capacity}</p><p className="text-[11px] text-muted-foreground">Enrolled</p></div>
                <div className="rounded-xl border border-border p-3"><p className="truncate text-sm font-medium">{c.educatorName ?? 'Unassigned'}</p><p className="text-[11px] text-muted-foreground">Educator</p></div>
              </div>
              {c.schedule && <p className="mt-3 text-xs text-muted-foreground">{c.schedule}</p>}
              <button onClick={() => { setAssigning(c); setEducatorId(c.educatorId ?? '') }} className="mt-4 w-full rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Assign educator</button>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="New cohort" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={create} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Creating…' : 'Create'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="HC-EXPL-01" /></Field>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Explorers · Saturdays" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Min age"><Input type="number" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: Number(e.target.value) })} /></Field>
            <Field label="Max age"><Input type="number" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: Number(e.target.value) })} /></Field>
            <Field label="Capacity"><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Schedule"><Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Saturdays · 10:00 EST" /></Field>
        </div>
      </Modal>

      <Modal open={!!assigning} onClose={() => setAssigning(null)} title="Assign educator" footer={
        <>
          <button onClick={() => setAssigning(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={assign} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </>
      }>
        <Field label="Educator">
          <Select value={educatorId} onChange={(e) => setEducatorId(e.target.value)}>
            <option value="">Unassigned</option>
            {educators.data?.map((ed) => <option key={ed.id} value={ed.id}>{ed.fullName}</option>)}
          </Select>
        </Field>
      </Modal>
    </>
  )
}
