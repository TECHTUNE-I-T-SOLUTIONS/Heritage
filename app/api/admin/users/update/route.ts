import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

const schema = z.object({
  id: z.string(),
  fullName: z.string().optional(),
  bio: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
})

export async function POST(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()

  const { id, ...update } = parsed.data
  
  const user = await User.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!user) return fail('User not found', 404)

  return ok({ id: String(user._id) })
}
