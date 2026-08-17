import { z } from 'zod'
import { NextRequest } from 'next/server'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import mongoose from 'mongoose'

/** Read a single child (must belong to the requesting parent). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['parent'])
  if (response) return response
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Not found', 404)

  await connectToDatabase()
  const child = await User.findOne({ _id: id, parent: session.userId, role: 'student' })
    .select('fullName preferredName age timezone availability country')
    .lean()
  if (!child) return fail('Not found', 404)

  return ok({
    _id: String(child._id),
    fullName: child.fullName,
    preferredName: child.preferredName ?? null,
    age: child.age ?? null,
    timezone: child.timezone ?? null,
    country: child.country ?? null,
    availability: child.availability ?? [],
  })
}

const schema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  preferredName: z.string().max(120).optional(),
  age: z.coerce.number().int().min(3).max(19).optional(),
  timezone: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  availability: z.array(z.string()).optional(),
})

/** A parent updates one of their children's details. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireAuth(['parent'])
  if (response) return response
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) return fail('Not found', 404)

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please check the details.', 422)

  await connectToDatabase()
  const child = await User.findOneAndUpdate(
    { _id: id, parent: session.userId, role: 'student' },
    parsed.data,
    { new: true },
  )
    .select('fullName preferredName age timezone country availability')
    .lean()
  if (!child) return fail('Not found', 404)

  return ok({
    _id: String(child._id),
    fullName: child.fullName,
    preferredName: child.preferredName ?? null,
    age: child.age ?? null,
    timezone: child.timezone ?? null,
    country: child.country ?? null,
    availability: child.availability ?? [],
  })
}
