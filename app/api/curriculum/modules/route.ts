import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Module } from '@/models/Curriculum'

export async function GET(request: Request) {
  const { response } = await requireAuth()
  if (response) return response

  const { searchParams } = new URL(request.url)
  const pillarId = searchParams.get('pillarId')

  await connectToDatabase()
  const query = pillarId ? { pillar: pillarId, status: 'published' } : { status: 'published' }
  const modules = await Module.find(query).sort({ order: 1 }).lean()

  return ok(
    modules.map((m) => ({
      id: String(m._id),
      title: m.title,
      pillar: String(m.pillar),
    }))
  )
}
