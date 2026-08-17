import { Schema, model, models, type Model, type Types } from 'mongoose'

export const ALLOWED_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/jpg'] as const
export const MAX_AVATAR_BYTES = 3 * 1024 * 1024 // 3 MB

/**
 * Profile picture stored directly in MongoDB as binary data.
 * One document per user (upsert on upload). Served via GET /api/avatar/[userId].
 */
export interface IProfilePicture {
  _id: Types.ObjectId
  user: Types.ObjectId
  data: Buffer
  contentType: string
  size: number
  createdAt: Date
  updatedAt: Date
}

const ProfilePictureSchema = new Schema<IProfilePicture>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true, enum: ['image/png', 'image/jpeg', 'image/jpg'] },
    size: { type: Number, required: true },
  },
  { timestamps: true },
)

export const ProfilePicture: Model<IProfilePicture> =
  models.ProfilePicture || model<IProfilePicture>('ProfilePicture', ProfilePictureSchema)
export default ProfilePicture
