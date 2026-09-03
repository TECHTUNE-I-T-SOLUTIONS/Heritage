import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Pillar, Module, Lesson, LessonProgress } from '@/models/Curriculum'
import { Attendance } from '@/models/Attendance'
import { RecordingWatchProgress } from '@/models/Appeal'
import { markEndedLessons } from '@/lib/lesson-status'

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')

  await connectToDatabase()
  
  // If lessonId is provided, return just that lesson's details
  if (lessonId) {
    console.log('Fetching lesson with ID:', lessonId)
    const lesson = await Lesson.findById(lessonId)
      .select('id title customTitle recordingLink week session status')
      .lean()

    console.log('Found lesson:', lesson)

    if (!lesson) {
      console.log('Lesson not found')
      // Try to find any lesson to debug
      const allLessons = await Lesson.find().select('id title status').limit(5).lean()
      console.log('Sample lessons in database:', allLessons)
      return fail('Lesson not found', 404)
    }

    if (lesson.status !== 'published') {
      console.log('Lesson not published, status:', lesson.status)
      return fail('Lesson not published', 404)
    }

    // Check if student has attendance for this lesson
    const attendance = await Attendance.findOne({
      student: session.userId,
      week: lesson.week,
      session: lesson.session,
    }).lean()

    // Check if student has marked this recording as watched
    const watchProgress = await RecordingWatchProgress.findOne({
      student: session.userId,
      lesson: lessonId,
      completed: true,
    }).lean()

    return ok({
      lesson,
      attendanceStatus: attendance?.status || null,
      attendanceId: attendance?._id?.toString() || null,
      recordingWatched: !!watchProgress,
    })
  }

  // NOTE: Removed automatic marking of ended lessons - educators now manually mark classes as ended

  const me = await User.findById(session.userId).select('cohort').lean()
  const cohort = me?.cohort ? await Cohort.findById(me.cohort).select('code name schedule meetingLink timezone').lean() : null

  const [pillars, modules, lessons, progress, attendance, watchProgress] = await Promise.all([
    Pillar.find({ status: 'published' }).sort({ order: 1 }).select('title slug order').lean(),
    Module.find({ status: 'published' }).sort({ order: 1 }).select('pillar title order unlockedByEducator').lean(),
    Lesson.find({ status: 'published' }).sort({ week: 1, session: 1, order: 1 }).select('title customTitle summary week session pillar module xpReward meetingLink recordingLink scheduledDate scheduledDay scheduledTime ended').lean(),
    LessonProgress.find({ student: session.userId, completed: true }).select('lesson').lean(),
    Attendance.find({ student: session.userId }).select('module week session status cohort').lean(),
    RecordingWatchProgress.find({ student: session.userId, completed: true }).select('lesson attendance').lean(),
  ])

  const done = new Set(progress.map((p) => String(p.lesson)))
  const watchedRecordings = new Set(watchProgress.map((w) => String(w.lesson)))
  
  // Create attendance map by week and session for better tracking
  const attendanceMap = new Map()
  attendance.forEach((a) => {
    const key = `${a.week}-${a.session}`
    attendanceMap.set(key, a)
  })
  
  // Calculate attendance statistics
  const totalAttendance = attendance.length
  const presentAttendance = attendance.filter((a) => a.status === 'present' || a.status === 'late').length
  const absentAttendance = attendance.filter((a) => a.status === 'absent').length
  const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0

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
        const previousModuleAttendance = attendance.filter((a) => {
          const moduleLessons = lessons.filter((l) => String(l.module) === String(previousModule._id))
          return moduleLessons.some((lesson) => lesson.week === a.week && lesson.session === a.session)
        })
        
        // Module is considered completed if student attended most sessions or completed lessons
        const attendanceCompletionRate = previousModuleAttendance.length / (previousModuleLessons.length || 1)
        const lessonCompletionRate = previousModuleLessons.filter((l) => done.has(String(l._id))).length / (previousModuleLessons.length || 1)
        
        previousModuleCompleted = (attendanceCompletionRate >= 0.7) || (lessonCompletionRate >= 0.8)
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
          .map((l) => {
            // Match attendance by week and session (how educator marks attendance)
            const key = `${l.week}-${l.session}`
            const att = attendanceMap.get(key)
            return {
              id: String(l._id),
              title: l.title,
              customTitle: l.customTitle ?? null,
              summary: l.summary ?? null,
              week: l.week,
              session: l.session,
              xpReward: l.xpReward,
              completed: done.has(String(l._id)),
              meetingLink: l.meetingLink ?? null,
              recordingLink: l.recordingLink ?? null,
              scheduledDate: l.scheduledDate ?? null,
              scheduledDay: l.scheduledDay ?? null,
              scheduledTime: l.scheduledTime ?? null,
              ended: l.ended || false,
              attendanceId: att?._id ? String(att._id) : undefined,
              attendanceStatus: att?.status,
              recordingWatched: watchedRecordings.has(String(l._id)),
            }
          }),
      })),
    }
  })

  return ok({
    cohort: cohort
      ? { code: cohort.code, name: cohort.name, schedule: cohort.schedule ?? null, meetingLink: cohort.meetingLink ?? null, timezone: cohort.timezone ?? null }
      : null,
    pillars: pillarGroups,
    attendanceStats: {
      total: totalAttendance,
      present: presentAttendance,
      absent: absentAttendance,
      rate: attendanceRate,
    },
  })
}
