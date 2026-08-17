import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Submission } from '@/models/Assignment'
import { Subscription, Payment } from '@/models/Billing'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()
  const [students, parents, educators, cohorts, activeSubs, pendingMod, payments] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'parent' }),
    User.countDocuments({ role: 'educator' }),
    Cohort.countDocuments({}),
    Subscription.countDocuments({ status: 'active' }),
    Submission.countDocuments({ moderation: { $in: ['pending', 'flagged', 'under_review'] } }),
    Payment.find({ status: 'succeeded' }).select('amount').lean(),
  ])

  const revenue = payments.reduce((s, p) => s + p.amount, 0)

  return ok({ students, parents, educators, cohorts, activeSubs, pendingMod, revenue })
}
