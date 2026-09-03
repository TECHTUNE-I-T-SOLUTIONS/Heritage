import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { Attendance } from '@/models/Attendance'
import { Lesson } from '@/models/Curriculum'

export async function GET() {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  // Get all educators
  const educators = await User.find({ role: 'educator' })
    .select('fullName email status bio createdAt country timezone')
    .sort({ createdAt: -1 })
    .lean()

  // Calculate stats for each educator
  const educatorStats = await Promise.all(
    educators.map(async (educator) => {
      // Get cohorts assigned to this educator
      const cohorts = await Cohort.find({ educator: educator._id }).select('_id').lean()
      const cohortIds = cohorts.map((c) => c._id)

      // Get students in these cohorts
      const studentCount = await User.countDocuments({
        role: 'student',
        cohort: { $in: cohortIds },
        status: 'active',
      })

      // Get lessons scheduled by this educator (lessons with meeting links)
      const classesScheduled = await Lesson.countDocuments({
        meetingLink: { $exists: true, $ne: '' },
        scheduledDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })

      // Get attendance records for this educator's cohorts
      const attendanceRecords = await Attendance.find({
        cohort: { $in: cohortIds },
        status: { $in: ['present', 'late'] },
      }).lean()

      // Calculate average attendance
      const avgAttendance = attendanceRecords.length > 0
        ? Math.round((attendanceRecords.length / (cohortIds.length * 32)) * 100) // Assuming 32 sessions per cohort
        : 0

      return {
        id: String(educator._id),
        fullName: educator.fullName,
        email: educator.email,
        status: educator.status,
        bio: educator.bio,
        createdAt: educator.createdAt,
        country: educator.country,
        timezone: educator.timezone,
        studentCount,
        classesScheduled,
        avgAttendance,
        totalSessions: attendanceRecords.length,
      }
    })
  )

  return ok(educatorStats)
}
