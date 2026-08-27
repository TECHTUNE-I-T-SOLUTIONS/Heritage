import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IWaitlist {
  _id: Types.ObjectId
  name: string
  email: string
  role: 'parent' | 'student'
  childrenCount?: number
  parentEmail?: string
  createdAt: Date
  updatedAt: Date
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    role: { type: String, enum: ['parent', 'student'], required: true },
    childrenCount: { type: Number },
    parentEmail: { type: String },
  },
  { timestamps: true },
)

export const Waitlist: Model<IWaitlist> =
  models.Waitlist || model<IWaitlist>('Waitlist', WaitlistSchema)
