import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Payment } from '@/models/Billing'

export async function GET() {
  const { session, response } = await requireAuth(['parent', 'student'])
  if (response) return response
  await connectToDatabase()
  const payments = await Payment.find({ account: session.userId }).sort({ createdAt: -1 }).lean()
  return ok(
    payments.map((p) => ({
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
    })),
  )
}
