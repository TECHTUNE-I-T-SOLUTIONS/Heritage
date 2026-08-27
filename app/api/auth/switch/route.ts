import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { setSessionCookie } from '@/lib/auth'

const switchSchema = z.object({
  childId: z.string().optional(),
  action: z.enum(['child', 'parent']).default('child'),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = switchSchema.safeParse(body || {})
  if (!parsed.success) return fail('Invalid parameters', 422)

  await connectToDatabase()

  if (parsed.data.action === 'child') {
    if (session.role !== 'parent') return fail('Only parents can switch into child accounts.', 403)
    const { childId } = parsed.data
    if (!childId) return fail('Child ID is required.', 400)

    const child = await User.findOne({ _id: childId, parent: session.userId, role: 'student' }).lean()
    if (!child) return fail('Child account not found or access denied.', 404)

    // Log in as child, retaining parent return reference in session payload
    await setSessionCookie({
      userId: String(child._id),
      role: 'student',
      name: child.fullName,
      email: child.email,
      switchedFromParentId: session.userId,
      switchedFromParentName: session.name,
      switchedFromParentEmail: session.email,
    })

    return ok({ role: 'student', name: child.fullName })
  } else {
    // Switch back to Parent profile using retained session info
    if (!session.switchedFromParentId) {
      return fail('No parent session reference found to switch back to.', 400)
    }

    await setSessionCookie({
      userId: String(session.switchedFromParentId),
      role: 'parent',
      name: String(session.switchedFromParentName || 'Parent'),
      email: String(session.switchedFromParentEmail || ''),
    })

    return ok({ role: 'parent', name: String(session.switchedFromParentName) })
  }
}
