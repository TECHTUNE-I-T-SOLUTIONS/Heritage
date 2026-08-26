import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Assessment } from '@/models/Assessment'
import { Cohort } from '@/models/Cohort'
import { awardXp } from '@/lib/xp'

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const cohortId = searchParams.get('cohortId')
  const studentId = searchParams.get('studentId')

  await connectToDatabase()

  const filter: Record<string, unknown> = {}
  if (cohortId) filter.cohort = cohortId
  if (studentId) filter.student = studentId

  const assessments = await Assessment.find(filter)
    .populate('student', 'fullName preferredName')
    .sort({ createdAt: -1 })
    .lean()

  return ok(assessments)
}

const postSchema = z.object({
  studentId: z.string(),
  cohortId: z.string(),
  title: z.string().min(1),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  feedback: z.string().optional(),
  xpAmount: z.number().min(0).optional(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { studentId, cohortId, title, score, maxScore, feedback, xpAmount } = parsed.data
  await connectToDatabase()

  // Verify educator owns cohort
  const cohort = await Cohort.findOne({ _id: cohortId, educator: session.userId }).lean()
  if (!cohort) return fail('Cohort not found or unauthorized', 403)

  const assessment = await Assessment.create({
    student: studentId,
    cohort: cohortId,
    title,
    score,
    maxScore,
    feedback,
    recordedBy: session.userId,
  })

  // Award manual XP if specified
  if (xpAmount && xpAmount > 0) {
    await awardXp(studentId, xpAmount, 'manual', assessment._id, `Assessment: ${title} (${score}/${maxScore})`)
  }

  return ok({ id: String(assessment._id) })
}
