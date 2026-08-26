import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { XpEvent, levelFromXp } from '@/models/Gamification'
import { awardXp } from '@/lib/xp'

export async function GET(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')

  await connectToDatabase()

  if (studentId) {
    const events = await XpEvent.find({ student: studentId }).sort({ createdAt: -1 }).lean()
    return ok(
      events.map((e) => ({
        id: String(e._id),
        source: e.source,
        amount: e.amount,
        note: e.note ?? null,
        createdAt: e.createdAt,
      })),
    )
  }

  const top = await User.find({ role: 'student' }).sort({ xp: -1 }).limit(25).select('fullName preferredName xp level streak').lean()
  return ok(
    top.map((s, i) => ({ rank: i + 1, id: String(s._id), name: s.preferredName || s.fullName, xp: s.xp ?? 0, level: s.level ?? 1, streak: s.streak ?? 0 })),
  )
}

const postSchema = z.object({ studentId: z.string(), amount: z.number().int(), note: z.string().optional() })

export async function POST(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return fail('Provide a student and XP amount.', 422)
  await connectToDatabase()
  await awardXp(parsed.data.studentId, parsed.data.amount, 'manual', undefined, parsed.data.note)
  return ok(true)
}

const patchSchema = z.object({
  id: z.string(),
  xp: z.number().int().min(0).optional(),
  streak: z.number().int().min(0).optional(),
  level: z.number().int().min(1).optional(),
})

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, ...update } = parsed.data
  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('xp level streak').lean()
  if (!user) return fail('Student not found', 404)
  return ok(user)
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') // This is the XpEvent ID
  if (!id) return fail('XP Event ID required', 400)

  await connectToDatabase()
  const event = await XpEvent.findByIdAndDelete(id).lean()
  if (!event) return fail('XP Event not found', 404)

  // Recalculate student's total XP and level
  const remainingEvents = await XpEvent.find({ student: event.student }).lean()
  const newXp = remainingEvents.reduce((sum, e) => sum + e.amount, 0)
  const newLevel = levelFromXp(newXp)

  await User.findByIdAndUpdate(event.student, { xp: newXp, level: newLevel })

  return ok({ id })
}

