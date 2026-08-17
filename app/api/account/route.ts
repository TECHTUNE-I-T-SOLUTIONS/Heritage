import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response
  await connectToDatabase()
  const user = await User.findById(session.userId)
    .select('-passwordHash -resetTokenHash -resetTokenExpires')
    .lean()
  if (!user) return fail('Not found', 404)
  return ok({ ...user, _id: String(user._id) })
}

const schema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  preferredName: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  timezone: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  availability: z.array(z.string()).optional(),
})

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid profile data.', 422)

  await connectToDatabase()
  const user = await User.findByIdAndUpdate(session.userId, parsed.data, { new: true })
    .select('-passwordHash -resetTokenHash -resetTokenExpires')
    .lean()
  if (!user) return fail('Not found', 404)
  return ok({ ...user, _id: String(user._id) })
}
