import { ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { SiteContent } from '@/models/Content'

export async function GET() {
  await connectToDatabase()
  
  let basePrice = 70
  let discounts = [10, 5, 5] // array of discounts for child 2, child 3, child 4

  const doc = await SiteContent.findOne({ key: 'pricing_plans' }).lean()
  if (doc && doc.value && typeof doc.value === 'object') {
    const val = doc.value as { basePrice?: number; discounts?: number[] }
    if (typeof val.basePrice === 'number') basePrice = val.basePrice
    if (Array.isArray(val.discounts)) discounts = val.discounts
  }

  // Calculate pricing lists dynamically
  const plans = [
    { key: 'individual', label: 'Individual', price: basePrice, children: 1, tag: '1 child' },
    { key: 'family2', label: 'Family — 2 Children', price: (basePrice * 2) - (discounts[0] || 0), children: 2, tag: '2 children' },
    { key: 'family3', label: 'Family — 3 Children', price: (basePrice * 3) - (discounts[0] || 0) - (discounts[1] || 0), children: 3, tag: '3 children' },
    { key: 'family4', label: 'Family — 4 Children', price: (basePrice * 4) - (discounts[0] || 0) - (discounts[1] || 0) - (discounts[2] || 0), children: 4, tag: '4 children' },
  ]

  // Add configuration metadata in output
  return ok({
    plans,
    config: {
      basePrice,
      discounts,
    }
  })
}
