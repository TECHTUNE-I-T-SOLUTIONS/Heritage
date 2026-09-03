import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Pillar, Module, Lesson } from '@/models/Curriculum'

export async function GET() {
  const { response } = await requireAuth()
  if (response) return response

  await connectToDatabase()

  // NOTE: Removed automatic marking of ended lessons - educators now manually mark classes as ended

  const [pillars, modules, lessons] = await Promise.all([
    Pillar.find().sort({ order: 1 }).lean(),
    Module.find().sort({ order: 1 }).select('pillar title status unlockedByEducator').lean(),
    Lesson.find().sort({ week: 1, session: 1, order: 1 }).select('pillar module title customTitle week session xpReward status meetingLink recordingLink scheduledDate scheduledDay scheduledTime ended').lean(),
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
              pillar: String(l.pillar),
              module: String(l.module),
              title: l.title,
              customTitle: l.customTitle,
              week: l.week,
              session: l.session,
              xpReward: l.xpReward,
              status: l.status,
              meetingLink: l.meetingLink,
              recordingLink: l.recordingLink,
              scheduledDate: l.scheduledDate,
              scheduledDay: l.scheduledDay,
              scheduledTime: l.scheduledTime,
              ended: l.ended || false,
            })),
        })),
    })),
  )
}
