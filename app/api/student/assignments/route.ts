import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Assignment, Submission } from '@/models/Assignment'

export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  await connectToDatabase()
  const me = await User.findById(session.userId).select('cohort').lean()

  const assignments = await Assignment.find({ status: 'published', $or: [{ cohort: me?.cohort ?? null }, { cohort: null }] })
    .sort({ dueDate: 1 })
    .lean()
  const submissions = await Submission.find({ student: session.userId }).lean()
  const subMap = new Map(submissions.map((s) => [String(s.assignment), s]))

  return ok(
    assignments.map((a) => {
      const s = subMap.get(String(a._id))
      return {
        id: String(a._id),
        title: a.title,
        instructions: a.instructions,
        dueDate: a.dueDate ?? null,
        allowedTypes: a.allowedTypes,
        xpReward: a.xpReward,
        submission: s
          ? { id: String(s._id), status: s.status, moderation: s.moderation, grade: s.grade ?? null, feedback: s.feedback ?? null, files: s.files, note: s.note ?? null }
          : null,
      }
    }),
  )
}
