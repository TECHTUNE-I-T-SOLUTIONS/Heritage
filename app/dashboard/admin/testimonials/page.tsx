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
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{t.authorName}</p>
                  {t.relationship && <p className="text-xs text-muted-foreground">{t.relationship}</p>}
                </div>
                <Badge tone={t.published ? 'success' : 'neutral'}>{t.published ? 'Published' : 'Draft'}</Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">“{t.quote}”</p>
              {t.rating && <p className="mt-2 text-xs text-muted-foreground">{'★'.repeat(t.rating)}</p>}
              <button onClick={() => togglePublish(t)} className="mt-4 w-full rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">{t.published ? 'Unpublish' : 'Publish'}</button>
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
    </>
  )
}
