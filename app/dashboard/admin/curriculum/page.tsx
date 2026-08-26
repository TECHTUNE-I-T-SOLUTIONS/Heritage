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

  const [editingItem, setEditingItem] = useState<{ id: string; kind: Kind; title: string; slug?: string; description?: string; week?: number; xpReward?: number; status?: string; summary?: string } | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ id: string; kind: Kind; title: string } | null>(null)

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

  async function editItem() {
    if (!editingItem) return
    setBusy(true)
    try {
      const { apiPatch } = await import('@/lib/client')
      const payload: Record<string, unknown> = { kind: editingItem.kind, id: editingItem.id, title: editingItem.title, status: editingItem.status }
      if (editingItem.kind === 'pillar') Object.assign(payload, { slug: editingItem.slug, description: editingItem.description })
      if (editingItem.kind === 'module') Object.assign(payload, { description: editingItem.description })
      if (editingItem.kind === 'lesson') Object.assign(payload, { summary: editingItem.summary, week: Number(editingItem.week || 1), xpReward: Number(editingItem.xpReward || 50) })
      await apiPatch('/api/admin/curriculum', payload)
      push('Item updated.')
      setEditingItem(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    } finally { setBusy(false) }
  }

  async function deleteItem() {
    if (!deletingItem) return
    setBusy(true)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/curriculum?kind=${deletingItem.kind}&id=${deletingItem.id}`)
      push('Item deleted.')
      setDeletingItem(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete', 'error')
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
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-xl">{p.title}</h3>
                  <button onClick={() => setEditingItem({ id: p.id, kind: 'pillar', title: p.title, slug: p.slug, description: '', status: p.status })} className="text-xs text-accent hover:underline">Edit</button>
                  <button onClick={() => setDeletingItem({ id: p.id, kind: 'pillar', title: p.title })} className="text-xs text-destructive hover:underline">Delete</button>
                </div>
                <Badge tone={p.status === 'published' ? 'success' : 'neutral'}>{p.status}</Badge>
              </div>
              <div className="mt-4 space-y-4">
                {p.modules.length === 0 && <p className="text-sm text-muted-foreground">No modules yet.</p>}
                {p.modules.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{m.title}</p>
                        <button onClick={() => setEditingItem({ id: m.id, kind: 'module', title: m.title, description: '', status: m.status })} className="text-xs text-accent hover:underline">Edit</button>
                        <button onClick={() => setDeletingItem({ id: m.id, kind: 'module', title: m.title })} className="text-xs text-destructive hover:underline">Delete</button>
                      </div>
                      <Badge tone={m.status === 'published' ? 'success' : 'neutral'}>{m.status}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      {m.lessons.length === 0 && <p className="text-xs text-muted-foreground">No lessons yet.</p>}
                      {m.lessons.map((l) => (
                        <div key={l.id} className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
                          <div className="flex items-center gap-3">
                            <span>Wk {l.week} · {l.title}</span>
                            <button onClick={() => setEditingItem({ id: l.id, kind: 'lesson', title: l.title, week: l.week, xpReward: l.xpReward, summary: '', status: l.status })} className="text-[11px] text-accent hover:underline">Edit</button>
                            <button onClick={() => setDeletingItem({ id: l.id, kind: 'lesson', title: l.title })} className="text-[11px] text-destructive hover:underline">Delete</button>
                          </div>
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

      <Modal open={!!editingItem} onClose={() => setEditingItem(null)} title={editingItem ? `Edit ${editingItem.kind}` : ''} footer={
        <>
          <button onClick={() => setEditingItem(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={editItem} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </>
      }>
        {editingItem && (
          <div className="space-y-4">
            <Field label="Title"><Input value={editingItem.title} onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })} /></Field>
            {editingItem.kind === 'pillar' && <Field label="Slug"><Input value={editingItem.slug ?? ''} onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })} /></Field>}
            {editingItem.kind === 'lesson' ? (
              <>
                <Field label="Summary"><Textarea value={editingItem.summary ?? ''} onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Week"><Input type="number" value={editingItem.week ?? 1} onChange={(e) => setEditingItem({ ...editingItem, week: Number(e.target.value) })} /></Field>
                  <Field label="XP reward"><Input type="number" value={editingItem.xpReward ?? 50} onChange={(e) => setEditingItem({ ...editingItem, xpReward: Number(e.target.value) })} /></Field>
                </div>
              </>
            ) : (
              <Field label="Description"><Textarea value={editingItem.description ?? ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} /></Field>
            )}
            <Field label="Status">
              <Select value={editingItem.status ?? 'published'} onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value })}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </Select>
            </Field>
          </div>
        )}
      </Modal>

      <Modal open={!!deletingItem} onClose={() => setDeletingItem(null)} title={`Delete ${deletingItem?.kind}`} footer={
        <>
          <button onClick={() => setDeletingItem(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={deleteItem} disabled={busy} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the {deletingItem?.kind} <strong>{deletingItem?.title}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}

