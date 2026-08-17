'use client'

import { CreditCard } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'

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
}

export default function AdminSubscriptions() {
  const { data, loading, error } = useApi<Row[]>('/api/admin/subscriptions')

  const columns: Column<Row>[] = [
    { key: 'account', header: 'Account', render: (r) => <div><p className="font-medium">{r.account}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'planKey', header: 'Plan', render: (r) => <span className="capitalize">{r.planKey}</span> },
    { key: 'price', header: 'Price', render: (r) => `${formatCurrency(r.price)}/mo` },
    { key: 'childrenCount', header: 'Children' },
    { key: 'currentPeriodEnd', header: 'Renews', render: (r) => (r.currentPeriodEnd ? formatDate(r.currentPeriodEnd) : '—') },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : r.status === 'canceled' ? 'error' : 'warning'}>{r.cancelAtPeriodEnd ? 'cancels at period end' : r.status}</Badge> },
  ]

  return (
    <>
      <PageHeading eyebrow="Subscriptions" title="Billing plans." description="Every active and past subscription." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load subscriptions" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<CreditCard size={20} />} title="No subscriptions yet" description="Plans appear here once families subscribe." />} />}
    </>
  )
}
