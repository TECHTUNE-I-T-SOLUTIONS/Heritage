import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Assignment, Submission } from '@/models/Assignment'
import { Quiz, QuizAttempt } from '@/models/Quiz'
import { Lesson } from '@/models/Curriculum'
import { computeStudentProgress } from '@/lib/progress'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('fullName preferredName xp level streak cohort').lean()
  if (!me) return ok(null)

  const cohort = me.cohort ? await Cohort.findById(me.cohort).select('code name schedule meetingLink').lean() : null
  const progress = await computeStudentProgress(me._id, me.xp ?? 0)

  const cohortFilter = { $or: [{ cohort: me.cohort ?? null }, { cohort: null }] }
  const [attempts, quizzes, assignments, submissions, nextClass] = await Promise.all([
    QuizAttempt.find({ student: me._id }).select('quiz').lean(),
    Quiz.countDocuments({ status: 'published', ...cohortFilter }),
    Assignment.find({ status: 'published', ...cohortFilter }).select('title dueDate').sort({ dueDate: 1 }).lean(),
    Submission.find({ student: me._id }).select('assignment status').lean(),
    Lesson.findOne({ status: 'published', scheduledDate: { $gte: new Date() } })
      .sort({ scheduledDate: 1 })
      .select('title customTitle week scheduledDate scheduledDay scheduledTime meetingLink')
      .lean(),
  ])

  const submittedAssignments = new Set(submissions.map((s) => String(s.assignment)))
  const pendingAssignments = assignments.filter((a) => !submittedAssignments.has(String(a._id)))

  return ok({
    name: me.preferredName || me.fullName,
    xp: me.xp ?? 0,
    level: me.level ?? 1,
    streak: me.streak ?? 0,
    cohort: cohort ? { code: cohort.code, name: cohort.name, schedule: cohort.schedule ?? null, meetingLink: cohort.meetingLink ?? null } : null,
    progress,
    quizzesAvailable: quizzes,
    quizzesTaken: attempts.length,
    upcomingAssignments: pendingAssignments.slice(0, 5).map((a) => ({ id: String(a._id), title: a.title, dueDate: a.dueDate ?? null })),
    nextClass: nextClass ? {
      id: String(nextClass._id),
      title: nextClass.title,
      customTitle: nextClass.customTitle,
      week: nextClass.week,
      scheduledDate: nextClass.scheduledDate,
      scheduledDay: nextClass.scheduledDay,
      scheduledTime: nextClass.scheduledTime,
      meetingLink: nextClass.meetingLink,
    } : null,
  })
}
