import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Subscription, Payment } from '@/models/Billing'
import { computeStudentProgress } from '@/lib/progress'

export async function GET() {
  const { session, response } = await requireAuth(['parent'])
  if (response) return response

  await connectToDatabase()
  const parentId = session.userId

  const children = await User.find({ parent: parentId, role: 'student' })
    .select('fullName preferredName age xp level streak cohort avatarUrl status email')
    .lean()

  const cohortIds = children.map((c) => c.cohort).filter(Boolean)
  const cohorts = await Cohort.find({ _id: { $in: cohortIds } }).select('code name schedule').lean()
  const cohortMap = new Map(cohorts.map((c) => [String(c._id), c]))

  const childCards = await Promise.all(
    children.map(async (child) => {
      const progress = await computeStudentProgress(child._id, child.xp ?? 0)
      const cohort = child.cohort ? cohortMap.get(String(child.cohort)) : null
      return {
        id: String(child._id),
        fullName: child.fullName,
        preferredName: child.preferredName ?? null,
        email: child.email,
        age: child.age ?? null,
        status: child.status,
        xp: child.xp ?? 0,
        level: child.level ?? 1,
        streak: child.streak ?? 0,
        cohortCode: cohort?.code ?? null,
        cohortName: cohort?.name ?? null,
        schedule: cohort?.schedule ?? null,
        progress,
      }
    }),
  )

  const subscription = await Subscription.findOne({ account: parentId }).lean()
  const payments = await Payment.find({ account: parentId }).sort({ createdAt: -1 }).limit(5).lean()

  return ok({
    children: childCards,
    subscription: subscription
      ? {
          planKey: subscription.planKey,
          price: subscription.price,
          currency: subscription.currency,
          status: subscription.status,
          childrenCount: subscription.childrenCount,
          currentPeriodEnd: subscription.currentPeriodEnd ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        }
      : null,
    recentPayments: payments.map((p) => ({
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
    })),
  })
}
