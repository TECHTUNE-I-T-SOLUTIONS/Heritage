import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Pillar, Lesson, LessonProgress } from '@/models/Curriculum'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('cohort').lean()
  const cohort = me?.cohort ? await Cohort.findById(me.cohort).select('code name schedule meetingLink timezone').lean() : null

  const [pillars, lessons, progress] = await Promise.all([
    Pillar.find({ status: 'published' }).sort({ order: 1 }).select('title slug order').lean(),
    Lesson.find({ status: 'published' }).sort({ week: 1, order: 1 }).select('title summary week pillar xpReward').lean(),
    LessonProgress.find({ student: session.userId, completed: true }).select('lesson').lean(),
  ])

  const done = new Set(progress.map((p) => String(p.lesson)))
  const pillarGroups = pillars.map((p) => ({
    id: String(p._id),
    title: p.title,
    lessons: lessons
      .filter((l) => String(l.pillar) === String(p._id))
      .map((l) => ({ id: String(l._id), title: l.title, summary: l.summary ?? null, week: l.week, xpReward: l.xpReward, completed: done.has(String(l._id)) })),
  }))

  return ok({
    cohort: cohort
      ? { code: cohort.code, name: cohort.name, schedule: cohort.schedule ?? null, meetingLink: cohort.meetingLink ?? null, timezone: cohort.timezone ?? null }
      : null,
    pillars: pillarGroups,
  })
}
