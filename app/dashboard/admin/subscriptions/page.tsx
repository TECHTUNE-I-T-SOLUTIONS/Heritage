'use client'

import { useState } from 'react'
import { CreditCard, Eye, Settings2, Trash2 } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'
import { Field, Input, Select } from '@/components/ui/form'

interface Row extends Record<string, unknown> {
  id: string
  account: string
  email: string
  planKey: string
  price: number
  currency: string
  status: string
  childrenCount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  providerSubscriptionId?: string | null
  currentPeriodStart?: string | null
}

export default function AdminSubscriptions() {
  const { data, loading, error, refetch } = useApi<Row[]>('/api/admin/subscriptions')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)

  // Modals state
  const [detailsItem, setDetailsItem] = useState<Row | null>(null)

  const [editing, setEditing] = useState<Row | null>(null)
  const [editForm, setEditForm] = useState({ id: '', planKey: 'individual', price: 0, status: 'active', childrenCount: 1, cancelAtPeriodEnd: false, currentPeriodEnd: '' })

  const [deleting, setDeleting] = useState<Row | null>(null)

  async function handleEdit() {
    setBusy(true)
    try {
      await apiPatch('/api/admin/subscriptions', {
        ...editForm,
        price: Number(editForm.price),
        childrenCount: Number(editForm.childrenCount),
        currentPeriodEnd: editForm.currentPeriodEnd || undefined,
      })
      push('Subscription updated successfully.')
      setEditing(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update subscription', 'error')
    } finally { setBusy(false) }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/subscriptions?id=${deleting.id}`)
      push('Subscription deleted.')
      setDeleting(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete subscription', 'error')
    } finally { setBusy(false) }
  }

  const columns: Column<Row>[] = [
    { key: 'account', header: 'Account', render: (r) => <div><p className="font-medium">{r.account}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'planKey', header: 'Plan', render: (r) => <span className="capitalize">{r.planKey}</span> },
    { key: 'price', header: 'Price', render: (r) => `${formatCurrency(r.price)}/mo` },
    { key: 'childrenCount', header: 'Children' },
    { key: 'currentPeriodEnd', header: 'Renews', render: (r) => (r.currentPeriodEnd ? formatDate(r.currentPeriodEnd) : '—') },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : r.status === 'cancelled' ? 'error' : 'warning'}>{r.cancelAtPeriodEnd ? 'cancels at period end' : r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => setDetailsItem(r)} className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground" title="View Details"><Eye size={14} /></button>
          <button
            onClick={() => {
              setEditing(r)
              setEditForm({
                id: r.id,
                planKey: r.planKey,
                price: r.price,
                status: r.status,
                childrenCount: r.childrenCount,
                cancelAtPeriodEnd: r.cancelAtPeriodEnd,
                currentPeriodEnd: r.currentPeriodEnd ? r.currentPeriodEnd.split('T')[0] : '',
              })
            }}
            className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Edit Settings"
          >
            <Settings2 size={14} />
          </button>
          <button onClick={() => setDeleting(r)} className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 p-1.5 text-xs" title="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading eyebrow="Subscriptions" title="Billing plans." description="Every active and past subscription." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load subscriptions" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<CreditCard size={20} />} title="No subscriptions yet" description="Plans appear here once families subscribe." />} />}

      {/* Details Modal */}
      <Modal open={!!detailsItem} onClose={() => setDetailsItem(null)} title="Subscription Details" footer={
        <button onClick={() => setDetailsItem(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
      }>
        {detailsItem && (
          <div className="space-y-3 text-sm">
            <p><strong>Subscriber:</strong> {detailsItem.account} ({detailsItem.email})</p>
            <p><strong>Plan Key:</strong> <span className="capitalize">{detailsItem.planKey}</span></p>
            <p><strong>Price:</strong> {formatCurrency(detailsItem.price)} {detailsItem.currency}/mo</p>
            <p><strong>Children Enrolled:</strong> {detailsItem.childrenCount}</p>
            <p><strong>Provider ID:</strong> {detailsItem.providerSubscriptionId || 'N/A'}</p>
            <p><strong>Status:</strong> <span className="capitalize font-semibold">{detailsItem.status}</span></p>
            <p><strong>Current Period Start:</strong> {detailsItem.currentPeriodStart ? formatDate(detailsItem.currentPeriodStart) : 'N/A'}</p>
            <p><strong>Current Period End:</strong> {detailsItem.currentPeriodEnd ? formatDate(detailsItem.currentPeriodEnd) : 'N/A'}</p>
            <p><strong>Cancel at Period End:</strong> {detailsItem.cancelAtPeriodEnd ? 'Yes' : 'No'}</p>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Subscription" footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleEdit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Plan">
            <Select value={editForm.planKey} onChange={(e) => setEditForm({ ...editForm, planKey: e.target.value })}>
              <option value="individual">Individual</option>
              <option value="family2">Family (2 children)</option>
              <option value="family3">Family (3 children)</option>
              <option value="family4">Family (4 children)</option>
            </Select>
          </Field>
          <Field label="Price"><Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} /></Field>
          <Field label="Children Count"><Input type="number" value={editForm.childrenCount} onChange={(e) => setEditForm({ ...editForm, childrenCount: Number(e.target.value) })} /></Field>
          <Field label="Renew/End Date"><Input type="date" value={editForm.currentPeriodEnd} onChange={(e) => setEditForm({ ...editForm, currentPeriodEnd: e.target.value })} /></Field>
          <Field label="Status">
            <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="incomplete">Incomplete</option>
            </Select>
          </Field>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="cancelAtPeriodEnd" checked={editForm.cancelAtPeriodEnd} onChange={(e) => setEditForm({ ...editForm, cancelAtPeriodEnd: e.target.checked })} />
            <label htmlFor="cancelAtPeriodEnd" className="text-sm">Cancel at period end</label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Subscription" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={busy} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">{busy ? 'Deleting…' : 'Delete'}</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the subscription for <strong>{deleting?.account}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}
