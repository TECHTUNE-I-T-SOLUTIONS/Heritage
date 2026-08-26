import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Testimonial } from '@/models/Content'

export async function GET() {
  const { session, response } = await requireAuth()
  if (response) return response

  await connectToDatabase()
  const { User } = await import('@/models/User')
  const user = await User.findById(session.userId).select('fullName').lean()
  if (!user) return fail('User not found', 404)

  const items = await Testimonial.find({ authorName: user.fullName }).sort({ createdAt: -1 }).lean()
  return ok(items.map((t) => ({
    id: String(t._id),
    authorName: t.authorName,
    relationship: t.relationship ?? null,
    quote: t.quote,
    rating: t.rating ?? null,
    published: t.published,
  })))
}


const schema = z.object({
  quote: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Provide testimony text.', 422)

  await connectToDatabase()

  const { User } = await import('@/models/User')
  const user = await User.findById(session.userId).select('fullName role').lean()
  if (!user) return fail('User not found', 404)

  const t = await Testimonial.create({
    authorName: user.fullName,
    relationship: user.role === 'educator' ? 'Educator / Teacher' : 'Student / Learner',
    quote: parsed.data.quote,
    rating: parsed.data.rating || 5,
    published: false,
  })

  // Send email alert to admin
  try {
    const { sendEmail } = await import('@/lib/mail')
    await sendEmail({
      to: 'admin@damzynextgen.app',
      subject: 'New Testimonial Received — Heritage Club',
      type: 'notification',
      data: {
        name: 'Administrator',
        body: `A new testimonial has been submitted by ${user.fullName} (${user.role}). You can review and publish it from the admin testimonials dashboard.`,
        linkUrl: 'https://heritage.damzynextgen.app/dashboard/admin/testimonials',
        linkText: 'Review Testimonials',
      },
    })
  } catch (err) {
    console.error('Failed to send testimonial alert email:', err)
  }

  return ok({ id: String(t._id) }, { status: 201 })
}
