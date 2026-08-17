import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Pillar, Module, Lesson } from '@/models/Curriculum'

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('pillar'), title: z.string().min(1), slug: z.string().min(1), description: z.string().optional(), order: z.number().default(0) }),
  z.object({ kind: z.literal('module'), pillar: z.string(), title: z.string().min(1), description: z.string().optional(), order: z.number().default(0) }),
  z.object({ kind: z.literal('lesson'), pillar: z.string(), module: z.string(), title: z.string().min(1), summary: z.string().optional(), content: z.string().optional(), week: z.number().default(1), xpReward: z.number().default(50) }),
])

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid curriculum data', 422)

  await connectToDatabase()
  const { kind, ...rest } = parsed.data
  let created
  if (kind === 'pillar') created = await Pillar.create(rest)
  else if (kind === 'module') created = await Module.create(rest)
  else created = await Lesson.create({ ...rest, resources: [] })

  return ok({ id: String(created._id), kind }, { status: 201 })
}
