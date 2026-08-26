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

export async function notifyWelcome(user: UserId, name: string) {
  // Save notification in database
  await notify({
    user,
    type: 'welcome',
    title: `Welcome to Heritage Club, ${name.split(' ')[0]}! 🎉`,
    body: 'Your account is ready. Complete your membership payment to unlock your dashboard and live classes.',
    link: '/dashboard',
  })

  // Send SMTP Welcome Email
  try {
    const { User } = await import('@/models/User')
    const { sendEmail } = await import('@/lib/mail')
    const u = await User.findById(user).select('email').lean()
    if (u && u.email) {
      await sendEmail({
        to: u.email,
        subject: `Welcome to Heritage Club, ${name.split(' ')[0]}! 🎉`,
        type: 'welcome',
        data: {
          name,
          linkUrl: 'https://heritage.damzynextgen.app/dashboard',
          linkText: 'Go to your Dashboard',
        },
      })
    }
  } catch (err) {
    console.error('Failed to send welcome email:', err)
  }
}

export async function notifyPaymentSuccess(user: UserId, amountLabel?: string) {
  await notify({
    user,
    type: 'subscription',
    title: 'Payment successful — membership active',
    body: amountLabel
      ? `We received your payment of ${amountLabel}. Your Heritage Club membership is now active.`
      : 'Your payment was received and your Heritage Club membership is now active.',
    link: '/dashboard',
  })

  // Send SMTP Payment Invoice Email
  try {
    const { User } = await import('@/models/User')
    const { sendEmail } = await import('@/lib/mail')
    const u = await User.findById(user).select('email fullName').lean()
    if (u && u.email) {
      await sendEmail({
        to: u.email,
        subject: 'Payment Invoice Confirmation — Heritage Club',
        type: 'payment',
        data: {
          name: u.fullName,
          amount: amountLabel || 'Subscription payment',
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        },
        fromAlias: 'finance',
      })
    }
  } catch (err) {
    console.error('Failed to send payment email:', err)
  }
}

export async function notifyPaymentFailed(user: UserId) {
  await notify({
    user,
    type: 'payment_failed',
    title: 'Payment could not be completed',
    body: 'Your payment did not go through. You can retry payment any time from your dashboard to activate your membership.',
    link: '/dashboard',
  })

  // Send SMTP Reminder Email
  try {
    const { User } = await import('@/models/User')
    const { sendEmail } = await import('@/lib/mail')
    const u = await User.findById(user).select('email fullName').lean()
    if (u && u.email) {
      await sendEmail({
        to: u.email,
        subject: 'Action Required: Payment Attempt Failed',
        type: 'reminder',
        data: {
          name: u.fullName,
          body: 'Your membership subscription payment failed or was declined. Please try again from your dashboard to keep your learning uninterrupted.',
          linkUrl: 'https://heritage.damzynextgen.app/dashboard',
          linkText: 'Retry Payment',
        },
        fromAlias: 'finance',
      })
    }
  } catch (err) {
    console.error('Failed to send payment failed email:', err)
  }
}

export async function notifySubscriptionActivated(user: UserId) {
  await notify({
    user,
    type: 'subscription',
    title: 'Membership activated',
    body: 'You now have full access to lessons, quizzes, assignments and live classes.',
    link: '/dashboard',
  })

  // Send SMTP Notification Email
  try {
    const { User } = await import('@/models/User')
    const { sendEmail } = await import('@/lib/mail')
    const u = await User.findById(user).select('email fullName').lean()
    if (u && u.email) {
      await sendEmail({
        to: u.email,
        subject: 'Welcome to Heritage Club — Access Granted!',
        type: 'notification',
        data: {
          name: u.fullName,
          body: 'Your subscription has been successfully activated. You now have full access to our educational material, live tutor classes, assignments, and curriculum modules.',
          linkUrl: 'https://heritage.damzynextgen.app/dashboard',
          linkText: 'Explore Dashboard',
        },
      })
    }
  } catch (err) {
    console.error('Failed to send activation email:', err)
  }
}

