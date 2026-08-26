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

const patchSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('pillar'), id: z.string(), title: z.string().optional(), slug: z.string().optional(), description: z.string().optional(), order: z.number().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }),
  z.object({ kind: z.literal('module'), id: z.string(), title: z.string().optional(), description: z.string().optional(), order: z.number().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }),
  z.object({ kind: z.literal('lesson'), id: z.string(), title: z.string().optional(), summary: z.string().optional(), content: z.string().optional(), week: z.number().optional(), xpReward: z.number().optional(), order: z.number().optional(), status: z.enum(['draft', 'published', 'archived']).optional() }),
])

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid curriculum data', 422)

  await connectToDatabase()
  const { kind, id, ...rest } = parsed.data
  let updated
  if (kind === 'pillar') updated = await Pillar.findByIdAndUpdate(id, rest, { new: true }).lean()
  else if (kind === 'module') updated = await Module.findByIdAndUpdate(id, rest, { new: true }).lean()
  else updated = await Lesson.findByIdAndUpdate(id, rest, { new: true }).lean()

  if (!updated) return fail('Item not found', 404)
  return ok({ id, kind })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const { searchParams } = new URL(request.url)
  const kind = searchParams.get('kind')
  const id = searchParams.get('id')

  if (!kind || !id) return fail('Kind and ID required', 400)

  await connectToDatabase()
  let deleted
  if (kind === 'pillar') deleted = await Pillar.findByIdAndDelete(id).lean()
  else if (kind === 'module') deleted = await Module.findByIdAndDelete(id).lean()
  else if (kind === 'lesson') deleted = await Lesson.findByIdAndDelete(id).lean()
  else return fail('Invalid kind', 400)

  if (!deleted) return fail('Item not found', 404)
  return ok({ id })
}

