import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { hashPassword } from '@/lib/auth'
import { ok, fail } from '@/lib/api'
import crypto from 'crypto'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('Enter a valid email.', 422)
  await connectToDatabase()
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
  let devToken: string | undefined
  if (user) {
    const token = crypto.randomBytes(24).toString('hex')
    user.resetTokenHash = await hashPassword(token)
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()
    if (process.env.NODE_ENV !== 'production') devToken = token
  }
  return ok({ sent: true, ...(devToken ? { devToken } : {}) })
}
