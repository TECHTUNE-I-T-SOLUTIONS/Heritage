import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Pillar, Module, Lesson, LessonProgress } from '@/models/Curriculum'
import { Attendance } from '@/models/Attendance'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('cohort').lean()
  const cohort = me?.cohort ? await Cohort.findById(me.cohort).select('code name schedule meetingLink timezone').lean() : null

  const [pillars, modules, lessons, progress, attendance] = await Promise.all([
    Pillar.find({ status: 'published' }).sort({ order: 1 }).select('title slug order').lean(),
    Module.find({ status: 'published' }).sort({ order: 1 }).select('pillar title order unlockedByEducator').lean(),
    Lesson.find({ status: 'published' }).sort({ week: 1, order: 1 }).select('title customTitle summary week pillar module xpReward meetingLink recordingLink scheduledDate scheduledDay scheduledTime').lean(),
    LessonProgress.find({ student: session.userId, completed: true }).select('lesson').lean(),
    Attendance.find({ student: session.userId, status: { $in: ['present', 'late'] } }).select('module').lean(),
  ])

  const done = new Set(progress.map((p) => String(p.lesson)))
  const attendedModules = new Set(attendance.map((a) => String(a.module)))

  // Group modules by pillar and determine unlock status
  const pillarGroups = pillars.map((p) => {
    const pillarModules = modules.filter((m) => String(m.pillar) === String(p._id)).sort((a, b) => a.order - b.order)
    
    // Determine which modules are unlocked
    const modulesWithUnlock = pillarModules.map((m, index) => {
      const educatorUnlocked = m.unlockedByEducator
      
      // Previous module (for sequential unlocking)
      const previousModule = index > 0 ? pillarModules[index - 1] : null
      
      // Check if previous module is completed (attended and lessons completed)
      let previousModuleCompleted = false
      if (previousModule) {
        const previousModuleLessons = lessons.filter((l) => String(l.module) === String(previousModule._id))
        
        // Check if student attended sessions for previous module
        const attendedPreviousModule = attendance.some((a) => String(a.module) === String(previousModule._id))
        
        // Check if all lessons in previous module are completed
        const previousModuleLessonIds = previousModuleLessons.map((l) => String(l._id))
        const completedAllLessons = previousModuleLessonIds.every((lessonId) => done.has(lessonId))
        
        previousModuleCompleted = attendedPreviousModule && completedAllLessons
      }
      
      // Module is unlocked if:
      // 1. Educator explicitly unlocked it, OR
      // 2. It's the first module, OR
      // 3. Previous module is completed
      const unlocked = educatorUnlocked || index === 0 || previousModuleCompleted
      
      return {
        ...m,
        id: String(m._id),
        unlocked,
      }
    })
    
    return {
      id: String(p._id),
      title: p.title,
      modules: modulesWithUnlock.map((m) => ({
        id: m.id,
        title: m.title,
        unlocked: m.unlocked,
        lessons: lessons
          .filter((l) => String(l.module) === m.id)
          .map((l) => ({
            id: String(l._id),
            title: l.title,
            customTitle: l.customTitle ?? null,
            summary: l.summary ?? null,
            week: l.week,
            xpReward: l.xpReward,
            completed: done.has(String(l._id)),
            meetingLink: l.meetingLink ?? null,
            recordingLink: l.recordingLink ?? null,
            scheduledDate: l.scheduledDate ?? null,
            scheduledDay: l.scheduledDay ?? null,
            scheduledTime: l.scheduledTime ?? null,
          })),
      })),
    }
  })

  return ok({
    cohort: cohort
      ? { code: cohort.code, name: cohort.name, schedule: cohort.schedule ?? null, meetingLink: cohort.meetingLink ?? null, timezone: cohort.timezone ?? null }
      : null,
    pillars: pillarGroups,
  })
}
