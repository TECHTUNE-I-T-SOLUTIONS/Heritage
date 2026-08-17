import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { ok, fail } from '@/lib/api'
import { User } from '@/models/User'
import { Notification } from '@/models/Content'

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(160),
  message: z.string().min(1).max(4000),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Please fill in all fields correctly.', 422)

  const { name, email, subject, message } = parsed.data

  await connectToDatabase()
  const admins = await User.find({ role: 'admin' }).select('_id').lean()

  if (admins.length) {
    await Notification.insertMany(
      admins.map((admin) => ({
        user: admin._id,
        type: 'announcement' as const,
        title: `Contact form: ${subject}`,
        body: `From ${name} (${email}):\n\n${message}`,
        link: '/dashboard/admin',
        read: false,
      })),
    )
  }

  return ok(true)
}
