import { NextRequest } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models'
import { hashPassword } from '@/lib/auth'
import { ok, fail } from '@/lib/api'
import { sendEmail } from '@/lib/mail'
import crypto from 'crypto'

const schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return fail('Enter a valid email.', 422)
  await connectToDatabase()
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() })
  let devToken: string | undefined
  if (user) {
    const token = crypto.randomBytes(24).toString('hex')
    user.resetTokenHash = await hashPassword(token)
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()
    
    // Send password reset email
    const portal = user.role === 'educator' ? 'educator' : user.role === 'admin' ? 'admin' : null
    try {
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Heritage Club Password',
        type: 'password_reset',
        data: {
          name: user.preferredName || user.fullName,
          email: user.email,
          resetToken: token,
          portal: portal || undefined,
        },
      })
      console.log(`[Password Reset] Email sent to ${user.email} for role: ${user.role}`)
    } catch (emailError) {
      console.error('[Password Reset] Failed to send email:', emailError)
      // Continue even if email fails - dev token will be available
    }
    
    // Only show dev token in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      devToken = token
      console.log(`[Password Reset] Dev mode - token for ${user.email}: ${token}`)
    }
  } else {
    console.log(`[Password Reset] No user found for email: ${parsed.data.email}`)
  }
  return ok({ sent: true, ...(devToken ? { devToken } : {}) })
}
