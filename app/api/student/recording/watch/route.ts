import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { RecordingWatchProgress } from '@/models/Appeal'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'

const updateProgressSchema = z.object({
  lessonId: z.string(),
  attendanceId: z.string().optional(),
  progress: z.number().min(0).max(100),
  completed: z.boolean().optional(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = updateProgressSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { lessonId, attendanceId, progress, completed } = parsed.data
  await connectToDatabase()

  // Verify the lesson exists
  const lesson = await Lesson.findById(lessonId).lean()
  if (!lesson) return fail('Lesson not found', 404)

  // Update or create watch progress (attendanceId is optional now)
  const updateData: any = {
    progress,
    completed: completed || (progress >= 100),
    completedAt: (completed || progress >= 100) ? new Date() : undefined,
    lastWatchedAt: new Date(),
  }

  if (attendanceId) {
    updateData.attendance = attendanceId
  }

  const watchProgress = await RecordingWatchProgress.findOneAndUpdate(
    { student: session.userId, lesson: lessonId },
    {
      $set: updateData,
    },
    { upsert: true, new: true }
  ).lean()

  return ok({ success: true, progress: watchProgress.progress, completed: watchProgress.completed })
}

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lessonId')
  const attendanceId = searchParams.get('attendanceId')

  if (!lessonId || !attendanceId) return fail('Lesson ID and Attendance ID required', 400)

  await connectToDatabase()

  const watchProgress = await RecordingWatchProgress.findOne({
    student: session.userId,
    lesson: lessonId,
    attendance: attendanceId,
  }).lean()

  return ok(watchProgress || { progress: 0, completed: false })
}
