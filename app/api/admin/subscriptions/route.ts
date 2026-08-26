import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
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
      providerSubscriptionId: s.providerSubscriptionId ?? null,
      currentPeriodStart: s.currentPeriodStart ?? null,
    })),
  )
}

const patchSchema = z.object({
  id: z.string(),
  planKey: z.enum(['individual', 'family2', 'family3', 'family4']).optional(),
  price: z.number().optional(),
  status: z.enum(['active', 'past_due', 'cancelled', 'incomplete']).optional(),
  childrenCount: z.number().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodEnd: z.string().optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, currentPeriodEnd, ...rest } = parsed.data
  const update: Record<string, unknown> = { ...rest }
  if (currentPeriodEnd !== undefined) update.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null

  const sub = await Subscription.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!sub) return fail('Subscription not found', 404)

  return ok({ id })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Subscription ID required', 400)

  await connectToDatabase()
  const sub = await Subscription.findByIdAndDelete(id).lean()
  if (!sub) return fail('Subscription not found', 404)
  return ok({ id })
}

