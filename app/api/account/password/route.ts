import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { verifyPassword, hashPassword } from '@/lib/auth'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('New password must be at least 8 characters.', 422)

  await connectToDatabase()
  const user = await User.findById(session.userId)
  if (!user) return fail('Not found', 404)

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash)
  if (!valid) return fail('Current password is incorrect.', 400)

  user.passwordHash = await hashPassword(parsed.data.newPassword)
  await user.save()
  return ok(true)
}
