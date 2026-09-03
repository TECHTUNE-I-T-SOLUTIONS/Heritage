import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Lesson } from '@/models/Curriculum'
import { Attendance } from '@/models/Attendance'
import { RecordingWatchProgress } from '@/models/Appeal'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const { id } = await params
  await connectToDatabase()

  // Get specific lesson details
  const lesson = await Lesson.findById(id)
    .select('id title customTitle recordingLink week session')
    .lean()

  if (!lesson || lesson.status !== 'published') {
    return fail('Lesson not found', 404)
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
    lesson: id,
    completed: true,
  }).lean()

  return ok({
    lesson,
    attendanceStatus: attendance?.status || null,
    attendanceId: attendance?._id?.toString() || null,
    recordingWatched: !!watchProgress,
  })
}