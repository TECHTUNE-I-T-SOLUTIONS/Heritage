import { Types } from 'mongoose'
import { User } from '@/models/User'
import { XpEvent, levelFromXp, type XpSource } from '@/models/Gamification'

/** Award XP to a student: records an XpEvent and updates the user's total xp + level. */
export async function awardXp(
  studentId: Types.ObjectId | string,
  amount: number,
  source: XpSource,
  reference?: Types.ObjectId | string,
  note?: string,
) {
  if (amount <= 0) return
  await XpEvent.create({ student: studentId, amount, source, reference, note })
  const user = await User.findById(studentId).select('xp')
  if (!user) return
  const nextXp = (user.xp ?? 0) + amount
  user.xp = nextXp
  user.level = levelFromXp(nextXp)
  await user.save()
}
