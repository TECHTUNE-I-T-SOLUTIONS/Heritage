import { Schema, model, models, type Model, type Types } from 'mongoose'

export type CohortStatus = 'active' | 'archived' | 'forming'

export interface ICohort {
  _id: Types.ObjectId
  code: string // e.g. HC-09-12-A
  name: string
  minAge: number
  maxAge: number
  capacity: number
  educator?: Types.ObjectId | null
  timezone?: string
  schedule?: string // e.g. "Saturday 6:00 PM"
  meetingLink?: string
  status: CohortStatus
  createdAt: Date
  updatedAt: Date
}

const CohortSchema = new Schema<ICohort>(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    minAge: { type: Number, required: true },
    maxAge: { type: Number, required: true },
    capacity: { type: Number, default: 8 },
    educator: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    timezone: { type: String },
    schedule: { type: String },
    meetingLink: { type: String },
    status: { type: String, enum: ['active', 'archived', 'forming'], default: 'active', index: true },
  },
  { timestamps: true },
)

export const Cohort: Model<ICohort> = models.Cohort || model<ICohort>('Cohort', CohortSchema)
export default Cohort
