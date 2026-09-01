import { Schema, model, models, type Model, type Types } from 'mongoose'

export type Role = 'student' | 'parent' | 'educator' | 'admin'
export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'pending' | 'pending_payment'

export interface IUser {
  _id: Types.ObjectId
  role: Role
  adminRole?: 'super' | 'admin' | 'sub'
  status: AccountStatus
  email: string
  passwordHash: string
  fullName: string
  preferredName?: string
  phone?: string
  country?: string
  timezone?: string
  avatarUrl?: string

  // student-specific
  dateOfBirth?: Date
  age?: number
  availability?: string[]
  cohort?: Types.ObjectId | null
  parent?: Types.ObjectId | null // null => independent student
  xp?: number
  level?: number
  streak?: number
  planKey?: string // programme/plan selected for this student

  // educator-specific
  bio?: string
  assignedCohorts?: Types.ObjectId[]

  // password reset
  resetTokenHash?: string
  resetTokenExpires?: Date

  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    role: { type: String, enum: ['student', 'parent', 'educator', 'admin'], required: true, index: true },
    adminRole: { type: String, enum: ['super', 'admin', 'sub'] },
    status: { type: String, enum: ['active', 'suspended', 'deactivated', 'pending', 'pending_payment'], default: 'active', index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, required: true, trim: true },
    preferredName: { type: String, trim: true },
    phone: { type: String, trim: true },
    country: { type: String, trim: true },
    timezone: { type: String, trim: true },
    avatarUrl: { type: String },

    dateOfBirth: { type: Date },
    age: { type: Number },
    availability: [{ type: String }],
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    planKey: { type: String },

    bio: { type: String },
    assignedCohorts: [{ type: Schema.Types.ObjectId, ref: 'Cohort' }],

    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true },
)

export const User: Model<IUser> = models.User || model<IUser>('User', UserSchema)
export default User
