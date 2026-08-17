import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Quiz, QuizAttempt } from '@/models/Quiz'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('cohort').lean()

  const quizzes = await Quiz.find({ status: 'published', $or: [{ cohort: me?.cohort ?? null }, { cohort: null }] })
    .select('title description questions xpReward')
    .lean()
  const attempts = await QuizAttempt.find({ student: session.userId }).select('quiz percentage score totalPoints xpEarned').lean()
  const attemptMap = new Map(attempts.map((a) => [String(a.quiz), a]))

  return ok(
    quizzes.map((q) => {
      const attempt = attemptMap.get(String(q._id))
      return {
        id: String(q._id),
        title: q.title,
        description: q.description ?? null,
        questionCount: q.questions.length,
        xpReward: q.xpReward,
        attempt: attempt ? { percentage: attempt.percentage, score: attempt.score, totalPoints: attempt.totalPoints, xpEarned: attempt.xpEarned } : null,
      }
    }),
  )
}
