import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const { id } = await params
  const educator = await User.findById(id).select('fullName').lean()
  if (!educator) return fail('Educator not found', 404)

  // Get cohorts assigned to this educator
  const cohorts = await Cohort.find({ educator: id }).select('_id code name').lean()
  const cohortIds = cohorts.map((c) => c._id)

  // Get students in these cohorts
  const totalStudents = await User.countDocuments({
    role: 'student',
    cohort: { $in: cohortIds },
    status: 'active',
  })

  // Get recent classes (lessons with meeting links)
  const recentClasses = await Lesson.find({
    meetingLink: { $exists: true, $ne: '' },
    scheduledDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  })
    .sort({ scheduledDate: -1 })
    .limit(10)
    .select('title scheduledDate')
    .lean()

  // Get attendance for recent classes
  const recentClassesWithAttendance = await Promise.all(
    recentClasses.map(async (lesson) => {
      const attendance = await Attendance.find({
        cohort: { $in: cohortIds },
        sessionDate: lesson.scheduledDate,
        status: { $in: ['present', 'late'] },
      }).lean()

      return {
        id: String(lesson._id),
        title: lesson.title,
        date: lesson.scheduledDate,
        attendance: attendance.length,
        studentCount: totalStudents,
      }
    })
  )

  // Calculate overall average attendance
  const allAttendance = await Attendance.find({
    cohort: { $in: cohortIds },
    status: { $in: ['present', 'late'] },
  }).lean()

  const avgAttendance = allAttendance.length > 0
    ? Math.round((allAttendance.length / (cohortIds.length * 32)) * 100)
    : 0

  return ok({
    educatorId: id,
    educatorName: educator.fullName,
    recentClasses: recentClassesWithAttendance,
    totalStudents,
    avgAttendance,
  })
}
