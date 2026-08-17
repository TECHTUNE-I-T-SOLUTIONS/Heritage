import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Subscription, Payment } from '@/models'
import { verifyTransaction, paystackConfigured } from '@/lib/paystack'
import { notifyPaymentSuccess, notifyPaymentFailed } from '@/lib/notifications'

const schema = z.object({ reference: z.string().min(1) })

export async function POST(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('A payment reference is required.', 422)
  if (!paystackConfigured()) return fail('Payments are not yet configured.', 503)

  await connectToDatabase()

  const payment = await Payment.findOne({ providerPaymentId: parsed.data.reference, account: session.userId })
  if (!payment) return fail('Payment not found.', 404)

  // Already reconciled — return current state (idempotent).
  if (payment.status === 'succeeded') return ok({ status: 'succeeded' })

  const result = await verifyTransaction(parsed.data.reference)
  const succeeded = result.data.status === 'success'

  if (!succeeded) {
    await Payment.updateOne({ _id: payment._id }, { status: 'failed' })
    await notifyPaymentFailed(session.userId)
    return ok({ status: 'failed' })
  }

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  await Payment.updateOne({ _id: payment._id }, {
    status: 'succeeded',
    paidAt: now,
    invoiceNumber: `HC-${payment.providerPaymentId}`,
  })

  if (payment.subscription) {
    await Subscription.updateOne({ _id: payment.subscription }, {
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      provider: 'paystack',
    })
  }

  await notifyPaymentSuccess(session.userId, `${payment.currency} ${payment.amount}`)

  return ok({ status: 'succeeded' })
}
