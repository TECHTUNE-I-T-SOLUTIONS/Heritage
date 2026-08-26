import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'

export async function GET(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const filter: Record<string, unknown> = role ? { role } : {}

  const users = await User.find(filter).sort({ createdAt: -1 }).select('fullName email role status age xp cohort parent createdAt').lean()
  const cohorts = await Cohort.find().select('code').lean()
  const cohortMap = new Map(cohorts.map((c) => [String(c._id), c.code]))

  return ok(
    users.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      age: u.age ?? null,
      xp: u.xp ?? 0,
      cohortCode: u.cohort ? cohortMap.get(String(u.cohort)) ?? null : null,
      createdAt: u.createdAt,
    })),
  )
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'suspended', 'deactivated', 'pending']).optional(),
  cohort: z.string().nullable().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  age: z.number().nullable().optional(),
  xp: z.number().optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, ...update } = parsed.data
  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('status cohort').lean()
  if (!user) return fail('User not found', 404)
  return ok({ id, status: user.status })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('User ID required', 400)

  await connectToDatabase()
  const user = await User.findByIdAndDelete(id).lean()
  if (!user) return fail('User not found', 404)
  return ok({ id })
}

