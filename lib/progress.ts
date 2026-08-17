import { Types } from 'mongoose'
import { Lesson, LessonProgress } from '@/models/Curriculum'
import { QuizAttempt } from '@/models/Quiz'
import { Submission } from '@/models/Assignment'
import { levelFromXp, xpForNextLevel } from '@/models/Gamification'

export interface StudentProgress {
  lessonsCompleted: number
  lessonsTotal: number
  lessonsPct: number
  quizzesTaken: number
  avgQuizScore: number
  submissions: number
  xp: number
  level: number
  xpInto: number
  xpNeeded: number
}

/** Compute a real progress summary for a single student. */
export async function computeStudentProgress(studentId: Types.ObjectId | string, xp = 0): Promise<StudentProgress> {
  const [lessonsTotal, lessonsCompleted, attempts, submissions] = await Promise.all([
    Lesson.countDocuments({ status: 'published' }),
    LessonProgress.countDocuments({ student: studentId, completed: true }),
    QuizAttempt.find({ student: studentId }).select('percentage').lean(),
    Submission.countDocuments({ student: studentId, status: { $ne: 'draft' } }),
  ])

  const avgQuizScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / attempts.length)
    : 0

  const { into, needed } = xpForNextLevel(xp)

  return {
    lessonsCompleted,
    lessonsTotal,
    lessonsPct: lessonsTotal ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0,
    quizzesTaken: attempts.length,
    avgQuizScore,
    submissions,
    xp,
    level: levelFromXp(xp),
    xpInto: into,
    xpNeeded: needed,
  }
}
