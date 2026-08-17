import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User, ProfilePicture, ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES } from '@/models'

/** Upload / replace the current user's profile picture (png/jpg/jpeg, ≤3MB). */
export async function POST(request: Request) {
  const { session, response } = await requireAuth()
  if (response) return response

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || typeof file === 'string') return fail('No image file was provided.', 422)

  const type = (file.type || '').toLowerCase()
  if (!ALLOWED_AVATAR_TYPES.includes(type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return fail('Only PNG, JPG and JPEG images are allowed.', 415)
  }
  if (file.size > MAX_AVATAR_BYTES) return fail('Image is too large. Max size is 3MB.', 413)
  if (file.size === 0) return fail('The image file is empty.', 422)

  const buffer = Buffer.from(await file.arrayBuffer())

  await connectToDatabase()
  await ProfilePicture.findOneAndUpdate(
    { user: session.userId },
    { user: session.userId, data: buffer, contentType: type, size: file.size },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  const avatarUrl = `/api/avatar/${session.userId}?v=${Date.now()}`
  await User.findByIdAndUpdate(session.userId, { avatarUrl })

  return ok({ avatarUrl })
}

/** Remove the current user's profile picture. */
export async function DELETE() {
  const { session, response } = await requireAuth()
  if (response) return response
  await connectToDatabase()
  await ProfilePicture.deleteOne({ user: session.userId })
  await User.findByIdAndUpdate(session.userId, { $unset: { avatarUrl: '' } })
  return ok({ avatarUrl: null })
}
