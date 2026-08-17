import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

/** Leaderboard: top students by XP. Scoped to the requester's cohort when they have one. */
export async function GET(request: Request) {
  const { session, response } = await requireAuth(['student', 'parent', 'educator', 'admin'])
  if (response) return response

  await connectToDatabase()
  const { searchParams } = new URL(request.url)
  const scope = searchParams.get('scope') ?? 'cohort'

  const filter: Record<string, unknown> = { role: 'student', status: 'active' }
  let myCohort: string | null = null

  if (scope === 'cohort' && session.role === 'student') {
    const me = await User.findById(session.userId).select('cohort').lean()
    if (me?.cohort) {
      filter.cohort = me.cohort
      myCohort = String(me.cohort)
    }
  }

  const students = await User.find(filter).sort({ xp: -1 }).limit(50).select('fullName preferredName xp level cohort').lean()

  return ok({
    scope,
    myCohort,
    entries: students.map((s, i) => ({
      rank: i + 1,
      id: String(s._id),
      name: s.preferredName || s.fullName,
      xp: s.xp ?? 0,
      level: s.level ?? 1,
      isMe: String(s._id) === session.userId,
    })),
  })
}
