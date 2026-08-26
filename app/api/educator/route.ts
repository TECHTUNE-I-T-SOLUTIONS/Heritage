import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
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

const patchCohortSchema = z.object({
  id: z.string(),
  schedule: z.string().optional(),
  meetingLink: z.string().optional(),
})

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchCohortSchema.safeParse(body)
  if (!parsed.success) return fail('Provide cohort id and schedule/meeting link', 422)

  await connectToDatabase()
  const { id, schedule, meetingLink } = parsed.data
  const cohort = await Cohort.findOneAndUpdate(
    { _id: id, educator: session.userId },
    { $set: { schedule, meetingLink } },
    { new: true }
  ).lean()

  if (!cohort) return fail('Cohort not found or access denied', 404)

  // Send schedule emails to all students in the cohort
  try {
    const students = await User.find({ role: 'student', cohort: cohort._id }).select('email fullName').lean()
    if (students.length > 0 && (schedule || meetingLink)) {
      const { sendEmail } = await import('@/lib/mail')
      await Promise.all(
        students.map((student) =>
          sendEmail({
            to: student.email,
            subject: `Class Scheduled: ${cohort.name}`,
            type: 'class_schedule',
            data: {
              name: student.fullName,
              className: 'Live Tutor Session',
              cohortName: cohort.name,
              date: schedule || cohort.schedule || 'Regular Class Hours',
              meetingLink: meetingLink || cohort.meetingLink || '',
            },
          })
        )
      )
    }
  } catch (err) {
    console.error('Failed to send class schedule emails:', err)
  }

  return ok({ id })
}


