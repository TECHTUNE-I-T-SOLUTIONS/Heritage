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
  return ok(quizzes.map((q) => ({ id: String(q._id), title: q.title, description: q.description ?? null, questionCount: q.questions.length, xpReward: q.xpReward, status: q.status, questions: q.questions })))

}

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  pillarId: z.string().optional(),
  moduleId: z.string().optional(),
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
  const { pillarId, moduleId, ...quizData } = parsed.data
  const quiz = await Quiz.create({ 
    ...quizData, 
    createdBy: session.userId,
    pillar: pillarId,
    module: moduleId
  })
  return ok({ id: String(quiz._id) }, { status: 201 })
}

const patchSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  xpReward: z.number().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z.array(z.string().min(1)).min(2),
        correctIndex: z.number().int().min(0),
        points: z.number().min(1).default(1),
      }),
    )
    .optional(),
})

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid quiz data', 422)

  await connectToDatabase()
  const { id, ...update } = parsed.data
  const quiz = await Quiz.findOneAndUpdate(
    session.role === 'educator' ? { _id: id, createdBy: session.userId } : { _id: id },
    update,
    { new: true }
  ).lean()

  if (!quiz) return fail('Quiz not found', 404)
  return ok({ id })
}

export async function DELETE(request: Request) {
  const { session, response } = await requireAuth(['educator', 'admin'])
  if (response) return response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Quiz ID required', 400)

  await connectToDatabase()
  const quiz = await Quiz.findOneAndDelete(
    session.role === 'educator' ? { _id: id, createdBy: session.userId } : { _id: id }
  ).lean()

  if (!quiz) return fail('Quiz not found', 404)
  return ok({ id })
}

