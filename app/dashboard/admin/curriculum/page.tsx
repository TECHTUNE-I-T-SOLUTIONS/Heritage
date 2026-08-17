'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea, Select } from '@/components/ui/form'

interface Lesson { id: string; title: string; week: number; xpReward: number; status: string }
interface Module { id: string; title: string; status: string; lessons: Lesson[] }
interface Pillar { id: string; title: string; slug: string; status: string; modules: Module[] }

type Kind = 'pillar' | 'module' | 'lesson'

export default function AdminCurriculum() {
  const { data, loading, error, refetch } = useApi<Pillar[]>('/api/curriculum')
  const { push } = useToast()

  const [kind, setKind] = useState<Kind | null>(null)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  function openModal(k: Kind) { setKind(k); setForm({}) }

  async function submit() {
    if (!kind) return
    setBusy(true)
    try {
      const payload: Record<string, unknown> = { kind }
      if (kind === 'pillar') Object.assign(payload, { title: form.title, slug: form.slug, description: form.description })
      if (kind === 'module') Object.assign(payload, { pillar: form.pillar, title: form.title, description: form.description })
      if (kind === 'lesson') Object.assign(payload, { pillar: form.pillar, module: form.module, title: form.title, summary: form.summary, week: Number(form.week || 1), xpReward: Number(form.xpReward || 50) })
      await apiPost('/api/admin/curriculum', payload)
      push(`${kind[0].toUpperCase()}${kind.slice(1)} created.`)
      setKind(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not create', 'error')
    } finally { setBusy(false) }
  }

  const allModules = data?.flatMap((p) => p.modules.map((m) => ({ ...m, pillarId: p.id }))) ?? []

  return (
    <>
      <PageHeading eyebrow="Curriculum" title="Pillars, modules & lessons." description="Build the Heritage Club learning journey." action={
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openModal('pillar')} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> Pillar</button>
          <button onClick={() => openModal('module')} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary"><Plus className="h-4 w-4" /> Module</button>
          <button onClick={() => openModal('lesson')} className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm hover:bg-secondary"><Plus className="h-4 w-4" /> Lesson</button>
        </div>
      } />

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load curriculum" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<BookOpen size={20} />} title="No curriculum yet" description="Start by creating a pillar." />
      ) : (
        <div className="space-y-6">
          {data.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-xl">{p.title}</h3>
                <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</Badge>
              </div>
              <div className="mt-4 space-y-4">
                {p.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules yet.</p>}
                {p.modules.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-border p-4">
                    <p className="font-medium">{m.title}</p>
                    <div className="mt-3 space-y-2">
                      {m.lessons.length === 0 && <p className="text-xs text-muted-foreground">No lessons yet.</p>}
                      {m.lessons.map((l) => (
                        <div key={l.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
                          <span>Wk {l.week} · {l.title}</span>
                          <span className="text-xs text-muted-foreground">+{l.xpReward} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={!!kind} onClose={() => setKind(null)} title={kind ? `New ${kind}` : ''} footer={
        <>
          <button onClick={() => setKind(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Creating…' : 'Create'}</button>
        </>
      }>
        <div className="space-y-4">
          {kind === 'module' && (
            <Field label="Pillar"><Select value={form.pillar ?? ''} onChange={(e) => set('pillar', e.target.value)}><option value="">Select pillar</option>{data?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
          )}
          {kind === 'lesson' && (
            <>
              <Field label="Pillar"><Select value={form.pillar ?? ''} onChange={(e) => set('pillar', e.target.value)}><option value="">Select pillar</option>{data?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</Select></Field>
              <Field label="Module"><Select value={form.module ?? ''} onChange={(e) => set('module', e.target.value)}><option value="">Select module</option>{allModules.filter((m) => !form.pillar || m.pillarId === form.pillar).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}</Select></Field>
            </>
          )}
          <Field label="Title"><Input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} /></Field>
          {kind === 'pillar' && <Field label="Slug"><Input value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="storytelling" /></Field>}
          {kind === 'lesson' ? (
            <>
              <Field label="Summary"><Textarea value={form.summary ?? ''} onChange={(e) => set('summary', e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Week"><Input type="number" value={form.week ?? '1'} onChange={(e) => set('week', e.target.value)} /></Field>
                <Field label="XP reward"><Input type="number" value={form.xpReward ?? '50'} onChange={(e) => set('xpReward', e.target.value)} /></Field>
              </div>
            </>
          ) : (
            <Field label="Description"><Textarea value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></Field>
          )}
        </div>
      </Modal>
    </>
  )
}
