import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { SiteContent } from '@/models/Content'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()

  let basePrice = 70
  let discounts = [10, 5, 5]
  let launchDate = ''

  const [pricingDoc, launchDoc] = await Promise.all([
    SiteContent.findOne({ key: 'pricing_plans' }).lean(),
    SiteContent.findOne({ key: 'launch_date' }).lean(),
  ])

  if (pricingDoc?.value && typeof pricingDoc.value === 'object') {
    const val = pricingDoc.value as { basePrice?: number; discounts?: number[] }
    if (typeof val.basePrice === 'number') basePrice = val.basePrice
    if (Array.isArray(val.discounts)) discounts = val.discounts
  }

  if (launchDoc?.value && typeof launchDoc.value === 'string') {
    launchDate = launchDoc.value
  }

  return ok({ basePrice, discounts, launchDate })
}

const patchSchema = z.object({
  basePrice: z.number().optional(),
  discounts: z.array(z.number()).optional(),
  launchDate: z.string().optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid payload', 422)

  await connectToDatabase()

  const { basePrice, discounts, launchDate } = parsed.data

  if (basePrice !== undefined || discounts !== undefined) {
    let current = { basePrice: 70, discounts: [10, 5, 5] }
    const doc = await SiteContent.findOne({ key: 'pricing_plans' })
    if (doc?.value && typeof doc.value === 'object') {
      current = { ...current, ...(doc.value as object) }
    }
    if (basePrice !== undefined) current.basePrice = basePrice
    if (discounts !== undefined) current.discounts = discounts

    await SiteContent.findOneAndUpdate(
      { key: 'pricing_plans' },
      { value: current },
      { upsert: true, new: true }
    )
  }

  if (launchDate !== undefined) {
    await SiteContent.findOneAndUpdate(
      { key: 'launch_date' },
      { value: launchDate },
      { upsert: true, new: true }
    )
  }

  return ok({ success: true })
}
