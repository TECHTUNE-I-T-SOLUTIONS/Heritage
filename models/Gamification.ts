import { Schema, model, models, type Model, type Types } from 'mongoose'

export type XpSource =
  | 'lesson'
  | 'quiz'
  | 'quiz_bonus'
  | 'assignment'
  | 'attendance'
  | 'project'
  | 'manual'

export interface IXpEvent {
  _id: Types.ObjectId
  student: Types.ObjectId
  source: XpSource
  amount: number
  reference?: Types.ObjectId
  note?: string
  createdAt: Date
  updatedAt: Date
}

const XpEventSchema = new Schema<IXpEvent>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    source: {
      type: String,
      enum: ['lesson', 'quiz', 'quiz_bonus', 'assignment', 'attendance', 'project', 'manual'],
      required: true,
    },
    amount: { type: Number, required: true },
    reference: { type: Schema.Types.ObjectId },
    note: { type: String },
  },
  { timestamps: true },
)

export interface IAchievement {
  _id: Types.ObjectId
  student: Types.ObjectId
  key: string
  title: string
  description?: string
  icon?: string
  earnedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AchievementSchema = new Schema<IAchievement>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

/** Computes level from total XP. 500 XP per level. */
export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 500) + 1)
}

export function xpForNextLevel(xp: number): { current: number; needed: number; into: number } {
  const level = levelFromXp(xp)
  const base = (level - 1) * 500
  return { current: level, needed: 500, into: xp - base }
}

export const XpEvent: Model<IXpEvent> = models.XpEvent || model<IXpEvent>('XpEvent', XpEventSchema)
export const Achievement: Model<IAchievement> =
  models.Achievement || model<IAchievement>('Achievement', AchievementSchema)
