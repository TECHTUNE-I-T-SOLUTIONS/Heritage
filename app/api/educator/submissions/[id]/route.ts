import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Submission } from '@/models/Assignment'

const schema = z.object({
  grade: z.number().min(0).max(100).optional(),
  feedback: z.string().max(2000).optional(),
  status: z.enum(['submitted', 'graded', 'returned', 'late']).optional(),
  moderation: z.enum(['pending', 'approved', 'flagged', 'rejected', 'under_review']).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid grading data', 422)

  await connectToDatabase()
  const update: Record<string, unknown> = { ...parsed.data, gradedBy: session.userId }
  if (parsed.data.grade != null && !parsed.data.status) update.status = 'graded'

  const doc = await Submission.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!doc) return fail('Submission not found', 404)
  return ok({ id: String(doc._id), status: doc.status, moderation: doc.moderation, grade: doc.grade ?? null })
}
