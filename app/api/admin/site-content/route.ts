import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { SiteContent } from '@/models/Content'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  await connectToDatabase()
  const items = await SiteContent.find().sort({ key: 1 }).lean()
  return ok(items.map((c) => ({ key: c.key, value: c.value, updatedAt: c.updatedAt })))
}

const schema = z.object({ key: z.string().min(1), value: z.unknown() })

export async function PUT(request: Request) {
  const { session, response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Provide a key and value.', 422)

  await connectToDatabase()
  const doc = await SiteContent.findOneAndUpdate(
    { key: parsed.data.key },
    { value: parsed.data.value, updatedBy: session.userId },
    { upsert: true, new: true },
  ).lean()
  return ok({ key: doc!.key, value: doc!.value })
}
