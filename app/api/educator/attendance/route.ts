import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Cohort } from '@/models/Cohort'
import { User } from '@/models/User'
import { awardXp } from '@/lib/xp'

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const cohortId = searchParams.get('cohortId')
  if (!cohortId) return fail('Cohort ID required', 400)

  await connectToDatabase()

  // Verify educator owns cohort
  const cohort = await Cohort.findOne({ _id: cohortId, educator: session.userId }).lean()
  if (!cohort) return fail('Cohort not found or unauthorized', 403)

  const attendance = await Attendance.find({ cohort: cohortId })
    .populate('student', 'fullName preferredName')
    .sort({ sessionDate: -1 })
    .lean()

  return ok(attendance)
}

const postSchema = z.object({
  cohortId: z.string(),
  sessionDate: z.string(),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      note: z.string().optional(),
    })
  ),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { cohortId, sessionDate, records } = parsed.data
  await connectToDatabase()

  // Verify educator owns cohort
  const cohort = await Cohort.findOne({ _id: cohortId, educator: session.userId }).lean()
  if (!cohort) return fail('Cohort not found or unauthorized', 403)

  const date = new Date(sessionDate)

  for (const r of records) {
    // Upsert attendance record
    await Attendance.findOneAndUpdate(
      { student: r.studentId, cohort: cohortId, sessionDate: date },
      {
        $set: {
          status: r.status,
          note: r.note || '',
          markedBy: session.userId,
        },
      },
      { upsert: true }
    )

    // Award 20 XP for present or late
    if (r.status === 'present' || r.status === 'late') {
      await awardXp(r.studentId, 20, 'attendance', undefined, `Attended session on ${date.toDateString()}`)
    }
  }

  return ok({ success: true })
}
