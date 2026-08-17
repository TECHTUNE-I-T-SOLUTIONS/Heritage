'use client'

import { useState } from 'react'
import { UserPlus, ShieldCheck } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { Card, Skeleton } from '@/components/ui/kit'
import { Field, Input, Select } from '@/components/ui/form'
import { Modal, useToast } from '@/components/ui/interactive'
import { COUNTRIES, TIMEZONES } from '@/lib/options'

interface Parent {
  _id: string
  fullName: string
  email: string
  phone: string | null
  country: string | null
  timezone: string | null
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}

export function StudentParentCard() {
  const { data, loading, error, refetch } = useApi<{ parent: Parent | null }>('/api/account/parent')
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', country: '', timezone: '' })

  async function addParent(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiPost('/api/account/parent', form)
      push('Parent details added.')
      setOpen(false)
      refetch()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not add parent', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="lg:col-span-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl">Parent / guardian</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.parent ? 'Your linked parent or guardian. Only they can edit these details.' : 'Link a parent or guardian to your account.'}
          </p>
        </div>
        {!loading && !data?.parent && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <UserPlus size={15} /> Add parent
          </button>
        )}
      </div>

      {loading && <Skeleton className="mt-5 h-32" />}
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {data?.parent && (
        <div className="mt-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            <ShieldCheck size={13} /> Read-only
          </div>
          <Row label="Full name" value={data.parent.fullName} />
          <Row label="Email" value={data.parent.email} />
          <Row label="Phone" value={data.parent.phone} />
          <Row label="Country" value={data.parent.country} />
          <Row label="Time zone" value={data.parent.timezone} />
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add parent details"
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full border border-border px-6 text-sm font-medium hover:bg-secondary">Cancel</button>
            <button form="add-parent-form" disabled={saving} className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : 'Add parent'}</button>
          </>
        }
      >
        <form id="add-parent-form" className="grid gap-4" onSubmit={addParent}>
          <Field label="Full name"><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email" hint="They can use “forgot password” to access their own account."><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Country">
            <Select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
              <option value="" disabled>Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Time zone">
            <Select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
              <option value="" disabled>Select time zone</option>
              {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
        </form>
      </Modal>
    </Card>
  )
}
