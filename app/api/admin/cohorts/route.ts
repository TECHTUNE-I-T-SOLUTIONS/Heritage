import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Cohort } from '@/models/Cohort'
import { User } from '@/models/User'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()
  const cohorts = await Cohort.find().sort({ createdAt: -1 }).populate('educator', 'fullName').lean()
  const counts = await User.aggregate<{ _id: unknown; n: number }>([
    { $match: { role: 'student', cohort: { $ne: null } } },
    { $group: { _id: '$cohort', n: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.n]))

  return ok(
    cohorts.map((c) => ({
      id: String(c._id),
      code: c.code,
      name: c.name,
      minAge: c.minAge,
      maxAge: c.maxAge,
      capacity: c.capacity,
      schedule: c.schedule ?? null,
      meetingLink: c.meetingLink ?? null,
      status: c.status,
      educatorName: (c.educator as unknown as { fullName?: string })?.fullName ?? null,
      educatorId: c.educator ? String((c.educator as unknown as { _id: unknown })._id) : null,
      studentCount: countMap.get(String(c._id)) ?? 0,
    })),
  )
}

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  minAge: z.number().int(),
  maxAge: z.number().int(),
  capacity: z.number().int().min(1).default(8),
  schedule: z.string().optional(),
  meetingLink: z.string().optional(),
  timezone: z.string().optional(),
})

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return fail('Provide code, name, and age range.', 422)

  await connectToDatabase()
  const exists = await Cohort.findOne({ code: parsed.data.code }).lean()
  if (exists) return fail('A cohort with that code already exists.', 409)
  const cohort = await Cohort.create(parsed.data)
  return ok({ id: String(cohort._id) }, { status: 201 })
}

const patchSchema = z.object({
  id: z.string(),
  educatorId: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'forming']).optional(),
  schedule: z.string().optional(),
  meetingLink: z.string().optional(),
  name: z.string().optional(),
  code: z.string().optional(),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  capacity: z.number().optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, educatorId, ...rest } = parsed.data
  const update: Record<string, unknown> = { ...rest }
  if (educatorId !== undefined) update.educator = educatorId

  const cohort = await Cohort.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!cohort) return fail('Cohort not found', 404)

  if (educatorId) await User.findByIdAndUpdate(educatorId, { $addToSet: { assignedCohorts: id } })

  return ok({ id })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Cohort ID required', 400)

  await connectToDatabase()
  const cohort = await Cohort.findByIdAndDelete(id).lean()
  if (!cohort) return fail('Cohort not found', 404)
  return ok({ id })
}

