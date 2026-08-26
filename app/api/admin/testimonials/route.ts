import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Testimonial } from '@/models/Content'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  await connectToDatabase()
  const items = await Testimonial.find().sort({ createdAt: -1 }).lean()
  return ok(items.map((t) => ({ id: String(t._id), authorName: t.authorName, relationship: t.relationship ?? null, quote: t.quote, rating: t.rating ?? null, published: t.published })))
}

const schema = z.object({
  authorName: z.string().min(1),
  relationship: z.string().optional(),
  quote: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  published: z.boolean().default(false),
})

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Provide an author and quote.', 422)
  await connectToDatabase()
  const t = await Testimonial.create(parsed.data)
  return ok({ id: String(t._id) }, { status: 201 })
}

const patchSchema = z.object({
  id: z.string(),
  published: z.boolean().optional(),
  authorName: z.string().optional(),
  relationship: z.string().optional(),
  quote: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, ...update } = parsed.data
  const t = await Testimonial.findByIdAndUpdate(id, update, { new: true }).lean()
  if (!t) return fail('Not found', 404)
  return ok({ id, published: t.published })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('Testimonial ID required', 400)

  await connectToDatabase()
  const t = await Testimonial.findByIdAndDelete(id).lean()
  if (!t) return fail('Testimonial not found', 404)
  return ok({ id })
}

