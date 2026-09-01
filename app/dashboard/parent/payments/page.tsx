'use client'

import { useState } from 'react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal } from '@/components/ui/interactive'
import { formatCurrency, formatDate } from '@/lib/format'
import { Wallet, Users } from 'lucide-react'

interface PaymentRow extends Record<string, unknown> {
  id: string
  amount: number
  currency: string
  status: string
  invoiceNumber: string | null
  paidAt: string | null
  createdAt: string
  childName: string | null
  childId: string | null
  paymentType: 'subscription' | 'individual_child'
  accountType: 'parent' | 'child'
}

const tone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  succeeded: 'success', pending: 'warning', failed: 'error', refunded: 'neutral',
}

export default function ParentPayments() {
  const { data, loading, error } = useApi<{ parentPayments: PaymentRow[]; childPayments: PaymentRow[] }>('/api/parent/payments')
  const [selectedPayment, setSelectedPayment] = useState<PaymentRow | null>(null)

  const columns: Column<PaymentRow>[] = [
    { key: 'invoiceNumber', header: 'Invoice', render: (r) => r.invoiceNumber ?? '—' },
    { key: 'childName', header: 'Child', render: (r) => r.childName ?? '—' },
    { key: 'paymentType', header: 'Type', render: (r) => r.paymentType === 'subscription' ? 'Subscription' : 'Individual Child' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount, r.currency) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={tone[r.status] ?? 'neutral'}>{r.status}</Badge> },
    { key: 'paidAt', header: 'Date', render: (r) => formatDate(r.paidAt ?? r.createdAt) },
  ]

  return (
    <>
      <PageHeading eyebrow="Payments" title="Your billing history." description="Every invoice and payment on your account." />
      {loading && <Skeleton className="h-48" />}
      {error && <EmptyState title="Couldn't load payments" description={error} />}
      
      {data && (
        <div className="space-y-6">
          {/* Parent Payments */}
          <div>
            <h3 className="font-serif text-xl mb-4">Family Subscription Payments</h3>
            <p className="text-sm text-muted-foreground mb-4">Payments for your main family subscription.</p>
            {data.parentPayments.length > 0 ? (
              <DataTable 
                columns={columns} 
                rows={data.parentPayments} 
                onRowClick={(row) => setSelectedPayment(row)}
                empty={<EmptyState icon={<Wallet size={20} />} title="No family payments yet" description="Your family subscription payments will appear here." />} 
              />
            ) : (
              <EmptyState icon={<Wallet size={20} />} title="No family payments yet" description="Your family subscription payments will appear here." />
            )}
          </div>

          {/* Child Payments */}
          <div>
            <h3 className="font-serif text-xl mb-4">Child Payments</h3>
            <p className="text-sm text-muted-foreground mb-4">Individual payments for children who enrolled independently and payments for additional children added to your account.</p>
            {data.childPayments.length > 0 ? (
              <DataTable 
                columns={columns} 
                rows={data.childPayments} 
                onRowClick={(row) => setSelectedPayment(row)}
                empty={<EmptyState icon={<Users size={20} />} title="No child payments yet" description="Individual child payments will appear here." />} 
              />
            ) : (
              <EmptyState icon={<Users size={20} />} title="No child payments yet" description="Individual child payments will appear here." />
            )}
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <Modal 
          open={!!selectedPayment} 
          onClose={() => setSelectedPayment(null)}
          title="Payment Details"
          footer={
            <button onClick={() => setSelectedPayment(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
          }
        >
          <div className="space-y-4">
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm"><strong>Account Type:</strong> {selectedPayment.accountType === 'parent' ? 'Family Subscription' : 'Child Account'}</p>
              {selectedPayment.childName && (
                <p className="text-sm"><strong>Child:</strong> {selectedPayment.childName}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium text-lg">{formatCurrency(selectedPayment.amount, selectedPayment.currency)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge tone={tone[selectedPayment.status] ?? 'neutral'}>{selectedPayment.status}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Type</p>
              <p className="font-medium">{selectedPayment.paymentType === 'subscription' ? 'Subscription Payment' : 'Individual Child Payment'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="font-medium">{selectedPayment.invoiceNumber || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(selectedPayment.paidAt ?? selectedPayment.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment ID</p>
                <p className="font-medium text-xs">{selectedPayment.id}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
