import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Subscription } from '@/models/Billing'
import { User } from '@/models/User'

export async function GET() {
  const { session, response } = await requireAuth(['parent', 'student'])
  if (response) return response
  await connectToDatabase()
  
  // Get parent's subscription
  const parentSub = await Subscription.findOne({ account: session.userId }).lean()
  
  // Get parent's children
  const children = await User.find({ parent: session.userId, role: 'student' })
    .select('fullName preferredName email')
    .lean()
  
  // Get subscriptions for each child
  const childIds = children.map(c => c._id)
  const childSubscriptions = await Subscription.find({ account: { $in: childIds } })
    .populate('account', 'fullName preferredName email')
    .lean()
  
  // Format child subscriptions with child information
  const enhancedChildSubs = childSubscriptions.map(sub => {
    const child = sub.account as any
    return {
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
      accountType: 'child',
      childName: child?.fullName || 'Unknown child',
      childPreferredName: child?.preferredName || null,
      childEmail: child?.email || null,
    }
  })
  
  // Format parent subscription
  const formattedParentSub = parentSub ? {
    id: String(parentSub._id),
    planKey: parentSub.planKey,
    price: parentSub.price,
    currency: parentSub.currency,
    status: parentSub.status,
    childrenCount: parentSub.childrenCount,
    currentPeriodStart: parentSub.currentPeriodStart ?? null,
    currentPeriodEnd: parentSub.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: parentSub.cancelAtPeriodEnd,
    provider: parentSub.provider ?? null,
    accountType: 'parent',
  } : null
  
  return ok({
    parentSubscription: formattedParentSub,
    childSubscriptions: enhancedChildSubs,
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
