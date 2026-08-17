import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Subscription } from '@/models/Billing'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  await connectToDatabase()
  const subs = await Subscription.find().sort({ createdAt: -1 }).populate('account', 'fullName email').lean()
  return ok(
    subs.map((s) => ({
      id: String(s._id),
      account: (s.account as unknown as { fullName?: string })?.fullName ?? 'Account',
      email: (s.account as unknown as { email?: string })?.email ?? '',
      planKey: s.planKey,
      price: s.price,
      currency: s.currency,
      status: s.status,
      childrenCount: s.childrenCount,
      currentPeriodEnd: s.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: s.cancelAtPeriodEnd,
    })),
  )
}
