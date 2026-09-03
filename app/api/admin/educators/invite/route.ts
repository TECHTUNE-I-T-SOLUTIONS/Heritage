import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { EducatorInvite } from '@/models/EducatorInvite'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/mail'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().optional(),
})

export async function POST(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const user = await User.findById(session.userId).select('fullName').lean()
  if (!user) {
    return fail('User not found', 404)
  }

  const body = await request.json().catch(() => null)
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid payload', 422)

  const { email, fullName } = parsed.data

  const existingUser = await User.findOne({ email }).lean()
  if (existingUser) {
    return fail('A user with this email already exists.', 409)
  }

  // Check for existing active invite
  const existingInvite = await EducatorInvite.findOne({ 
    email, 
    used: false, 
    expiresAt: { $gt: new Date() } 
  }).lean()
  
  if (existingInvite) {
    return fail('An active invite already exists for this email.', 409)
  }

  // Generate an invite code
  const code = crypto.randomBytes(4).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const invite = await EducatorInvite.create({
    email,
    fullName,
    code,
    expiresAt,
    invitedBy: user._id,
  })

  // Send the invite email
  try {
    await sendEmail({
      to: email,
      subject: 'Invitation to Join Heritage Club as an Educator',
      type: 'educator_invite',
      data: { 
        name: fullName || 'Educator', 
        code, 
        email,
        invitedBy: user.fullName || 'Heritage Club Team',
      },
    })
  } catch (err) {
    console.error('Failed to send educator invite email:', err)
    // Don't fail the request if email fails, just log it
  }

  return ok({ id: String(invite._id), code })
}

export async function DELETE(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Invite ID required', 400)

  const deleted = await EducatorInvite.findByIdAndDelete(id).lean()
  if (!deleted) return fail('Invite not found', 404)
  
  return ok({ id })
}
