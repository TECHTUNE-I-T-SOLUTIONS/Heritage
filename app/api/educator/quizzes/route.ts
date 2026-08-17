import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Quiz } from '@/models/Quiz'

export async function GET() {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  await connectToDatabase()
  const quizzes = await Quiz.find(session.role === 'educator' ? { createdBy: session.userId } : {})
    .select('title description questions xpReward status')
    .sort({ createdAt: -1 })
    .lean()
  return ok(quizzes.map((q) => ({ id: String(q._id), title: q.title, description: q.description ?? null, questionCount: q.questions.length, xpReward: q.xpReward, status: q.status })))
}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  xpReward: z.number().min(0).default(100),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        points: z.number().min(1).default(1),
      }),
    )
    .min(1),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please provide a title and at least one question.', 422)

  await connectToDatabase()
  const quiz = await Quiz.create({ ...parsed.data, createdBy: session.userId })
  return ok({ id: String(quiz._id) }, { status: 201 })
}
