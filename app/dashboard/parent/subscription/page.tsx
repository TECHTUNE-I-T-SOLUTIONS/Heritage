'use client'

import { useState } from 'react'
import { useApi, apiPatch, apiPost } from '@/lib/client'
import { PageHeading, Card, Badge, EmptyState, Skeleton } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { formatCurrency, formatDate, PLAN_LIST } from '@/lib/format'

interface Sub {
  id: string
  planKey: string
  price: number
  currency: string
  status: string
  childrenCount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  accountType: 'parent' | 'child'
  childName?: string
  childPreferredName?: string
  childEmail?: string
}

interface SubscriptionData {
  parentSubscription: Sub | null
  childSubscriptions: Sub[]
}

interface Payment {
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

const statusTone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success', past_due: 'warning', incomplete: 'warning', cancelled: 'error',
}

const tone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  succeeded: 'success', pending: 'warning', failed: 'error', refunded: 'neutral',
}

export default function ParentSubscription() {
  const { data, loading, error, setData } = useApi<SubscriptionData>('/api/parent/subscription')
  const { data: payments, loading: paymentsLoading } = useApi<{ parentPayments: Payment[]; childPayments: Payment[] }>('/api/parent/payments')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)
  const [selectedSub, setSelectedSub] = useState<Sub | null>(null)

  const parentSub = data?.parentSubscription
  const childSubs = data?.childSubscriptions || []
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  async function toggleCancel(next: boolean) {
    const currentParentSub = data?.parentSubscription
    if (!currentParentSub) return
    setBusy(true)
    try {
      await apiPatch('/api/parent/subscription', { cancelAtPeriodEnd: next })
      setData(data ? { 
        ...data, 
        parentSubscription: { ...currentParentSub, cancelAtPeriodEnd: next } 
      } : data)
      push(next ? 'Subscription will cancel at period end.' : 'Subscription renewal resumed.')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Something went wrong', 'error')
    } finally {
      setBusy(false)
    }
  }

  const plan = parentSub ? PLAN_LIST.find((p) => p.key === parentSub.planKey) : null

  async function payNow() {
    if (!parentSub) return
    setBusy(true)
    try {
      const res = await apiPost<{ authorizationUrl: string }>('/api/payments/paystack/initialize', { subscriptionId: parentSub.id })
      window.location.href = res.authorizationUrl
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not start payment', 'error')
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="Subscription" title="Your membership." description="Manage the plan that powers your family's learning." />

      {loading && <Skeleton className="h-56" />}
      {error && <EmptyState title="Couldn't load subscription" description={error} />}

      {!loading && !error && (parentSub || childSubs.length > 0 ? (
        <div className="space-y-6">
          {/* Parent Subscription */}
          {parentSub && (
            <div className="grid gap-4 lg:grid-cols-2">
              {parentSub.status === 'incomplete' && (
                <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
                  <div>
                    <p className="font-medium">Your membership isn't active yet.</p>
                    <p className="mt-1 text-sm text-muted-foreground">Complete your first payment to unlock classes. An educator assigns cohorts once payment is confirmed.</p>
                  </div>
                  <button disabled={busy} onClick={payNow} className="h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                    {busy ? 'Starting…' : `Pay ${formatCurrency(parentSub.price)} now`}
                  </button>
                </div>
              )}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-2xl">{plan?.label ?? parentSub.planKey}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Family Subscription</p>
                  </div>
                  <Badge tone={statusTone[parentSub.status] ?? 'neutral'}>{parentSub.status.replace('_', ' ')}</Badge>
                </div>
                <p className="mt-4 font-serif text-4xl">{formatCurrency(parentSub.price)}<span className="text-base text-muted-foreground"> / month</span></p>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Children included</dt><dd className="font-medium">{parentSub.childrenCount}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Renews</dt><dd className="font-medium">{formatDate(parentSub.currentPeriodEnd)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Auto-renew</dt><dd className="font-medium">{parentSub.cancelAtPeriodEnd ? 'Cancelling' : 'On'}</dd></div>
                </dl>
              </Card>
              <Card>
                <h3 className="font-serif text-xl">Manage plan</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {parentSub.cancelAtPeriodEnd
                    ? 'Your subscription is set to cancel at the end of the current period. You can resume it any time.'
                    : 'You can turn off auto-renewal. Your access continues until the end of the current period.'}
                </p>
                <button
                  disabled={busy}
                  onClick={() => toggleCancel(!parentSub.cancelAtPeriodEnd)}
                  className={`mt-6 h-11 w-full rounded-full text-sm font-medium transition disabled:opacity-60 ${parentSub.cancelAtPeriodEnd ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
                >
                  {parentSub.cancelAtPeriodEnd ? 'Resume auto-renewal' : 'Cancel at period end'}
                </button>
                <p className="mt-4 text-xs text-muted-foreground">Billing is handled by our payment provider. Changes here update your renewal preference.</p>
              </Card>
            </div>
          )}

          {/* Child Subscriptions */}
          {childSubs.length > 0 && (
            <div>
              <h3 className="font-serif text-2xl mb-4">Child Subscriptions</h3>
              <p className="text-sm text-muted-foreground mb-4">Individual subscriptions for children who enrolled independently before being linked to your account.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {childSubs.map((childSub) => {
                  const childPlan = PLAN_LIST.find((p) => p.key === childSub.planKey)
                  return (
                    <div 
                      key={childSub.id} 
                      className="cursor-pointer hover:border-accent/50 transition rounded-2xl border border-border bg-card p-5"
                      onClick={() => setSelectedSub(childSub)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-serif text-lg">{childSub.childPreferredName || childSub.childName}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{childSub.childEmail}</p>
                        </div>
                        <Badge tone={statusTone[childSub.status] ?? 'neutral'}>{childSub.status.replace('_', ' ')}</Badge>
                      </div>
                      <div className="mt-4">
                        <p className="font-serif text-2xl">{formatCurrency(childSub.price)}<span className="text-sm text-muted-foreground"> / month</span></p>
                        <p className="text-xs text-muted-foreground mt-1">{childPlan?.label || childSub.planKey}</p>
                      </div>
                      <dl className="mt-4 space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Renews</dt><dd className="font-medium">{formatDate(childSub.currentPeriodEnd)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Auto-renew</dt><dd className="font-medium">{childSub.cancelAtPeriodEnd ? 'Cancelling' : 'On'}</dd></div>
                      </dl>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Individual Child Payments from Parent Account */}
          {payments && payments.parentPayments && payments.parentPayments.filter(p => p.paymentType === 'individual_child').length > 0 && (
            <Card className="lg:col-span-2">
              <h3 className="font-serif text-xl">Additional Child Payments</h3>
              <p className="mt-2 text-sm text-muted-foreground">Payments for additional children added to your family account.</p>
              <div className="mt-4 space-y-3">
                {payments.parentPayments.filter(p => p.paymentType === 'individual_child').map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between rounded-lg border border-border p-4 cursor-pointer hover:bg-secondary/50 transition"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <div>
                      <p className="font-medium">{payment.childName || 'Additional child'}</p>
                      <p className="text-sm text-muted-foreground">{payment.invoiceNumber || `Invoice #${payment.id.slice(0, 8)}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                      <Badge tone={tone[payment.status] ?? 'neutral'} className="text-xs">{payment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ) : (
        <EmptyState title="No active subscription" description="Your subscription details will appear here once billing is set up." />
      ))}

      {/* Subscription Details Modal */}
      {selectedSub && (
        <Modal 
          open={!!selectedSub} 
          onClose={() => setSelectedSub(null)}
          title={selectedSub.accountType === 'parent' ? 'Family Subscription Details' : `${selectedSub.childPreferredName || selectedSub.childName}'s Subscription`}
          footer={
            <button onClick={() => setSelectedSub(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
          }
        >
          <div className="space-y-4">
            {selectedSub.accountType === 'child' && (
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-sm"><strong>Child:</strong> {selectedSub.childPreferredName || selectedSub.childName}</p>
                <p className="text-sm text-muted-foreground">{selectedSub.childEmail}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium text-lg">{PLAN_LIST.find(p => p.key === selectedSub.planKey)?.label || selectedSub.planKey}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{formatCurrency(selectedSub.price, selectedSub.currency)}<span className="text-sm text-muted-foreground"> / month</span></p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge tone={statusTone[selectedSub.status] ?? 'neutral'}>{selectedSub.status.replace('_', ' ')}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Children Included</p>
                <p className="font-medium">{selectedSub.childrenCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Period Ends</p>
                <p className="font-medium">{formatDate(selectedSub.currentPeriodEnd)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Auto-renewal</p>
              <p className="font-medium">{selectedSub.cancelAtPeriodEnd ? 'Cancelling at period end' : 'Enabled'}</p>
            </div>
            {selectedSub.accountType === 'parent' && (
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-xs text-muted-foreground mb-2">This is your main family subscription. Use the manage section to make changes.</p>
              </div>
            )}
          </div>
        </Modal>
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
              <p className="text-sm"><strong>Payment Type:</strong> {selectedPayment.paymentType === 'individual_child' ? 'Additional Child Payment' : 'Subscription Payment'}</p>
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
