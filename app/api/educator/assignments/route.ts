import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Assignment } from '@/models/Assignment'

export async function GET() {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  await connectToDatabase()
  const assignments = await Assignment.find(session.role === 'educator' ? { createdBy: session.userId } : {})
    .sort({ createdAt: -1 })
    .lean()
  return ok(
    assignments.map((a) => ({
      id: String(a._id),
      title: a.title,
      instructions: a.instructions,
      dueDate: a.dueDate ?? null,
      allowedTypes: a.allowedTypes,
      xpReward: a.xpReward,
      status: a.status,
    })),
  )
}

const schema = z.object({
  title: z.string().min(1),
  instructions: z.string().min(1),
  dueDate: z.string().optional(),
  allowedTypes: z.array(z.string()).default([]),
  xpReward: z.number().min(0).default(150),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please provide a title and instructions.', 422)

  await connectToDatabase()
  const { dueDate, ...rest } = parsed.data
  const assignment = await Assignment.create({ ...rest, dueDate: dueDate ? new Date(dueDate) : undefined, createdBy: session.userId })
  return ok({ id: String(assignment._id) }, { status: 201 })
}
