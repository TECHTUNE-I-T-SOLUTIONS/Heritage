import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Waitlist } from '@/models/Waitlist'
import { sendEmail } from '@/lib/mail'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()
  const leads = await Waitlist.find().sort({ createdAt: -1 }).lean()
  return ok(
    leads.map((l) => ({
      id: String(l._id),
      name: l.name,
      email: l.email,
      role: l.role,
      childrenCount: l.childrenCount ?? null,
      parentEmail: l.parentEmail ?? null,
      createdAt: l.createdAt,
    }))
  )
}

const postSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()),
  fromAlias: z.enum(['support', 'finance', 'admin', 'hello', 'no-reply']).default('no-reply'),
})

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request payload.', 422)

  const { subject, body: emailBody, recipients, fromAlias } = parsed.data

  await connectToDatabase()
  const leads = await Waitlist.find({ email: { $in: recipients } }).lean()
  const leadMap = new Map(leads.map((l) => [l.email, l.name]))

  try {
    await Promise.all(
      recipients.map((email) => {
        const name = leadMap.get(email) || 'there'
        const personalizedBody = emailBody.replace(/\{\{name\}\}/g, name)
        const personalizedSubject = subject.replace(/\{\{name\}\}/g, name)
        return sendEmail({
          to: email,
          subject: personalizedSubject,
          type: 'marketing',
          data: {
            body: personalizedBody,
          },
          fromAlias,
        })
      })
    )
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to send waitlist emails', 500)
  }

  return ok({ success: true, count: recipients.length })
}

const patchSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['parent', 'student']).optional(),
  childrenCount: z.number().optional(),
  parentEmail: z.string().optional().nullable(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid payload', 422)

  await connectToDatabase()
  const { id, ...data } = parsed.data

  const lead = await Waitlist.findById(id)
  if (!lead) return fail('Lead not found', 404)

  if (data.name !== undefined) lead.name = data.name
  if (data.email !== undefined) lead.email = data.email
  if (data.role !== undefined) lead.role = data.role
  if (data.childrenCount !== undefined) lead.childrenCount = data.childrenCount
  if (data.parentEmail !== undefined) lead.parentEmail = data.parentEmail ?? undefined

  await lead.save()
  return ok({ success: true })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('ID is required', 400)

  await connectToDatabase()
  const res = await Waitlist.findByIdAndDelete(id)
  if (!res) return fail('Lead not found', 404)

  return ok({ success: true })
}
