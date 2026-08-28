import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Cohort } from '@/models/Cohort'

export async function GET(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response

  await connectToDatabase()
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const filter: Record<string, unknown> = role ? { role } : {}

  const users = await User.find(filter).sort({ createdAt: -1 }).select('fullName email role status age xp cohort parent createdAt timezone').lean()
  const cohorts = await Cohort.find().select('code').lean()
  const cohortMap = new Map(cohorts.map((c) => [String(c._id), c.code]))

  return ok(
    users.map((u) => ({
      id: String(u._id),
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      age: u.age ?? null,
      timezone: u.timezone ?? null,
      xp: u.xp ?? 0,
      cohortCode: u.cohort ? cohortMap.get(String(u.cohort)) ?? null : null,
      createdAt: u.createdAt,
    })),
  )
}

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(['active', 'suspended', 'deactivated', 'pending']).optional(),
  cohort: z.string().nullable().optional(),
  fullName: z.string().optional(),
  email: z.string().optional(),
  age: z.number().nullable().optional(),
  xp: z.number().optional(),
})

import { sendEmail } from '@/lib/mail'

export async function PATCH(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid request', 422)

  await connectToDatabase()
  const { id, ...update } = parsed.data
  
  // get old user to see if cohort changes
  const oldUser = await User.findById(id).select('cohort email fullName').lean()
  if (!oldUser) return fail('User not found', 404)
  
  const user = await User.findByIdAndUpdate(id, update, { new: true }).select('status cohort').lean()
  if (!user) return fail('User not found', 404)
    
  if (update.cohort && String(oldUser.cohort) !== String(update.cohort)) {
    const assignedCohort = await Cohort.findById(update.cohort).select('name code meetingLink').lean()
    if (assignedCohort && oldUser.email) {
      await sendEmail({
        to: oldUser.email,
        subject: `Welcome to ${assignedCohort.name}! 🎓`,
        type: 'cohort_assignment',
        data: { name: oldUser.fullName },
        body: `You have been assigned to <strong>${assignedCohort.name} (${assignedCohort.code})</strong>.<br>If a meeting link is available, you can join your classes using this link: <a href="${assignedCohort.meetingLink || '#'}">${assignedCohort.meetingLink || 'Not provided yet'}</a>`
      }).catch(console.error)
    }
  }

  return ok({ id, status: user.status })
}

export async function DELETE(request: Request) {
  const { response } = await requireAuth(['admin'])
  if (response) return response
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return fail('User ID required', 400)

  await connectToDatabase()
  const user = await User.findByIdAndDelete(id).lean()
  if (!user) return fail('User not found', 404)
  return ok({ id })
}

