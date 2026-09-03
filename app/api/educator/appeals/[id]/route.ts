import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { AbsenceAppeal, AppealQuestion, AppealAnswer } from '@/models/Appeal'
import { User } from '@/models/User'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { id } = await params
  await connectToDatabase()

  // Verify the appeal belongs to this educator
  const appeal = await AbsenceAppeal.findOne({
    _id: id,
    educator: session.userId,
  })
    .populate('student', 'fullName preferredName email')
    .populate('lesson', 'title customTitle week')
    .populate('attendance', 'sessionDate status')
    .populate('cohort', 'name code')
    .lean()

  if (!appeal) return fail('Appeal not found or unauthorized', 404)

  // Get questions and answers for this appeal
  const questions = await AppealQuestion.find({ appeal: id })
    .populate('askedBy', 'fullName')
    .sort({ order: 1 })
    .lean()

  const answers = await AppealAnswer.find({ appeal: id })
    .populate('answeredBy', 'fullName preferredName')
    .populate('question', 'question order')
    .sort({ createdAt: 1 })
    .lean()

  return ok({
    appeal,
    questions,
    answers,
  })
}
