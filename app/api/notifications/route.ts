import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Notification } from '@/models/Content'

export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response
  await connectToDatabase()
  const items = await Notification.find({ user: session.userId }).sort({ createdAt: -1 }).limit(50).lean()
  const unread = items.filter((n) => !n.read).length
  return ok({
    unread,
    items: items.map((n) => ({
      id: String(n._id),
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      read: n.read,
      createdAt: n.createdAt,
    })),
  })
}

const schema = z.object({ id: z.string().optional(), all: z.boolean().optional() })

export async function PATCH(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  if (parsed.data.all) {
    await Notification.updateMany({ user: session.userId, read: false }, { read: true })
  } else if (parsed.data.id) {
    await Notification.updateOne({ _id: parsed.data.id, user: session.userId }, { read: true })
  } else {
    return fail('Provide an id or all=true', 422)
  }
  return ok(true)
}
