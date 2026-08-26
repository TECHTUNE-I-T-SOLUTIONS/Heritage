import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Payment } from '@/models/Billing'
import { verifyTransaction, paystackConfigured } from '@/lib/paystack'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  await connectToDatabase()
  const payments = await Payment.find().sort({ createdAt: -1 }).populate('account', 'fullName email').lean()
  return ok(
    payments.map((p) => ({
      id: String(p._id),
      account: (p.account as unknown as { fullName?: string })?.fullName ?? 'Account',
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      providerPaymentId: p.providerPaymentId ?? null,
    })),
  )
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['succeeded', 'pending', 'failed', 'refunded']).optional(),
  reverify: z.boolean().optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, status, reverify } = parsed.data

  const payment = await Payment.findById(id)
  if (!payment) return fail('Payment not found', 404)

  if (reverify) {
    if (paystackConfigured() && payment.providerPaymentId) {
      try {
        const result = await verifyTransaction(payment.providerPaymentId)
        if (result.data.status === 'success') {
          payment.status = 'succeeded'
          payment.paidAt = new Date()
        } else {
          payment.status = 'failed'
        }
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'Paystack verification failed', 400)
      }
    } else {
      payment.status = 'succeeded'
      payment.paidAt = new Date()
    }
  } else if (status) {
    payment.status = status
    if (status === 'succeeded') payment.paidAt = new Date()
  }

  await payment.save()
  return ok({ id, status: payment.status })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Payment ID required', 400)

  await connectToDatabase()
  const payment = await Payment.findByIdAndDelete(id).lean()
  if (!payment) return fail('Payment not found', 404)
  return ok({ id })
}

