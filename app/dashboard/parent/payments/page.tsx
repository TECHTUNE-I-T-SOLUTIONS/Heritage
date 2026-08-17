'use client'

import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'
import { Wallet } from 'lucide-react'

interface PaymentRow extends Record<string, unknown> {
  id: string
  amount: number
  currency: string
  status: string
  invoiceNumber: string | null
  paidAt: string | null
  createdAt: string
}

const tone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  succeeded: 'success', pending: 'warning', failed: 'error', refunded: 'neutral',
}

export default function ParentPayments() {
  const { data, loading, error } = useApi<PaymentRow[]>('/api/parent/payments')

  const columns: Column<PaymentRow>[] = [
    { key: 'invoiceNumber', header: 'Invoice', render: (r) => r.invoiceNumber ?? '—' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount, r.currency) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={tone[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { key: 'paidAt', header: 'Date', render: (r) => formatDate(r.paidAt ?? r.createdAt) },
  ]

  return (
    <>
      <PageHeading eyebrow="Payments" title="Your billing history." description="Every invoice and payment on your account." />
      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load payments" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Wallet size={20} />} title="No payments yet" description="Payments will appear here once billing begins." />} />}
    </>
  )
}
