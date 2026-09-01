import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Pillar, Module, Lesson } from '@/models/Curriculum'

export async function GET() {
  const { response } = await requireAuth()
  if (response) return response

  await connectToDatabase()
  const [pillars, modules, lessons] = await Promise.all([
    Pillar.find().sort({ order: 1 }).lean(),
    Module.find().sort({ order: 1 }).select('unlockedByEducator').lean(),
    Lesson.find().sort({ week: 1, order: 1 }).select('title customTitle week xpReward status meetingLink scheduledDate scheduledDay scheduledTime').lean(),
  ])

  return ok(
    pillars.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      status: p.status,
      modules: modules
        .filter((m) => String(m.pillar) === String(p._id))
        .map((m) => ({
          id: String(m._id),
          title: m.title,
          status: m.status,
          unlockedByEducator: m.unlockedByEducator,
          lessons: lessons
            .filter((l) => String(l.module) === String(m._id))
            .map((l) => ({
              id: String(l._id),
              title: l.title,
              customTitle: l.customTitle,
              week: l.week,
              xpReward: l.xpReward,
              status: l.status,
              meetingLink: l.meetingLink,
              scheduledDate: l.scheduledDate,
              scheduledDay: l.scheduledDay,
              scheduledTime: l.scheduledTime,
            })),
        })),
    })),
  )
}
