import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IAdminInvite {
  _id: Types.ObjectId
  email: string
  role: 'super' | 'admin' | 'sub'
  code: string
  used: boolean
  expiresAt: Date
  invitedBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AdminInviteSchema = new Schema<IAdminInvite>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['super', 'admin', 'sub'], required: true },
    code: { type: String, required: true, unique: true, index: true },
    used: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export const AdminInvite: Model<IAdminInvite> = models.AdminInvite || model<IAdminInvite>('AdminInvite', AdminInviteSchema)
export default AdminInvite
