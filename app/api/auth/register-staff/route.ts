import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { hashPassword, setSessionCookie, type Role } from '@/lib/auth'
import { ok, fail } from '@/lib/api'
import { notifyWelcome } from '@/lib/notifications'

const schema = z.object({
  flow: z.enum(['educator', 'admin']),
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().max(2000).optional(),
  code: z.string().min(1),
})

/**
 * Staff self-registration for educators and admins.
 * Gated behind an invite/access code so the public cannot grant themselves
 * staff access. Educators need EDUCATOR_INVITE_CODE; admins need ADMIN_SETUP_CODE.
 * If the relevant code isn't configured on the server, signup is disabled.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('Please check your details and try again.', 422)
  const data = parsed.data

  const expected = data.flow === 'admin' ? process.env.ADMIN_SETUP_CODE : process.env.EDUCATOR_INVITE_CODE
  if (!expected) {
    return fail(
      data.flow === 'admin'
        ? 'Admin signup is not enabled. Ask an existing admin to create your account.'
        : 'Educator signup is not enabled. Please contact an administrator for an invite.',
      403,
    )
  }
  if (data.code !== expected) return fail('That access code is not valid.', 403)

  await connectToDatabase()
  const email = data.email.toLowerCase()
  if (await User.findOne({ email })) return fail('Email already registered', 409)

  const user = await User.create({
    role: data.flow as Role,
    status: 'active',
    email,
    passwordHash: await hashPassword(data.password),
    fullName: data.fullName,
    phone: data.phone,
    country: data.country,
    timezone: data.timezone,
    ...(data.flow === 'educator' && data.bio ? { bio: data.bio } : {}),
  })

  await setSessionCookie({ userId: String(user._id), role: user.role as Role, name: user.fullName, email: user.email })
  await notifyWelcome(user._id, user.fullName)
  return ok({ role: user.role, name: user.fullName })
}
