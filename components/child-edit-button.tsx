'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { apiPatch } from '@/lib/client'
import { Field, Input } from '@/components/ui/form'
import { Modal, useToast } from '@/components/ui/interactive'

export interface EditableChild {
  id: string
  fullName: string
  preferredName: string | null
  age: number | null
}

export function ChildEditButton({ child, onSaved }: { child: EditableChild; onSaved: () => void }) {
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: child.fullName,
    preferredName: child.preferredName ?? '',
    age: child.age ?? '',
  })

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiPatch(`/api/parent/children/${child.id}`, {
        fullName: form.fullName,
        preferredName: form.preferredName || undefined,
        age: form.age === '' ? undefined : Number(form.age),
      })
      push('Child details updated.')
      setOpen(false)
      onSaved()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
      >
        <Pencil size={13} /> Edit
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={`Edit ${child.fullName}`}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-full border border-border px-6 text-sm font-medium hover:bg-secondary">Cancel</button>
            <button form="edit-child-form" disabled={saving} className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
          </>
        }
      >
        <form id="edit-child-form" className="grid gap-4" onSubmit={save}>
          <Field label="Full name"><Input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Preferred name"><Input value={form.preferredName} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} /></Field>
          <Field label="Age"><Input type="number" min={3} max={19} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></Field>
        </form>
      </Modal>
    </>
  )
}
