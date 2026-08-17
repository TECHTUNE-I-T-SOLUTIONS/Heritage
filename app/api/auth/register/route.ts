import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User, Subscription, PLANS } from '@/models'
import { hashPassword, setSessionCookie, type Role } from '@/lib/auth'
import { ok, fail } from '@/lib/api'
import { notifyWelcome } from '@/lib/notifications'

const childSchema = z.object({
  fullName: z.string().min(2),
  age: z.coerce.number().int().min(3).max(19),
  dateOfBirth: z.string().optional(),
  preferredName: z.string().optional(),
  timezone: z.string().optional(),
  availability: z.array(z.string()).optional(),
  planKey: z.string().optional(),
})

const schema = z.discriminatedUnion('flow', [
  z.object({
    flow: z.literal('parent'),
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    password: z.string().min(8),
    country: z.string().optional(),
    timezone: z.string().optional(),
    planKey: z.enum(['individual', 'family2', 'family3', 'family4']).default('individual'),
    children: z.array(childSchema).min(1),
  }),
  z.object({
    flow: z.literal('student'),
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    dateOfBirth: z.string().optional(),
    age: z.coerce.number().int().min(3).max(19),
    preferredName: z.string().optional(),
    country: z.string().optional(),
    timezone: z.string().optional(),
    availability: z.array(z.string()).optional(),
  }),
])

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please check your details and try again.', 422, { issues: parsed.error.flatten() })
  const data = parsed.data

  await connectToDatabase()

  const email = data.email.toLowerCase()
  if (await User.findOne({ email })) return fail('Email already registered', 409)

  if (data.flow === 'parent') {
    const parent = await User.create({
      role: 'parent',
      status: 'active',
      email,
      passwordHash: await hashPassword(data.password),
      fullName: data.fullName,
      phone: data.phone,
      country: data.country,
      timezone: data.timezone,
    })
    // Children are created WITHOUT a cohort — an admin assigns each child to an
    // available cohort once payment is confirmed.
    for (const child of data.children) {
      await User.create({
        role: 'student',
        status: 'active',
        email: `${child.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}.${Date.now().toString(36)}@child.heritage.local`,
        passwordHash: await hashPassword(Math.random().toString(36).slice(2)),
        fullName: child.fullName,
        preferredName: child.preferredName,
        age: child.age,
        dateOfBirth: child.dateOfBirth ? new Date(child.dateOfBirth) : undefined,
        timezone: child.timezone ?? data.timezone,
        availability: child.availability,
        parent: parent._id,
        cohort: null,
        planKey: child.planKey ?? data.planKey,
      })
    }
    const plan = PLANS[data.planKey]
    const subscription = await Subscription.create({
      account: parent._id,
      planKey: data.planKey,
      price: plan.price,
      currency: 'CAD',
      childrenCount: data.children.length,
      status: 'incomplete',
    })
    await setSessionCookie({ userId: String(parent._id), role: 'parent' as Role, name: parent.fullName, email: parent.email })
    await notifyWelcome(parent._id, parent.fullName)
    return ok({ role: 'parent', name: parent.fullName, subscriptionId: String(subscription._id) })
  }

  // independent student — no cohort until an admin assigns one
  const student = await User.create({
    role: 'student',
    status: 'active',
    email,
    passwordHash: await hashPassword(data.password),
    fullName: data.fullName,
    preferredName: data.preferredName,
    age: data.age,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    country: data.country,
    timezone: data.timezone,
    availability: data.availability,
    parent: null,
    cohort: null,
    planKey: 'individual',
  })
  const plan = PLANS.individual
  const subscription = await Subscription.create({
    account: student._id,
    planKey: 'individual',
    price: plan.price,
    currency: 'CAD',
    childrenCount: 1,
    status: 'incomplete',
  })
  await setSessionCookie({ userId: String(student._id), role: 'student' as Role, name: student.fullName, email: student.email })
  await notifyWelcome(student._id, student.fullName)
  return ok({ role: 'student', name: student.fullName, subscriptionId: String(subscription._id) })
}
