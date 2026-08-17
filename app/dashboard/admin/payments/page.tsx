'use client'

import { Wallet } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'

interface Row extends Record<string, unknown> {
  id: string
  account: string
  amount: number
  currency: string
  status: string
  invoiceNumber: string | null
  paidAt: string | null
  createdAt: string
}

export default function AdminPayments() {
  const { data, loading, error } = useApi<Row[]>('/api/admin/payments')

  const columns: Column<Row>[] = [
    { key: 'account', header: 'Account', render: (r) => r.account },
    { key: 'invoiceNumber', header: 'Invoice', render: (r) => r.invoiceNumber ?? '—' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'paidAt', header: 'Paid', render: (r) => (r.paidAt ? formatDate(r.paidAt) : formatDate(r.createdAt)) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'succeeded' ? 'success' : r.status === 'failed' ? 'error' : 'warning'}>{r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Payments" title="Transactions." description="A complete record of payment activity." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load payments" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Wallet size={20} />} title="No payments yet" description="Payment records appear here once processed." />} />}
    </>
  )
}
