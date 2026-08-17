import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Subscription, Payment } from '@/models'
import { initializeTransaction, paystackConfigured, paystackCurrency } from '@/lib/paystack'
import { convertAmount, roundForCurrency } from '@/lib/fx'
import { notifyPaymentFailed } from '@/lib/notifications'

const schema = z.object({ subscriptionId: z.string().min(1) })

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('A subscription is required to start checkout.', 422)

  if (!paystackConfigured()) return fail('Payments are not yet configured. Please try again later.', 503)

  await connectToDatabase()

  const subscription = await Subscription.findOne({ _id: parsed.data.subscriptionId, account: session.userId })
  if (!subscription) return fail('Subscription not found.', 404)

  const reference = `HC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

  const payment = await Payment.create({
    account: session.userId,
    subscription: subscription._id,
    amount: subscription.price,
    currency: subscription.currency,
    status: 'pending',
    provider: 'paystack',
    providerPaymentId: reference,
  })

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin

  // Plans are priced in CAD; Paystack settles in PAYSTACK_CURRENCY (e.g. NGN).
  // Convert the CAD price into the charge currency so the customer is billed
  // the correct local-equivalent amount rather than the raw CAD number.
  const chargeCurrency = paystackCurrency()
  const converted = await convertAmount(subscription.price, subscription.currency, chargeCurrency)
  const chargeAmount = roundForCurrency(converted, chargeCurrency)

  try {
    const init = await initializeTransaction({
      email: session.email,
      amount: chargeAmount,
      currency: chargeCurrency,
      reference,
      callbackUrl: `${origin}/payment/callback`,
      metadata: {
        subscriptionId: String(subscription._id),
        paymentId: String(payment._id),
        account: session.userId,
        planPrice: subscription.price,
        planCurrency: subscription.currency,
        chargeAmount,
        chargeCurrency,
      },
    })
    return ok({ authorizationUrl: init.data.authorization_url, reference })
  } catch (err) {
    await Payment.updateOne({ _id: payment._id }, { status: 'failed' })
    await notifyPaymentFailed(session.userId)
    return fail(err instanceof Error ? err.message : 'Could not start payment.', 502)
  }
}
