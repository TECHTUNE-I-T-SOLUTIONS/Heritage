import { requireAuth, ok } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { Submission } from '@/models/Assignment'

export async function GET(request: Request) {
  const { response } = await requireAuth(['educator', 'admin'])
  if (response) return response

  await connectToDatabase()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const filter: Record<string, unknown> = status ? { status } : {}

  const submissions = await Submission.find(filter)
    .populate('student', 'fullName preferredName')
    .populate('assignment', 'title xpReward')
    .sort({ submittedAt: -1 })
    .lean()

  return ok(
    submissions.map((s) => ({
      id: String(s._id),
      studentName: (s.student as unknown as { preferredName?: string; fullName?: string })?.preferredName || (s.student as unknown as { fullName?: string })?.fullName || 'Student',
      assignmentTitle: (s.assignment as unknown as { title?: string })?.title ?? 'Assignment',
      status: s.status,
      moderation: s.moderation,
      grade: s.grade ?? null,
      feedback: s.feedback ?? null,
      note: s.note ?? null,
      files: s.files,
      submittedAt: s.submittedAt ?? null,
    })),
  )
}
