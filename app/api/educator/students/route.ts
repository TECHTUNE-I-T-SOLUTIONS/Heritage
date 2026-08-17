import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { computeStudentProgress } from '@/lib/progress'

export async function GET() {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  await connectToDatabase()
  const cohorts = await Cohort.find({ educator: session.userId }).select('_id code').lean()
  const cohortMap = new Map(cohorts.map((c) => [String(c._id), c.code]))
  const students = await User.find({ role: 'student', cohort: { $in: cohorts.map((c) => c._id) } })
    .select('fullName preferredName age xp level streak cohort status')
    .lean()

  const rows = await Promise.all(
    students.map(async (s) => {
      const progress = await computeStudentProgress(s._id, s.xp ?? 0)
      return {
        id: String(s._id),
        name: s.preferredName || s.fullName,
        age: s.age ?? null,
        cohortCode: s.cohort ? cohortMap.get(String(s.cohort)) ?? null : null,
        xp: s.xp ?? 0,
        level: s.level ?? 1,
        streak: s.streak ?? 0,
        status: s.status,
        lessonsPct: progress.lessonsPct,
        avgQuizScore: progress.avgQuizScore,
      }
    }),
  )

  return ok(rows)
}
