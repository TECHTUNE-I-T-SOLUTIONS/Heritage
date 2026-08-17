import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Quiz, QuizAttempt } from '@/models/Quiz'
import { awardXp } from '@/lib/xp'

const schema = z.object({ answers: z.array(z.number().int()) })

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid answers', 422)

  await connectToDatabase()
  const quiz = await Quiz.findById(id).lean()
  if (!quiz || quiz.status !== 'published') return fail('Quiz not found', 404)

  const existing = await QuizAttempt.findOne({ student: session.userId, quiz: id }).lean()
  if (existing) return fail('You have already completed this quiz.', 409)

  let score = 0
  let totalPoints = 0
  quiz.questions.forEach((q, i) => {
    totalPoints += q.points
    if (parsed.data.answers[i] === q.correctIndex) score += q.points
  })
  const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0
  const xpEarned = Math.round((quiz.xpReward ?? 100) * (percentage / 100))

  await QuizAttempt.create({
    quiz: id,
    student: session.userId,
    answers: parsed.data.answers,
    score,
    totalPoints,
    percentage,
    xpEarned,
    submittedAt: new Date(),
  })
  await awardXp(session.userId, xpEarned, 'quiz', id)

  return ok({ score, totalPoints, percentage, xpEarned })
}
