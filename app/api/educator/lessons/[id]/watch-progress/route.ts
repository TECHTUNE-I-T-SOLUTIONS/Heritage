import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { RecordingWatchProgress } from '@/models/Appeal'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { id } = await params
  await connectToDatabase()

  // Get educator's cohorts
  const cohorts = await Cohort.find({ educator: session.userId }).select('_id').lean()
  const cohortIds = cohorts.map(c => c._id)

  // Get students in educator's cohorts
  const students = await User.find({
    role: 'student',
    cohort: { $in: cohortIds }
  }).select('_id').lean()
  const studentIds = students.map(s => s._id)

  // Get all watch progress records for this lesson, filtered by educator's students
  const watchProgress = await RecordingWatchProgress.find({ 
    lesson: id,
    student: { $in: studentIds }
  })
    .populate('student', 'fullName preferredName email')
    .sort({ lastWatchedAt: -1 })
    .lean()

  // Always return an array
  return ok(watchProgress || [])
}
