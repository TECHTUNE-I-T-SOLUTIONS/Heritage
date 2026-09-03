import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { AppealAnswer, AbsenceAppeal } from '@/models/Appeal'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/mail'

const answerSchema = z.object({
  appealId: z.string(),
  questionId: z.string(),
  answer: z.string(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = answerSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { appealId, questionId, answer } = parsed.data
  await connectToDatabase()

  // Verify the appeal belongs to this student
  const appeal = await AbsenceAppeal.findOne({
    _id: appealId,
    student: session.userId,
  }).lean()

  if (!appeal) return fail('Appeal not found or unauthorized', 404)

  // Check if an answer already exists for this question
  const existingAnswer = await AppealAnswer.findOne({
    appeal: appealId,
    question: questionId,
    answeredBy: session.userId,
  }).lean()

  if (existingAnswer) return fail('You have already answered this question', 400)

  // Create the answer
  const appealAnswer = await AppealAnswer.create({
    appeal: appealId,
    question: questionId,
    answeredBy: session.userId,
    answer,
  })

  // Send email notification to educator
  const educator = await User.findById(appeal.educator).lean()
  const student = await User.findById(session.userId).lean()

  if (educator && student) {
    try {
      await sendEmail({
        to: educator.email,
        subject: 'Student Answered Appeal Question - Heritage Club',
        type: 'appeal_answer',
        data: {
          educatorName: educator.fullName,
          studentName: student.preferredName || student.fullName,
          answer,
        },
      })
    } catch (emailError) {
      console.error('Error sending answer notification email:', emailError)
    }
  }

  return ok({ success: true, answerId: appealAnswer._id })
}

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const appealId = searchParams.get('appealId')

  if (!appealId) return fail('Appeal ID required', 400)

  await connectToDatabase()

  // Verify the appeal belongs to this student
  const appeal = await AbsenceAppeal.findOne({
    _id: appealId,
    student: session.userId,
  }).lean()

  if (!appeal) return fail('Appeal not found or unauthorized', 404)

  // Get all answers for this appeal
  const answers = await AppealAnswer.find({ appeal: appealId })
    .populate('question', 'question order')
    .sort({ createdAt: -1 })
    .lean()

  return ok(answers)
}
