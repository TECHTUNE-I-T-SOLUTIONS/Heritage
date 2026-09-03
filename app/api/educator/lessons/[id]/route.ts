import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Lesson } from '@/models/Curriculum'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, response } = await requireAuth(['educator'])
  if (response) return response

  const { id } = await params
  await connectToDatabase()

  const lesson = await Lesson.findById(id)
    .select('title customTitle week session recordingLink scheduledDate scheduledTime scheduledDay')
    .lean()

  if (!lesson) {
    return fail('Lesson not found', 404)
  }

  return ok(lesson)
}
