import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { ok, fail } from '@/lib/api'

const schema = z.object({ email: z.string().email(), token: z.string().min(10), password: z.string().min(8) })

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('Please provide a valid token and a password of at least 8 characters.', 422)
  await connectToDatabase()
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
  if (!user || !user.resetTokenHash || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    return fail('This reset link is invalid or has expired.', 400)
  }
  if (!(await verifyPassword(parsed.data.token, user.resetTokenHash))) {
    return fail('This reset link is invalid or has expired.', 400)
  }
  user.passwordHash = await hashPassword(parsed.data.password)
  user.resetTokenHash = undefined
  user.resetTokenExpires = undefined
  await user.save()
  return ok(true)
}
