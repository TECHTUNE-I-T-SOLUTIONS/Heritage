import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { EducatorInvite } from '@/models/EducatorInvite'
import { User } from '@/models/User'
import { sendEmail } from '@/lib/mail'

const schema = z.object({
  id: z.string(),
})

export async function POST(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()

  const invite = await EducatorInvite.findById(parsed.data.id).lean()
  if (!invite) return fail('Invite not found', 404)
  if (invite.used) return fail('This invite has already been used.', 403)

  // Check if it's expired
  if (invite.expiresAt < new Date()) {
    // Extend the expiry by 7 days
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await EducatorInvite.findByIdAndUpdate(invite._id, { expiresAt: invite.expiresAt })
  }

  const inviter = await User.findById(invite.invitedBy).select('fullName').lean()
  if (!inviter) return fail('Inviter not found', 404)

  // Resend the email
  try {
    await sendEmail({
      to: invite.email,
      subject: 'Reminder: Invitation to Join Heritage Club as an Educator',
      type: 'educator_invite',
      data: { 
        name: invite.fullName || 'Educator', 
        code: invite.code, 
        email: invite.email,
        invitedBy: inviter.fullName || 'Heritage Club Team',
      },
    })
  } catch (err) {
    console.error('Failed to resend educator invite email:', err)
    return fail('Failed to send email', 500)
  }

  return ok({ id: String(invite._id), code: invite.code })
}
