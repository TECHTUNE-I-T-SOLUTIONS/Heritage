import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'
import { sendEmail } from '@/lib/mail'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  const [users, cohorts] = await Promise.all([
    User.find().select('fullName email role').lean(),
    Cohort.find().select('code name').lean(),
  ])

  return ok({
    users: users.map((u) => ({
      id: String(u._id),
      email: u.email,
      fullName: u.fullName,
      role: u.role,
    })),
    cohorts: cohorts.map((c) => ({
      id: String(c._id),
      code: c.code,
      name: c.name,
    })),
  })
}

const postSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  recipients: z.array(z.string().email()),
  fromAlias: z.enum(['support', 'finance', 'admin', 'hello', 'no-reply']).default('no-reply'),
  attachments: z.array(
    z.object({
      filename: z.string(),
      base64: z.string(),
      contentType: z.string().optional(),
    })
  ).optional(),
})

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request payload.', 422)

  const { subject, body: emailBody, recipients, fromAlias, attachments } = parsed.data

  // Format attachments for nodemailer
  const nodemailerAttachments = attachments?.map((att) => ({
    filename: att.filename,
    content: Buffer.from(att.base64, 'base64'),
    contentType: att.contentType,
  }))

  // Send emails in bulk/individually
  // For Zoho SMTP, it is best to send individually to personalize and prevent spam flags
  try {
    await Promise.all(
      recipients.map((email) =>
        sendEmail({
          to: email,
          subject,
          type: 'marketing',
          data: {
            body: emailBody,
          },
          fromAlias,
          attachments: nodemailerAttachments,
        })
      )
    )
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Failed to send bulk emails', 500)
  }

  return ok({ success: true, count: recipients.length })
}
