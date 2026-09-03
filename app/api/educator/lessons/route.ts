import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Lesson, Module } from '@/models/Curriculum'
import { sendEmail } from '@/lib/mail'
import { nigeriaToCanada, getCanadaTimezone } from '@/lib/timezone'

const createLessonSchema = z.object({
  moduleId: z.string(),
  title: z.string(),
  customTitle: z.string().optional(),
  week: z.number().min(1).max(16),
  session: z.enum(['1', '2']),
  meetingLink: z.string().optional(),
  recordingLink: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  notifyStudents: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = createLessonSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { moduleId, title, customTitle, week, session: sessionNum, meetingLink, recordingLink, scheduledDate, scheduledTime, notifyStudents } = parsed.data
  await connectToDatabase()

  // Verify module exists
  const module = await Module.findById(moduleId).lean()
  if (!module) return fail('Module not found', 404)

  // Create the lesson
  const lessonData: any = {
    pillar: module.pillar,
    module: moduleId,
    title,
    week,
    session: parseInt(sessionNum),
    xpReward: 50,
  }

  if (customTitle) lessonData.customTitle = customTitle
  if (meetingLink) lessonData.meetingLink = meetingLink
  if (recordingLink) lessonData.recordingLink = recordingLink
  if (scheduledDate) {
    lessonData.scheduledDate = new Date(scheduledDate)
    lessonData.scheduledDay = sessionNum === '2' ? 'Sunday' : 'Saturday'
  }
  if (scheduledTime) lessonData.scheduledTime = scheduledTime

  const lesson = await Lesson.create(lessonData)

  // Send email notifications if requested
  if (notifyStudents && (meetingLink || scheduledDate)) {
    try {
      // Get all active students
      const { User } = await import('@/models/User')
      const { Cohort } = await import('@/models/Cohort')
      
      const cohorts = await Cohort.find({}).select('_id').lean()
      const students = await User.find({
        role: 'student',
        status: 'active',
        cohort: { $in: cohorts.map((c) => c._id) },
      }).select('fullName preferredName email').lean()

      // Convert Nigeria time to Canada time for display in email
      let displayTime = scheduledTime
      let canadaTime = ''
      let timezone = 'WAT'
      if (scheduledTime) {
        try {
          const nigeriaDate = new Date()
          const [hours, minutes] = scheduledTime.split(':').map(Number)
          nigeriaDate.setHours(hours, minutes, 0, 0)
          
          const canadaDate = nigeriaToCanada(nigeriaDate)
          const canadaHours = canadaDate.getHours().toString().padStart(2, '0')
          const canadaMinutes = canadaDate.getMinutes().toString().padStart(2, '0')
          timezone = getCanadaTimezone(canadaDate)
          canadaTime = `${canadaHours}:${canadaMinutes} ${timezone}`
          displayTime = `${scheduledTime} WAT`
        } catch (error) {
          console.error('Error converting timezone:', error)
          displayTime = scheduledTime
          timezone = 'WAT'
        }
      }

      const emailPromises = students.map((student) =>
        sendEmail({
          to: student.email,
          subject: 'New Class Scheduled - Heritage Club',
          type: 'class_scheduled',
          data: {
            name: student.preferredName || student.fullName,
            classTitle: customTitle || title,
            date: scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD',
            time: displayTime || 'TBD',
            canadaTime: canadaTime || undefined,
            timezone: displayTime ? timezone : undefined,
            week,
            session: sessionNum === '1' ? 'Saturday' : 'Sunday',
            meetingLink: meetingLink || undefined,
          },
        }).catch((err) => console.error(`Failed to send email to ${student.email}:`, err))
      )

      await Promise.allSettled(emailPromises)
    } catch (emailError) {
      console.error('Error sending class notification emails:', emailError)
    }
  }

  return ok({ success: true, lessonId: lesson._id })
}

export async function DELETE(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) return fail('Lesson ID required', 400)

  await connectToDatabase()

  const lesson = await Lesson.findByIdAndDelete(id)
  if (!lesson) return fail('Lesson not found', 404)

  return ok({ success: true })
}
