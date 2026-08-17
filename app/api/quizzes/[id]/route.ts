import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Quiz, QuizAttempt } from '@/models/Quiz'

/** Returns quiz questions WITHOUT the correct answers, plus any prior attempt. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response
  const { id } = await params

  await connectToDatabase()
  const quiz = await Quiz.findById(id).lean()
  if (!quiz || quiz.status !== 'published') return fail('Quiz not found', 404)

  const attempt = await QuizAttempt.findOne({ student: session.userId, quiz: id }).lean()

  return ok({
    id: String(quiz._id),
    title: quiz.title,
    description: quiz.description ?? null,
    xpReward: quiz.xpReward,
    questions: quiz.questions.map((q) => ({ prompt: q.prompt, options: q.options, points: q.points })),
    attempt: attempt
      ? { answers: attempt.answers, percentage: attempt.percentage, score: attempt.score, totalPoints: attempt.totalPoints }
      : null,
  })
}
