import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { AdminInvite } from '@/models/AdminInvite'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/mail'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['super', 'admin', 'sub']),
})

export async function POST(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const user = await User.findById(session.userId).select('adminRole').lean()
  if (user?.adminRole !== 'super') {
    return fail('Forbidden. Only super admins can invite new admins.', 403)
  }

  const body = await request.json().catch(() => null)
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid payload', 422)

  const { email, role } = parsed.data

  const existingUser = await User.findOne({ email }).lean()
  if (existingUser) {
    return fail('A user with this email already exists.', 409)
  }

  // Generate an invite code
  const code = crypto.randomBytes(4).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await AdminInvite.create({
    email,
    role,
    code,
    expiresAt,
    invitedBy: user._id,
  })

  // Send the invite email
  try {
    await sendEmail({
      to: email,
      subject: 'You have been invited to Heritage Club',
      type: 'admin_invite',
      data: { name: 'Future Admin', code, email },
      body: `Your invite code is: <strong>${code}</strong><br>Role: ${role.toUpperCase()} Admin`
    })
  } catch (err) {
    console.error('Failed to send admin invite email:', err)
  }

  return ok({ id: String(invite._id) })
}

export async function DELETE(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const user = await User.findById(session.userId).select('adminRole').lean()
  if (user?.adminRole !== 'super') {
    return fail('Forbidden. Only super admins can delete invites.', 403)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Invite ID required', 400)

  const deleted = await AdminInvite.findByIdAndDelete(id).lean()
  if (!deleted) return fail('Invite not found', 404)
  
  return ok({ id })
}
