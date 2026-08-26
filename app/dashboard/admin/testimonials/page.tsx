'use client'

import { useState } from 'react'
import { MessageSquareQuote, Plus } from 'lucide-react'
import { useApi, apiPost, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea } from '@/components/ui/form'

interface Testimonial {
  id: string
  authorName: string
  relationship: string | null
  quote: string
  rating: number | null
  published: boolean
}

export default function AdminTestimonials() {
  const { data, loading, error, refetch } = useApi<Testimonial[]>('/api/admin/testimonials')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ authorName: '', relationship: '', quote: '', rating: 5 })

  // Edit / Delete states
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [editForm, setEditForm] = useState({ id: '', authorName: '', relationship: '', quote: '', rating: 5, published: false })

  const [deleting, setDeleting] = useState<Testimonial | null>(null)

  async function create() {
    if (!form.authorName.trim() || !form.quote.trim()) return push('Add an author and quote.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/admin/testimonials', {
        authorName: form.authorName,
        relationship: form.relationship || undefined,
        quote: form.quote,
        rating: Number(form.rating),
        published: false,
      })
      push('Testimonial added.')
      setOpen(false); setForm({ authorName: '', relationship: '', quote: '', rating: 5 }); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not add', 'error')
    } finally { setBusy(false) }
  }

  async function togglePublish(t: Testimonial) {
    try {
      await apiPatch('/api/admin/testimonials', { id: t.id, published: !t.published })
      push(t.published ? 'Unpublished.' : 'Published.')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    }
  }

  async function handleEdit() {
    if (!editForm.authorName.trim() || !editForm.quote.trim()) return push('Add an author and quote.', 'error')
    setBusy(true)
    try {
      await apiPatch('/api/admin/testimonials', {
        id: editForm.id,
        authorName: editForm.authorName,
        relationship: editForm.relationship || null,
        quote: editForm.quote,
        rating: Number(editForm.rating),
        published: editForm.published,
      })
      push('Testimonial updated.')
      setEditing(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update testimonial', 'error')
    } finally { setBusy(false) }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/testimonials?id=${deleting.id}`)
      push('Testimonial deleted.')
      setDeleting(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete testimonial', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Testimonials" title="Family voices." description="Curate what families say about Heritage Club." action={<button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Add testimonial</button>} />

      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load testimonials" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote size={20} />} title="No testimonials yet" description="Add your first family testimonial." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((t) => (
            <Card key={t.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.authorName}</p>
                    {t.relationship && <p className="text-xs text-muted-foreground">{t.relationship}</p>}
                  </div>
                  <Badge tone={t.published ? 'success' : 'neutral'}>{t.published ? 'Published' : 'Draft'}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">“{t.quote}”</p>
                {t.rating && <p className="mt-2 text-xs text-muted-foreground">{'★'.repeat(t.rating)}</p>}
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <button onClick={() => togglePublish(t)} className="w-full rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary">{t.published ? 'Unpublish' : 'Publish'}</button>
                <div className="flex gap-2 w-full">
                  <button onClick={() => { setEditing(t); setEditForm({ id: t.id, authorName: t.authorName, relationship: t.relationship ?? '', quote: t.quote, rating: t.rating ?? 5, published: t.published }) }} className="flex-1 rounded-full border border-border px-4 py-2 text-xs hover:bg-secondary">Edit</button>
                  <button onClick={() => setDeleting(t)} className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-4 py-2 text-xs">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Add testimonial" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={create} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Adding…' : 'Add'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Author name"><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} /></Field>
          <Field label="Relationship"><Input value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })} placeholder="Parent of two" /></Field>
          <Field label="Quote"><Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} /></Field>
          <Field label="Rating (1–5)"><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} /></Field>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Testimonial" footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleEdit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Author name"><Input value={editForm.authorName} onChange={(e) => setEditForm({ ...editForm, authorName: e.target.value })} /></Field>
          <Field label="Relationship"><Input value={editForm.relationship} onChange={(e) => setEditForm({ ...editForm, relationship: e.target.value })} /></Field>
          <Field label="Quote"><Textarea value={editForm.quote} onChange={(e) => setEditForm({ ...editForm, quote: e.target.value })} /></Field>
          <Field label="Rating (1–5)"><Input type="number" min={1} max={5} value={editForm.rating} onChange={(e) => setEditForm({ ...editForm, rating: Number(e.target.value) })} /></Field>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Testimonial" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={busy} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the testimonial from <strong>{deleting?.authorName}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}
