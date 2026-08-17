import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { awardXp } from '@/lib/xp'

export async function GET() {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  await connectToDatabase()
  const top = await User.find({ role: 'student' }).sort({ xp: -1 }).limit(25).select('fullName preferredName xp level streak').lean()
  return ok(
    top.map((s, i) => ({ rank: i + 1, id: String(s._id), name: s.preferredName || s.fullName, xp: s.xp ?? 0, level: s.level ?? 1, streak: s.streak ?? 0 })),
  )
}

const schema = z.object({ studentId: z.string(), amount: z.number().int(), note: z.string().optional() })

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return fail('Provide a student and XP amount.', 422)
  await connectToDatabase()
  await awardXp(parsed.data.studentId, parsed.data.amount, 'manual', undefined, parsed.data.note)
  return ok(true)
}
