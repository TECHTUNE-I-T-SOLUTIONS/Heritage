/**
 * Minimal Paystack REST client (server-only).
 *
 * Configure via environment (added by you later):
 *   PAYSTACK_SECRET_KEY   - sk_live_... / sk_test_...  (required)
 *   PAYSTACK_CURRENCY     - transaction currency, e.g. NGN, GHS, ZAR, USD, KES (default NGN)
 *   NEXT_PUBLIC_APP_URL   - used to build the checkout callback URL
 *
 * Paystack amounts are in the currency's smallest unit (e.g. kobo/cents),
 * so we multiply major-unit prices by 100.
 */

const BASE = 'https://api.paystack.co'

export function paystackConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY)
}

export function paystackCurrency() {
  return process.env.PAYSTACK_CURRENCY || 'NGN'
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('Payments are not yet configured. Please try again later.')
  return key
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status === false) {
    throw new Error(json.message || `Paystack request failed (${res.status})`)
  }
  return json as T
}

export interface InitializeResult {
  status: boolean
  data: { authorization_url: string; access_code: string; reference: string }
}

export async function initializeTransaction(params: {
  email: string
  /** amount in major currency units (e.g. naira), already in `currency` */
  amount: number
  reference: string
  callbackUrl: string
  /** transaction currency; defaults to PAYSTACK_CURRENCY */
  currency?: string
  metadata?: Record<string, unknown>
}) {
  return call<InitializeResult>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      amount: Math.round(params.amount * 100),
      currency: params.currency ?? paystackCurrency(),
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  })
}

export interface VerifyResult {
  status: boolean
  data: { status: string; reference: string; amount: number; currency: string }
}

export async function verifyTransaction(reference: string) {
  return call<VerifyResult>(`/transaction/verify/${encodeURIComponent(reference)}`)
}
