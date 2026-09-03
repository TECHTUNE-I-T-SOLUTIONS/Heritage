import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { AbsenceAppeal, AppealQuestion, AppealAnswer } from '@/models/Appeal'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'
import { Cohort } from '@/models/Cohort'
import { User } from '@/models/User'
import { awardXp } from '@/lib/xp'
import { sendEmail } from '@/lib/mail'

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  await connectToDatabase()

  const appeals = await AbsenceAppeal.find({ educator: session.userId })
    .populate('student', 'fullName preferredName email')
    .populate('lesson', 'title customTitle week')
    .populate('attendance', 'sessionDate status')
    .populate('cohort', 'name code')
    .sort({ createdAt: -1 })
    .lean()

  return ok(appeals)
}

const addQuestionSchema = z.object({
  appealId: z.string(),
  question: z.string(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = addQuestionSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { appealId, question } = parsed.data
  await connectToDatabase()

  // Verify the appeal belongs to this educator
  const appeal = await AbsenceAppeal.findOne({
    _id: appealId,
    educator: session.userId,
  }).lean()

  if (!appeal) return fail('Appeal not found or unauthorized', 404)

  // Get existing questions to determine order
  const existingQuestions = await AppealQuestion.find({ appeal: appealId }).sort({ order: -1 }).limit(1).lean()
  const nextOrder = existingQuestions.length > 0 ? existingQuestions[0].order + 1 : 0

  // Create the question
  const appealQuestion = await AppealQuestion.create({
    appeal: appealId,
    askedBy: session.userId,
    question,
    order: nextOrder,
  })

  // Update appeal status to under_review
  await AbsenceAppeal.findByIdAndUpdate(appealId, { status: 'under_review' })

  // Send email notification to student
  const student = await User.findById(appeal.student).lean()
  const lesson = await Lesson.findById(appeal.lesson).lean()

  if (student && lesson) {
    try {
      await sendEmail({
        to: student.email,
        subject: 'Question About Your Absence Appeal - Heritage Club',
        type: 'appeal_question',
        data: {
          name: student.preferredName || student.fullName,
          lessonTitle: lesson.customTitle || lesson.title,
          question,
        },
      })
    } catch (emailError) {
      console.error('Error sending question notification email:', emailError)
    }
  }

  return ok({ success: true, questionId: appealQuestion._id })
}

const reviewAppealSchema = z.object({
  appealId: z.string(),
  decision: z.enum(['approved', 'rejected']),
  response: z.string().optional(),
})

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = reviewAppealSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { appealId, decision, response: teacherResponse } = parsed.data
  await connectToDatabase()

  // Verify the appeal belongs to this educator
  const appeal = await AbsenceAppeal.findOne({
    _id: appealId,
    educator: session.userId,
  }).lean()

  if (!appeal) return fail('Appeal not found or unauthorized', 404)

  // Update appeal status
  await AbsenceAppeal.findByIdAndUpdate(appealId, {
    status: decision === 'approved' ? 'approved' : 'rejected',
    teacherResponse,
    reviewedAt: new Date(),
    reviewedBy: session.userId,
  })

  // If approved, update attendance and award XP
  if (decision === 'approved') {
    await Attendance.findByIdAndUpdate(appeal.attendance, {
      status: 'present',
      note: 'Approved via absence appeal',
    })

    // Award XP for the attended class
    const lesson = await Lesson.findById(appeal.lesson).lean()
    if (lesson) {
      await awardXp(
        appeal.student.toString(),
        20,
        'attendance_appeal',
        undefined,
        `Attended Week ${lesson.week} via absence appeal`
      )
    }
  }

  // Send email notification to student
  const student = await User.findById(appeal.student).lean()
  const lesson = await Lesson.findById(appeal.lesson).lean()

  if (student && lesson) {
    try {
      await sendEmail({
        to: student.email,
        subject: decision === 'approved' ? 'Absence Appeal Approved - Heritage Club' : 'Absence Appeal Rejected - Heritage Club',
        type: decision === 'approved' ? 'appeal_approved' : 'appeal_rejected',
        data: {
          name: student.preferredName || student.fullName,
          lessonTitle: lesson.customTitle || lesson.title,
          response: teacherResponse || '',
        },
      })
    } catch (emailError) {
      console.error('Error sending appeal decision email:', emailError)
    }
  }

  return ok({ success: true, decision })
}
