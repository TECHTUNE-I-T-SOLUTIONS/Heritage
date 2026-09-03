import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { EducatorInvite } from '@/models/EducatorInvite'

export async function GET() {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const invites = await EducatorInvite.find()
    .populate('invitedBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean()

  return ok(invites.map((invite) => ({
    id: String(invite._id),
    email: invite.email,
    fullName: invite.fullName,
    code: invite.code,
    used: invite.used,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    invitedBy: (invite.invitedBy as any)?.fullName,
  })))
}
