import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Lesson, Module } from '@/models/Curriculum'
import { Cohort } from '@/models/Cohort'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/mail'

const scheduleSchema = z.object({
  lessonId: z.string(),
  customTitle: z.string().optional(),
  meetingLink: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  notifyStudents: z.boolean().optional().default(false),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = scheduleSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { lessonId, customTitle, meetingLink, scheduledDate, scheduledTime, notifyStudents } = parsed.data
  await connectToDatabase()

  const lesson = await Lesson.findById(lessonId)
  if (!lesson) return fail('Lesson not found', 404)

  // Update lesson with scheduling details
  const updateData: any = {}
  if (customTitle !== undefined) updateData.customTitle = customTitle
  if (meetingLink !== undefined) updateData.meetingLink = meetingLink
  if (scheduledDate !== undefined) {
    updateData.scheduledDate = new Date(scheduledDate)
    // Set scheduledDay based on the date
    const date = new Date(scheduledDate)
    const day = date.getDay()
    updateData.scheduledDay = day === 0 ? 'Sunday' : 'Saturday'
  }
  if (scheduledTime !== undefined) updateData.scheduledTime = scheduledTime

  await Lesson.findByIdAndUpdate(lessonId, { $set: updateData })

  // Send email notifications to students if requested
  if (notifyStudents && (meetingLink || scheduledDate)) {
    try {
      // Get the module to find cohorts using this module
      const module = await Module.findById(lesson.module).lean()
      if (module) {
        // Find all cohorts that might have students
        const cohorts = await Cohort.find({}).select('_id code name').lean()
        
        // Find all students in active cohorts
        const students = await User.find({
          role: 'student',
          status: 'active',
          cohort: { $in: cohorts.map((c) => c._id) },
        }).select('fullName preferredName email').lean()

        // Send emails to all students
        const emailPromises = students.map((student) =>
          sendEmail({
            to: student.email,
            subject: 'New Class Scheduled - Heritage Club',
            type: 'class_scheduled',
            data: {
              name: student.preferredName || student.fullName,
              classTitle: customTitle || lesson.title,
              date: scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD',
              time: scheduledTime || 'TBD',
              week: lesson.week,
              meetingLink: meetingLink || undefined,
            },
          }).catch((err) => console.error(`Failed to send email to ${student.email}:`, err))
        )

        await Promise.allSettled(emailPromises)
      }
    } catch (emailError) {
      console.error('Error sending class notification emails:', emailError)
      // Don't fail the request if emails fail, just log it
    }
  }

  return ok({ success: true, emailsSent: notifyStudents })
}
