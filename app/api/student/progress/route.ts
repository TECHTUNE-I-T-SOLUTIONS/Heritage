import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { XpEvent } from '@/models/Gamification'
import { QuizAttempt } from '@/models/Quiz'
import { computeStudentProgress } from '@/lib/progress'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('xp level streak').lean()
  const progress = await computeStudentProgress(session.userId, me?.xp ?? 0)

  const [events, attempts] = await Promise.all([
    XpEvent.find({ student: session.userId }).sort({ createdAt: -1 }).limit(20).lean(),
    QuizAttempt.find({ student: session.userId }).populate('quiz', 'title').sort({ createdAt: -1 }).limit(10).lean(),
  ])

  return ok({
    xp: me?.xp ?? 0,
    level: me?.level ?? 1,
    streak: me?.streak ?? 0,
    progress,
    xpEvents: events.map((e) => ({ id: String(e._id), source: e.source, amount: e.amount, note: e.note ?? null, createdAt: e.createdAt })),
    quizHistory: attempts.map((a) => ({
      id: String(a._id),
      title: (a.quiz as unknown as { title?: string })?.title ?? 'Quiz',
      percentage: a.percentage,
      score: a.score,
      totalPoints: a.totalPoints,
      createdAt: a.createdAt,
    })),
  })
}
