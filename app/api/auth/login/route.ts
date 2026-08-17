import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User, Subscription } from '@/models'
import { verifyPassword, setSessionCookie, type Role } from '@/lib/auth'
import { ok, fail } from '@/lib/api'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('Enter a valid email and password.', 422)
  await connectToDatabase()
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return fail('Incorrect email or password.', 401)
  }
  if (user.status !== 'active') return fail('This account is not active. Please contact support.', 403)

  await setSessionCookie({ userId: String(user._id), role: user.role as Role, name: user.fullName, email: user.email })

  // Members (parents / independent students) must have an active subscription
  // before they can reach the dashboard. If theirs is still incomplete or
  // failed, we still sign them in but flag that payment must be completed —
  // the client then routes them straight back into checkout.
  if (user.role === 'parent' || user.role === 'student') {
    const sub = await Subscription.findOne({ account: user._id }).sort({ createdAt: -1 })
    if (sub && sub.status !== 'active') {
      return ok({
        role: user.role,
        name: user.fullName,
        needsPayment: true,
        subscriptionId: String(sub._id),
        price: sub.price,
        currency: sub.currency,
      })
    }
  }

  return ok({ role: user.role, name: user.fullName, needsPayment: false })
}
