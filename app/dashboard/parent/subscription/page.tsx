'use client'

import { useState } from 'react'
import { useApi, apiPatch, apiPost } from '@/lib/client'
import { PageHeading, Card, Badge, EmptyState, Skeleton } from '@/components/ui/kit'
import { useToast } from '@/components/ui/interactive'
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
}

const statusTone: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success', past_due: 'warning', incomplete: 'warning', cancelled: 'error',
}

export default function ParentSubscription() {
  const { data, loading, error, setData } = useApi<Sub | null>('/api/parent/subscription')
  const { push } = useToast()
  const [busy, setBusy] = useState(false)

  async function toggleCancel(next: boolean) {
    setBusy(true)
    try {
      await apiPatch('/api/parent/subscription', { cancelAtPeriodEnd: next })
      setData(data ? { ...data, cancelAtPeriodEnd: next } : data)
      push(next ? 'Subscription will cancel at period end.' : 'Subscription renewal resumed.')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Something went wrong', 'error')
    } finally {
      setBusy(false)
    }
  }

  const plan = data ? PLAN_LIST.find((p) => p.key === data.planKey) : null

  async function payNow() {
    if (!data) return
    setBusy(true)
    try {
      const res = await apiPost<{ authorizationUrl: string }>('/api/payments/paystack/initialize', { subscriptionId: data.id })
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

      {!loading && !error && (data ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.status === 'incomplete' && (
            <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
              <div>
                <p className="font-medium">Your membership isn't active yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">Complete your first payment to unlock classes. An educator assigns cohorts once payment is confirmed.</p>
              </div>
              <button disabled={busy} onClick={payNow} className="h-11 shrink-0 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                {busy ? 'Starting…' : `Pay ${formatCurrency(data.price)} now`}
              </button>
            </div>
          )}
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl">{plan?.label ?? data.planKey}</h3>
              <Badge tone={statusTone[data.status] ?? 'neutral'}>{data.status.replace('_', ' ')}</Badge>
            </div>
            <p className="mt-4 font-serif text-4xl">{formatCurrency(data.price)}<span className="text-base text-muted-foreground"> / month</span></p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Children included</dt><dd className="font-medium">{data.childrenCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Renews</dt><dd className="font-medium">{formatDate(data.currentPeriodEnd)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Auto-renew</dt><dd className="font-medium">{data.cancelAtPeriodEnd ? 'Cancelling' : 'On'}</dd></div>
            </dl>
          </Card>
          <Card>
            <h3 className="font-serif text-xl">Manage plan</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {data.cancelAtPeriodEnd
                ? 'Your subscription is set to cancel at the end of the current period. You can resume it any time.'
                : 'You can turn off auto-renewal. Your access continues until the end of the current period.'}
            </p>
            <button
              disabled={busy}
              onClick={() => toggleCancel(!data.cancelAtPeriodEnd)}
              className={`mt-6 h-11 w-full rounded-full text-sm font-medium transition disabled:opacity-60 ${data.cancelAtPeriodEnd ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'}`}
            >
              {data.cancelAtPeriodEnd ? 'Resume auto-renewal' : 'Cancel at period end'}
            </button>
            <p className="mt-4 text-xs text-muted-foreground">Billing is handled by our payment provider. Changes here update your renewal preference.</p>
          </Card>
        </div>
      ) : (
        <EmptyState title="No active subscription" description="Your subscription details will appear here once billing is set up." />
      ))}
    </>
  )
}
