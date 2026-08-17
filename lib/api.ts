import { NextResponse } from 'next/server'
import { getSession, type Role, type SessionPayload } from '@/lib/auth'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

/** Require a logged-in session; optionally restrict to specific roles. */
export async function requireAuth(roles?: Role[]): Promise<
  | { session: SessionPayload; response?: never }
  | { session?: never; response: NextResponse }
> {
  const session = await getSession()
  if (!session) return { response: fail('Not authenticated', 401) }
  if (roles && !roles.includes(session.role)) {
    return { response: fail('Forbidden', 403) }
  }
  return { session }
}
