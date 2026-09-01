import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Attendance } from '@/models/Attendance'
import { Cohort } from '@/models/Cohort'
import { User } from '@/models/User'
import { Lesson } from '@/models/Curriculum'
import { awardXp } from '@/lib/xp'
import { sendEmail } from '@/lib/mail'

export async function GET(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const cohortId = searchParams.get('cohortId')
  if (!cohortId) return fail('Cohort ID required', 400)

  await connectToDatabase()

  // Verify educator owns cohort
  const cohort = await Cohort.findOne({ _id: cohortId, educator: session.userId }).lean()
  if (!cohort) return fail('Cohort not found or unauthorized', 403)

  const attendance = await Attendance.find({ cohort: cohortId })
    .populate('student', 'fullName preferredName')
    .sort({ sessionDate: -1 })
    .lean()

  return ok(attendance)
}

const postSchema = z.object({
  cohortId: z.string(),
  sessionDate: z.string(),
  week: z.number().min(1).max(16),
  session: z.number().min(1).max(2),
  pillarId: z.string().optional(),
  moduleId: z.string().optional(),
  customTitle: z.string().optional(),
  meetingLink: z.string().optional(),
  recordingLink: z.string().optional(),
  notifyStudents: z.boolean().optional().default(false),
  records: z.array(
    z.object({
      studentId: z.string(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      note: z.string().optional(),
    })
  ),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { cohortId, sessionDate, week, session: sessionNum, pillarId, moduleId, customTitle, meetingLink, recordingLink, notifyStudents, records } = parsed.data
  await connectToDatabase()

  // Verify educator owns cohort
  const cohort = await Cohort.findOne({ _id: cohortId, educator: session.userId }).lean()
  if (!cohort) return fail('Cohort not found or unauthorized', 403)

  const date = new Date(sessionDate)

  // Update lesson with meeting/recording links if provided
  let updatedLesson = null
  if (pillarId && moduleId && (meetingLink || recordingLink || customTitle)) {
    updatedLesson = await Lesson.findOneAndUpdate(
      { pillar: pillarId, module: moduleId, week },
      {
        $set: {
          ...(customTitle && { customTitle }),
          ...(meetingLink && { meetingLink }),
          ...(recordingLink && { recordingLink }),
          scheduledDate: date,
          scheduledDay: sessionNum === 1 ? 'Saturday' : 'Sunday',
          scheduledTime: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
      },
      { new: true }
    ).lean()
  }

  // Send email notifications to students if requested
  if (notifyStudents && updatedLesson && (meetingLink || scheduledDate)) {
    try {
      // Find all students in this cohort
      const students = await User.find({
        role: 'student',
        status: 'active',
        cohort: cohortId,
      }).select('fullName preferredName email').lean()

      // Send emails to all students
      const emailPromises = students.map((student) =>
        sendEmail({
          to: student.email,
          subject: 'Class Updated - Heritage Club',
          type: 'class_scheduled',
          data: {
            name: student.preferredName || student.fullName,
            classTitle: customTitle || updatedLesson.title,
            date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            week: updatedLesson.week,
            meetingLink: meetingLink || undefined,
          },
        }).catch((err) => console.error(`Failed to send email to ${student.email}:`, err))
      )

      await Promise.allSettled(emailPromises)
    } catch (emailError) {
      console.error('Error sending class notification emails:', emailError)
      // Don't fail the request if emails fail, just log it
    }
  }

  for (const r of records) {
    // Check if this is a new attendance record or status change
    const existing = await Attendance.findOne({
      student: r.studentId,
      cohort: cohortId,
      sessionDate: date,
    }).lean()
    
    const isNew = !existing
    const statusChanged = existing && existing.status !== r.status
    const wasPresent = existing && (existing.status === 'present' || existing.status === 'late')
    const isNowPresent = (r.status === 'present' || r.status === 'late')
    
    // Upsert attendance record with week, session, pillar, and module info
    await Attendance.findOneAndUpdate(
      { student: r.studentId, cohort: cohortId, sessionDate: date },
      {
        $set: {
          status: r.status,
          note: r.note || '',
          markedBy: session.userId,
          week,
          session: sessionNum,
          pillar: pillarId,
          module: moduleId,
        },
      },
      { upsert: true }
    )

    // Award XP for present or late (only if new or changed to present)
    if (isNowPresent && (isNew || statusChanged || !wasPresent)) {
      await awardXp(r.studentId, 20, 'attendance', undefined, `Attended Week ${week} Session ${sessionNum} on ${date.toDateString()}`)
      
      // Update streak - consecutive attendance in weekly sessions
      await updateStreak(r.studentId, cohortId, week, sessionNum)
      
      // Unlock next class based on attendance completion
      await unlockNextClass(r.studentId, cohortId, week, sessionNum)
    }
  }

  return ok({ success: true })
}

// Helper function to update streak based on consecutive attendance
async function updateStreak(studentId: string, cohortId: string, week: number, session: number) {
  const user = await User.findById(studentId).select('streak')
  if (!user) return
  
  // Get previous attendance to check if consecutive
  const previousAttendance = await Attendance.findOne({
    student: studentId,
    cohort: cohortId,
    status: { $in: ['present', 'late'] },
  }).sort({ sessionDate: -1 }).limit(2).lean()
  
  if (previousAttendance && previousAttendance.length > 1) {
    const lastAttended = previousAttendance[1]
    const lastWeek = lastAttended.week
    const lastSession = lastAttended.session
    
    // Check if this is consecutive (next session in sequence)
    const isConsecutive = (week === lastWeek && session === lastSession + 1) || 
                         (week === lastWeek + 1 && session === 1 && lastSession === 2)
    
    if (isConsecutive) {
      user.streak = (user.streak || 0) + 1
      // Award streak bonus XP
      const streakBonus = Math.min(user.streak * 5, 50) // Max 50 XP streak bonus
      if (user.streak > 1) {
        await awardXp(studentId, streakBonus, 'streak_bonus', undefined, `${user.streak} session streak!`)
      }
    } else {
      user.streak = 1 // Reset streak, but count current session
    }
  } else {
    user.streak = 1 // First attendance or no previous attendance
  }
  
  await user.save()
}

// Helper function to unlock next class based on attendance completion
async function unlockNextClass(studentId: string, cohortId: string, week: number, session: number) {
  // Award bonus XP for completing a full week (both sessions)
  if (session === 2) {
    // Check if student attended both sessions this week
    const weekAttendance = await Attendance.find({
      student: studentId,
      cohort: cohortId,
      week: week,
      status: { $in: ['present', 'late'] }
    }).lean()
    
    if (weekAttendance.length === 2) {
      // Completed both sessions for the week - award bonus XP
      await awardXp(studentId, 50, 'weekly_completion', undefined, `Completed Week ${week} both sessions`)
      
      // Unlock next week's content (conceptual - could be implemented with progress tracking)
      // For now, we'll award additional XP for weekly milestones
      if (week % 4 === 0) {
        // Monthly milestone (every 4 weeks)
        await awardXp(studentId, 100, 'monthly_milestone', undefined, `Completed ${week / 4} month(s) of attendance`)
      }
    }
  }
}
