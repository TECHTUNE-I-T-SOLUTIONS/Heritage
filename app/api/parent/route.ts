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
  const payments = await Payment.find({ account: parentId }).sort({ createdAt: -1 }).limit(10).lean()
  
  // Get child details for individual child payments
  const studentIds = payments
    .map(p => p.metadata?.studentId)
    .filter(Boolean)
    .map(id => id.toString())
  
  const childrenForPayments = await User.find({ 
    _id: { $in: studentIds },
    parent: parentId 
  }).select('fullName preferredName').lean()
  
  const childMap = new Map(childrenForPayments.map(c => [String(c._id), c]))

  const enhancedPayments = payments.map(p => {
    const studentId = p.metadata?.studentId?.toString()
    const child = studentId ? childMap.get(studentId) : null
    
    return {
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      childName: child ? (child.preferredName || child.fullName) : null,
      childId: studentId || null,
      paymentType: p.paymentType || (p.subscription ? 'subscription' : 'individual_child'),
      accountType: 'parent',
    }
  })

  // Get child subscriptions and payments
  const childIds = children.map(c => c._id)
  const childSubscriptions = await Subscription.find({ account: { $in: childIds } })
    .populate('account', 'fullName preferredName email')
    .lean()
  
  const childPayments = await Payment.find({ account: { $in: childIds } })
    .populate('account', 'fullName preferredName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  const enhancedChildSubs = childSubscriptions.map(sub => {
    const child = sub.account as any
    return {
      id: String(sub._id),
      planKey: sub.planKey,
      price: sub.price,
      currency: sub.currency,
      status: sub.status,
      childrenCount: sub.childrenCount,
      currentPeriodEnd: sub.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      accountType: 'child',
      childName: child?.fullName || 'Unknown child',
      childPreferredName: child?.preferredName || null,
      childEmail: child?.email || null,
    }
  })

  const enhancedChildPayments = childPayments.map(p => {
    const child = p.account as any
    return {
      id: String(p._id),
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      invoiceNumber: p.invoiceNumber ?? null,
      paidAt: p.paidAt ?? null,
      createdAt: p.createdAt,
      childName: child?.fullName || 'Unknown child',
      childPreferredName: child?.preferredName || null,
      childEmail: child?.email || null,
      paymentType: p.paymentType || (p.subscription ? 'subscription' : 'individual_child'),
      accountType: 'child',
    }
  })

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
    payments: enhancedPayments,
    childSubscriptions: enhancedChildSubs,
    childPayments: enhancedChildPayments,
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
