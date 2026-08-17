import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { ProfilePicture } from '@/models'
import mongoose from 'mongoose'

/** Public read of a user's profile picture binary. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return new Response('Not found', { status: 404 })
  }
  await connectToDatabase()
  const pic = await ProfilePicture.findOne({ user: id }).lean()
  if (!pic) return new Response('Not found', { status: 404 })

  // With .lean(), a Buffer field may come back as a BSON Binary (has .buffer),
  // a Node Buffer, or a serialized { type:'Buffer', data:[...] }. Normalize all.
  const raw = pic.data as unknown as
    | Buffer
    | Uint8Array
    | { buffer: ArrayBufferLike | Uint8Array }
    | { type: 'Buffer'; data: number[] }
  let bytes: Uint8Array
  if (Buffer.isBuffer(raw) || raw instanceof Uint8Array) {
    bytes = new Uint8Array(raw)
  } else if (raw && 'buffer' in raw && raw.buffer) {
    bytes = new Uint8Array(raw.buffer as ArrayBufferLike)
  } else if (raw && 'data' in raw && Array.isArray(raw.data)) {
    bytes = Uint8Array.from(raw.data)
  } else {
    return new Response('Not found', { status: 404 })
  }

  return new Response(bytes, {
    status: 200,
    headers: {
      'Content-Type': pic.contentType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, max-age=300',
    },
  })
}
