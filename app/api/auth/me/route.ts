import { connectToDatabase } from '@/lib/db'
import { User, Cohort } from '@/models'
import { requireAuth, ok } from '@/lib/api'

export async function GET() {
  const auth = await requireAuth()
  if (auth.response) return auth.response
  await connectToDatabase()
  const user = await User.findById(auth.session.userId).select('-passwordHash -resetTokenHash -resetTokenExpires').lean()
  if (!user) return ok(null)
  let cohortCode: string | null = null
  if (user.cohort) {
    const c = await Cohort.findById(user.cohort).select('code').lean()
    cohortCode = c?.code ?? null
  }
  return ok({ ...user, _id: String(user._id), cohortCode })
}
