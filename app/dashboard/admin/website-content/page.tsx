'use client'

import { useState } from 'react'
import { BookOpen, Plus } from 'lucide-react'
import { useApi, apiPut } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface Item { key: string; value: unknown; updatedAt: string }

function toText(v: unknown): string {
  if (v == null) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v, null, 2)
}
function parseValue(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed) } catch { return text }
  }
  return text
}

export default function AdminWebsiteContent() {
  const { data, loading, error, refetch } = useApi<Item[]>('/api/admin/site-content')
  const { push } = useToast()

  const [editing, setEditing] = useState<{ key: string; value: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [isNew, setIsNew] = useState(false)

  function open(item?: Item) {
    if (item) { setIsNew(false); setEditing({ key: item.key, value: toText(item.value) }) }
    else { setIsNew(true); setEditing({ key: '', value: '' }) }
  }

  async function save() {
    if (!editing || !editing.key.trim()) return push('A key is required.', 'error')
    setBusy(true)
    try {
      await apiPut('/api/admin/site-content', { key: editing.key.trim(), value: parseValue(editing.value) })
      push('Content saved.')
      setEditing(null); refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally { setBusy(false) }
  }

  return (
    <>
      <PageHeading eyebrow="Website content" title="Editable site copy." description="Manage the content blocks that power the public website." action={<button onClick={() => open()} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"><Plus className="h-4 w-4" /> New block</button>} />

      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load content" description={error} />}
      {data && (data.length === 0 ? (
        <EmptyState icon={<BookOpen size={20} />} title="No content blocks yet" description="Create a block to control site copy." />
      ) : (
        <div className="grid gap-3">
          {data.map((item) => (
            <Card key={item.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium">{item.key}</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{toText(item.value)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Updated {formatDate(item.updatedAt)}</p>
              </div>
              <button onClick={() => open(item)} className="shrink-0 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Edit</button>
            </Card>
          ))}
        </div>
      ))}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={isNew ? 'New content block' : 'Edit content'} footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={save} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        </>
      }>
        {editing && (
          <div className="space-y-4">
            <Field label="Key"><Input value={editing.key} disabled={!isNew} onChange={(e) => setEditing({ ...editing, key: e.target.value })} placeholder="home.hero.title" /></Field>
            <Field label="Value (text or JSON)"><Textarea rows={8} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}
