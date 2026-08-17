import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Assignment, Submission } from '@/models/Assignment'
import { awardXp } from '@/lib/xp'

const fileSchema = z.object({
  kind: z.enum(['document', 'image', 'video', 'audio', 'link']),
  name: z.string().optional(),
  url: z.string().url(),
})
const schema = z.object({
  note: z.string().max(2000).optional(),
  files: z.array(fileSchema).min(1),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please attach at least one valid file or link.', 422)

  await connectToDatabase()
  const assignment = await Assignment.findById(id).select('dueDate xpReward status').lean()
  if (!assignment || assignment.status !== 'published') return fail('Assignment not found', 404)

  const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false
  const existing = await Submission.findOne({ student: session.userId, assignment: id })
  const firstSubmission = !existing || existing.status === 'draft'

  const doc = await Submission.findOneAndUpdate(
    { student: session.userId, assignment: id },
    {
      note: parsed.data.note,
      files: parsed.data.files,
      status: isLate ? 'late' : 'submitted',
      moderation: 'pending',
      submittedAt: new Date(),
    },
    { upsert: true, new: true },
  ).lean()

  if (firstSubmission) await awardXp(session.userId, assignment.xpReward ?? 150, 'assignment', id)

  return ok({ id: String(doc!._id), status: doc!.status, moderation: doc!.moderation })
}
