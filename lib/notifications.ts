import { connectToDatabase } from '@/lib/db'
import { Notification } from '@/models'
import type { Types } from 'mongoose'

/**
 * Notifications helper — a lightweight "trigger + insert" layer.
 *
 * Every meaningful action (signup, payment success/failure, feedback, etc.)
 * should call one of these helpers so a row lands in the `notifications`
 * collection for the user, much like a Supabase trigger inserting a record.
 *
 * All helpers are best-effort: a failure to write a notification must never
 * break the underlying action, so errors are swallowed (and logged).
 */

export type NotificationType =
  | 'class_reminder'
  | 'assignment_deadline'
  | 'assignment_feedback'
  | 'quiz_result'
  | 'subscription'
  | 'payment_failed'
  | 'welcome'
  | 'announcement'

type UserId = string | Types.ObjectId

export interface NotifyInput {
  user: UserId
  type: NotificationType
  title: string
  body?: string
  link?: string
}

/** Core insert. Connects to the DB if needed and never throws. */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await connectToDatabase()
    await Notification.create({
      user: input.user,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      read: false,
    })
  } catch (err) {
    console.error('[notifications] failed to insert notification:', err)
  }
}

/** Insert the same notification for several users at once (best-effort). */
export async function notifyMany(users: UserId[], input: Omit<NotifyInput, 'user'>): Promise<void> {
  await Promise.all(users.map((user) => notify({ ...input, user })))
}

// ── Action-specific helpers ──────────────────────────────────────────────

export function notifyWelcome(user: UserId, name: string) {
  return notify({
    user,
    type: 'welcome',
    title: `Welcome to Heritage Club, ${name.split(' ')[0]}! 🎉`,
    body: 'Your account is ready. Complete your membership payment to unlock your dashboard and live classes.',
    link: '/dashboard',
  })
}

export function notifyPaymentSuccess(user: UserId, amountLabel?: string) {
  return notify({
    user,
    type: 'subscription',
    title: 'Payment successful — membership active',
    body: amountLabel
      ? `We received your payment of ${amountLabel}. Your Heritage Club membership is now active.`
      : 'Your payment was received and your Heritage Club membership is now active.',
    link: '/dashboard',
  })
}

export function notifyPaymentFailed(user: UserId) {
  return notify({
    user,
    type: 'payment_failed',
    title: 'Payment could not be completed',
    body: 'Your payment did not go through. You can retry payment any time from your dashboard to activate your membership.',
    link: '/dashboard',
  })
}

export function notifySubscriptionActivated(user: UserId) {
  return notify({
    user,
    type: 'subscription',
    title: 'Membership activated',
    body: 'You now have full access to lessons, quizzes, assignments and live classes.',
    link: '/dashboard',
  })
}
