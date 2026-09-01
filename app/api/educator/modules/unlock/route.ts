import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Module } from '@/models/Curriculum'

const unlockSchema = z.object({
  moduleId: z.string(),
  unlocked: z.boolean(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = unlockSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid parameters', 422)

  const { moduleId, unlocked } = parsed.data
  await connectToDatabase()

  const module = await Module.findById(moduleId)
  if (!module) return fail('Module not found', 404)

  await Module.findByIdAndUpdate(moduleId, { $set: { unlockedByEducator: unlocked } })

  return ok({ success: true })
}
