import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Pillar } from '@/models/Curriculum'

export async function GET() {
  const { response } = await requireAuth()
  if (response) return response

  await connectToDatabase()
  const pillars = await Pillar.find({ status: 'published' }).sort({ order: 1 }).lean()

  return ok(
    pillars.map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
    }))
  )
}
