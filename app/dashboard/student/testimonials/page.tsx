'use client'

import { useState } from 'react'
import { MessageSquareQuote, Plus } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
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

export default function StudentTestimonials() {
  const { data, loading, error, refetch } = useApi<Testimonial[]>('/api/testimonials')
  const { push } = useToast()

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ quote: '', rating: 5 })

  async function create() {
    if (!form.quote.trim()) return push('Add a testimonial quote.', 'error')
    setBusy(true)
    try {
      await apiPost('/api/testimonials', {
        quote: form.quote,
        rating: Number(form.rating),
      })
      push('Testimonial submitted! It will appear on the site once reviewed.')
      setOpen(false)
      setForm({ quote: '', rating: 5 })
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not submit', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading
        eyebrow="Testimonials"
        title="Share your experience."
        description="Let others know how Heritage Club is helping you connect with your roots."
        action={
          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">
            <Plus className="h-4 w-4" /> Share Testimony
          </button>
        }
      />

      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load testimonials" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<MessageSquareQuote size={20} />} title="No testimonies shared yet" description="Share your first experience with the community." />
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
                  <Badge tone={t.published ? 'success' : 'neutral'}>{t.published ? 'Published' : 'Under Review'}</Badge>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">“{t.quote}”</p>
                {t.rating && <p className="mt-2 text-xs text-muted-foreground">{'★'.repeat(t.rating)}</p>}
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={open} onClose={() => setOpen(false)} title="Share Testimony" footer={
        <>
          <button onClick={() => setOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={create} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Submitting…' : 'Submit'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Your Experience / Quote">
            <Textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="Tell us how Heritage Club has impacted you..." />
          </Field>
          <Field label="Rating (1–5)">
            <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>
    </>
  )
}
