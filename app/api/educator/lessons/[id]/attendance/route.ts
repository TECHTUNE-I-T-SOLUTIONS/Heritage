import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'
import { Cohort } from '@/models/Cohort'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { id } = await params
  await connectToDatabase()

  // Get the lesson to find week and session
  const lesson = await Lesson.findById(id).select('week session').lean()
  if (!lesson) {
    return fail('Lesson not found', 404)
  }

  // Get educator's cohorts
  const cohorts = await Cohort.find({ educator: session.userId }).select('_id').lean()
  const cohortIds = cohorts.map(c => c._id)

  // Get all attendance records for this week and session, filtered by educator's cohorts
  const attendance = await Attendance.find({ 
    week: lesson.week, 
    session: lesson.session,
    cohort: { $in: cohortIds }
  })
    .populate('student', 'fullName preferredName email')
    .sort({ sessionDate: -1 })
    .lean()

  // Always return an array
  return ok(attendance || [])
}
