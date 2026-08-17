import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { hashPassword } from '@/lib/auth'

/** Read the current student's linked parent (read-only for the student). */
export async function GET() {
  const { session, response } = await requireAuth(['student'])
  if (response) return response
  await connectToDatabase()

  const student = await User.findById(session.userId).select('parent').lean()
  if (!student) return fail('Not found', 404)
  if (!student.parent) return ok({ parent: null })

  const parent = await User.findById(student.parent)
    .select('fullName preferredName email phone country timezone')
    .lean()
  if (!parent) return ok({ parent: null })

  return ok({
    parent: {
      _id: String(parent._id),
      fullName: parent.fullName,
      email: parent.email,
      phone: parent.phone ?? null,
      country: parent.country ?? null,
      timezone: parent.timezone ?? null,
    },
  })
}

const addSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  country: z.string().max(80).optional(),
  timezone: z.string().max(80).optional(),
})

/**
 * A student without a parent adds their parent's details. This creates (or links
 * to an existing) parent account. A random password is set — the parent can use
 * "forgot password" to gain access.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuth(['student'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return fail('Please check the parent details.', 422)
  const data = parsed.data

  await connectToDatabase()
  const student = await User.findById(session.userId)
  if (!student) return fail('Not found', 404)
  if (student.parent) return fail('A parent is already linked to this account.', 409)

  const email = data.email.toLowerCase()
  let parent = await User.findOne({ email })

  if (parent) {
    if (parent.role !== 'parent') return fail('That email belongs to a non-parent account.', 409)
  } else {
    parent = await User.create({
      role: 'parent',
      status: 'active',
      email,
      passwordHash: await hashPassword(Math.random().toString(36).slice(2) + Date.now().toString(36)),
      fullName: data.fullName,
      phone: data.phone,
      country: data.country,
      timezone: data.timezone,
    })
  }

  student.parent = parent._id
  await student.save()

  return ok({
    parent: {
      _id: String(parent._id),
      fullName: parent.fullName,
      email: parent.email,
      phone: parent.phone ?? null,
      country: parent.country ?? null,
      timezone: parent.timezone ?? null,
    },
  })
}
