import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Lesson, LessonProgress } from '@/models/Curriculum'
import { awardXp } from '@/lib/xp'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response
  const { id } = await params

  await connectToDatabase()
  const lesson = await Lesson.findById(id).select('xpReward status').lean()
  if (!lesson || lesson.status !== 'published') return fail('Lesson not found', 404)

  const existing = await LessonProgress.findOne({ student: session.userId, lesson: id })
  if (existing?.completed) return ok({ alreadyCompleted: true })

  await LessonProgress.findOneAndUpdate(
    { student: session.userId, lesson: id },
    { completed: true, completedAt: new Date() },
    { upsert: true, new: true },
  )
  await awardXp(session.userId, lesson.xpReward ?? 50, 'lesson', id)

  return ok({ completed: true, xpEarned: lesson.xpReward ?? 50 })
}
