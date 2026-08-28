import { z } from 'zod'
import { ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Waitlist } from '@/models/Waitlist'
import { sendEmail } from '@/lib/mail'

const postSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['parent', 'student']),
  childrenCount: z.number().optional(),
  parentEmail: z.string().optional(),
  timezone: z.string().optional(),
  whatsappNumber: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid payload', 422)

  await connectToDatabase()

  const { name, email, role, childrenCount, parentEmail, timezone, whatsappNumber } = parsed.data

  const existing = await Waitlist.findOne({ email }).lean()
  if (existing) return fail('You are already registered on our waitlist!', 409)

  const lead = await Waitlist.create({
    name,
    email,
    role,
    childrenCount,
    parentEmail,
    timezone,
    whatsappNumber,
  })

  // Send automated professional waitlist welcome email
  try {
    await sendEmail({
      to: email,
      subject: 'You’re on the list! Welcome to Heritage Club Pre-Launch 🚀',
      type: 'waitlist',
      data: {
        name,
      },
    })
  } catch (err) {
    console.error('Failed to send waitlist auto-welcome email:', err)
  }

  return ok({ id: String(lead._id) })
}
