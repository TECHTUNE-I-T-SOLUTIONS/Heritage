import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IEducatorInvite {
  _id: Types.ObjectId
  email: string
  fullName?: string
  code: string
  used: boolean
  expiresAt: Date
  invitedBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const EducatorInviteSchema = new Schema<IEducatorInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    fullName: { type: String, trim: true },
    code: { type: String, required: true, unique: true, index: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export const EducatorInvite: Model<IEducatorInvite> = models.EducatorInvite || model<IEducatorInvite>('EducatorInvite', EducatorInviteSchema)
export default EducatorInvite
