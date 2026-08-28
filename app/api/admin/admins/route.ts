import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { AdminInvite } from '@/models/AdminInvite'

export async function GET(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const user = await User.findById(session.userId).select('adminRole').lean()
  if (user?.adminRole !== 'super') {
    return fail('Forbidden. Only super admins can manage admins.', 403)
  }

  const admins = await User.find({ role: 'admin' })
    .select('fullName email adminRole status createdAt')
    .sort({ createdAt: -1 })
    .lean()

  const invites = await AdminInvite.find()
    .select('email role code used expiresAt')
    .sort({ createdAt: -1 })
    .lean()

  return ok({
    admins: admins.map((a) => ({
      id: String(a._id),
      fullName: a.fullName,
      email: a.email,
      adminRole: a.adminRole,
      status: a.status,
      createdAt: a.createdAt,
    })),
    invites: invites.map((i) => ({
      id: String(i._id),
      email: i.email,
      role: i.role,
      code: i.code,
      used: i.used,
      expiresAt: i.expiresAt,
    }))
  })
}

export async function DELETE(request: Request) {
  const { response, session } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const user = await User.findById(session.userId).select('adminRole').lean()
  if (user?.adminRole !== 'super') {
    return fail('Forbidden. Only super admins can delete admins.', 403)
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Admin ID required', 400)

  if (String(session.userId) === id) {
    return fail('You cannot delete yourself.', 400)
  }

  await connectToDatabase()
  const deleted = await User.findOneAndDelete({ _id: id, role: 'admin' }).lean()
  if (!deleted) return fail('Admin not found', 404)
  
  return ok({ id })
}
