import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { AbsenceAppeal, RecordingWatchProgress } from '@/models/Appeal'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'
import { Cohort } from '@/models/Cohort'
import { sendEmail } from '@/lib/mail'

const createAppealSchema = z.object({
  attendanceId: z.string(),
  lessonId: z.string(),
  reason: z.string().optional(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = createAppealSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { attendanceId, lessonId, reason } = parsed.data
  await connectToDatabase()

  // Verify the attendance belongs to this student and is absent
  const attendance = await Attendance.findOne({
    _id: attendanceId,
    student: session.userId,
    status: 'absent',
  }).lean()

  if (!attendance) return fail('Only absent attendance can be appealed', 400)

  // Verify the student has watched the recording to completion
  const watchProgress = await RecordingWatchProgress.findOne({
    student: session.userId,
    lesson: lessonId,
    attendance: attendanceId,
    completed: true,
  }).lean()

  if (!watchProgress) return fail('You must watch the recording to completion before appealing', 400)

  // Check if an appeal already exists
  const existingAppeal = await AbsenceAppeal.findOne({
    student: session.userId,
    attendance: attendanceId,
  }).lean()

  if (existingAppeal) return fail('An appeal already exists for this attendance', 400)

  // Get lesson and cohort details
  const lesson = await Lesson.findById(lessonId).lean()
  if (!lesson) return fail('Lesson not found', 404)

  const cohort = await Cohort.findById(attendance.cohort).populate('educator').lean()
  if (!cohort || !cohort.educator) return fail('Cohort not found', 404)

  // Create the appeal
  const appeal = await AbsenceAppeal.create({
    student: session.userId,
    attendance: attendanceId,
    lesson: lessonId,
    cohort: cohort._id,
    educator: cohort.educator._id,
    status: 'pending',
    reason,
  })

  // Send email notification to educator
  try {
    await sendEmail({
      to: (cohort.educator as any).email,
      subject: 'New Absence Appeal - Heritage Club',
      type: 'absence_appeal',
      data: {
        educatorName: (cohort.educator as any).fullName,
        studentName: session.fullName,
        lessonTitle: lesson.customTitle || lesson.title,
        week: lesson.week,
        reason: reason || 'No reason provided',
      },
    })
  } catch (emailError) {
    console.error('Error sending appeal notification email:', emailError)
  }

  return ok({ success: true, appealId: appeal._id })
}

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()

  const appeals = await AbsenceAppeal.find({ student: session.userId })
    .populate('lesson', 'title customTitle week')
    .populate('attendance', 'sessionDate status')
    .sort({ createdAt: -1 })
    .lean()

  return ok(appeals)
}
