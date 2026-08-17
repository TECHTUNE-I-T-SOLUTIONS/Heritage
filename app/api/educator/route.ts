import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Submission } from '@/models/Assignment'
import { Quiz } from '@/models/Quiz'

/** Resolve the cohorts an educator is responsible for. */
export async function educatorCohortIds(educatorId: string) {
  const cohorts = await Cohort.find({ educator: educatorId }).select('_id code name schedule capacity').lean()
  return cohorts
}

export async function GET() {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  await connectToDatabase()
  const cohorts = await educatorCohortIds(session.userId)
  const cohortIds = cohorts.map((c) => c._id)

  const [studentCount, pendingSubmissions, quizCount] = await Promise.all([
    User.countDocuments({ role: 'student', cohort: { $in: cohortIds } }),
    Submission.countDocuments({ status: { $in: ['submitted', 'late'] } }),
    Quiz.countDocuments({ createdBy: session.userId }),
  ])

  return ok({
    cohorts: cohorts.map((c) => ({ id: String(c._id), code: c.code, name: c.name, schedule: c.schedule ?? null, capacity: c.capacity })),
    studentCount,
    pendingSubmissions,
    quizCount,
  })
}
