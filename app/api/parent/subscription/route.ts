import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Subscription } from '@/models/Billing'

export async function GET() {
  const { session, response } = await requireAuth(['parent', 'student'])
  if (response) return response
  await connectToDatabase()
  const sub = await Subscription.findOne({ account: session.userId }).lean()
  if (!sub) return ok(null)
  return ok({
    id: String(sub._id),
    planKey: sub.planKey,
    price: sub.price,
    currency: sub.currency,
    status: sub.status,
    childrenCount: sub.childrenCount,
    currentPeriodStart: sub.currentPeriodStart ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    provider: sub.provider ?? null,
  })
}

const patchSchema = z.object({ cancelAtPeriodEnd: z.boolean() })

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth(['parent', 'student'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request.', 422)

  await connectToDatabase()
  const sub = await Subscription.findOneAndUpdate(
    { account: session.userId },
    { cancelAtPeriodEnd: parsed.data.cancelAtPeriodEnd },
    { new: true },
  ).lean()
  if (!sub) return fail('No subscription found.', 404)
  return ok({ cancelAtPeriodEnd: sub.cancelAtPeriodEnd })
}
