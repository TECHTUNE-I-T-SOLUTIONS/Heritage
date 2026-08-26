'use client'

import { useState } from 'react'
import { Wallet, Eye, Settings2, Trash2, CheckCircle2 } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'
import { Field, Select } from '@/components/ui/form'

interface Row extends Record<string, unknown> {
  id: string
  account: string
  amount: number
  currency: string
  status: string
  invoiceNumber: string | null
  paidAt: string | null
  createdAt: string
  providerPaymentId?: string | null
}

export default function AdminPayments() {
  const { data, loading, error, refetch } = useApi<Row[]>('/api/admin/payments')
  const { push } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  // Modals state
  const [detailsItem, setDetailsItem] = useState<Row | null>(null)

  const [editing, setEditing] = useState<Row | null>(null)
  const [editStatus, setEditStatus] = useState('pending')

  const [deleting, setDeleting] = useState<Row | null>(null)

  async function handleReverify(id: string) {
    setBusyId(id)
    try {
      await apiPatch('/api/admin/payments', { id, reverify: true })
      push('Re-verification complete.')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Re-verification failed', 'error')
    } finally { setBusyId(null) }
  }

  async function handleEditStatus() {
    if (!editing) return
    setBusyId(editing.id)
    try {
      await apiPatch('/api/admin/payments', { id: editing.id, status: editStatus })
      push('Payment status updated.')
      setEditing(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update status', 'error')
    } finally { setBusyId(null) }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/payments?id=${deleting.id}`)
      push('Payment record deleted.')
      setDeleting(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete payment', 'error')
    } finally { setBusyId(null) }
  }

  const columns: Column<Row>[] = [
    { key: 'account', header: 'Account', render: (r) => r.account },
    { key: 'invoiceNumber', header: 'Invoice', render: (r) => r.invoiceNumber ?? '—' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'paidAt', header: 'Paid', render: (r) => (r.paidAt ? formatDate(r.paidAt) : formatDate(r.createdAt)) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'succeeded' ? 'success' : r.status === 'failed' ? 'error' : 'warning'}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2 items-center">
          <button onClick={() => setDetailsItem(r)} className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground" title="View Details"><Eye size={14} /></button>
          <button
            onClick={() => {
              setEditing(r)
              setEditStatus(r.status)
            }}
            className="rounded-full border border-border p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground"
            title="Edit Status"
          >
            <Settings2 size={14} />
          </button>
          {r.status !== 'succeeded' && (
            <button
              onClick={() => handleReverify(r.id)}
              disabled={busyId === r.id}
              className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-secondary disabled:opacity-60 flex items-center gap-1"
              title="Verify Payment"
            >
              <CheckCircle2 size={12} /> Re-verify
            </button>
          )}
          <button onClick={() => setDeleting(r)} className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 p-1.5 text-xs" title="Delete"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading eyebrow="Payments" title="Transactions." description="A complete record of payment activity." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load payments" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Wallet size={20} />} title="No payments yet" description="Payment records appear here once processed." />} />}

      {/* Details Modal */}
      <Modal open={!!detailsItem} onClose={() => setDetailsItem(null)} title="Transaction Details" footer={
        <button onClick={() => setDetailsItem(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
      }>
        {detailsItem && (
          <div className="space-y-3 text-sm">
            <p><strong>Account:</strong> {detailsItem.account}</p>
            <p><strong>Invoice Number:</strong> {detailsItem.invoiceNumber || 'N/A'}</p>
            <p><strong>Transaction ID:</strong> {detailsItem.providerPaymentId || 'N/A'}</p>
            <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)} {detailsItem.currency}</p>
            <p><strong>Status:</strong> <span className="capitalize font-semibold">{detailsItem.status}</span></p>
            <p><strong>Created At:</strong> {formatDate(detailsItem.createdAt)}</p>
            <p><strong>Paid At:</strong> {detailsItem.paidAt ? formatDate(detailsItem.paidAt) : 'N/A'}</p>
          </div>
        )}
      </Modal>

      {/* Edit Status Modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Payment Status" footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleEditStatus} disabled={busyId === editing?.id} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">Save changes</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Status">
            <Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete Payment Record" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={busyId === deleting?.id} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">Delete</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the transaction record for invoice <strong>{deleting?.invoiceNumber || deleting?.id}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}
