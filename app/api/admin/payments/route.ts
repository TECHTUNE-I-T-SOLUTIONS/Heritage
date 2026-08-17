import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Payment } from '@/models/Billing'

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
    })),
  )
}
