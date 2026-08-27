import { z } from 'zod'
import { requireAuth, ok, fail } from '@/lib/api'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'
import { Payment } from '@/models/Billing'
import { SiteContent } from '@/models/Content'
import { hashPassword } from '@/lib/auth'
import { initializeTransaction, paystackConfigured, paystackCurrency } from '@/lib/paystack'
import { convertAmount, roundForCurrency } from '@/lib/fx'

export async function GET() {
  const { session, response } = await requireAuth(['parent'])
  if (response) return response

  await connectToDatabase()
  const children = await User.find({ parent: session.userId, role: 'student' }).select('fullName preferredName email age status cohort').populate('cohort', 'name code').lean()

  return ok(
    children.map((c) => ({
      id: String(c._id),
      fullName: c.fullName,
      preferredName: c.preferredName ?? null,
      email: c.email,
      age: c.age ?? null,
      status: c.status,
      cohortName: (c.cohort as any)?.name ?? null,
      cohortCode: (c.cohort as any)?.code ?? null,
    }))
  )
}

const childSchema = z.object({
  fullName: z.string().min(2),
  preferredName: z.string().optional(),
  email: z.string().min(3), // can be custom unique email/username
  password: z.string().min(8),
  age: z.coerce.number().int().min(3).max(19),
})

export async function POST(request: Request) {
  const { session, response } = await requireAuth(['parent'])
  if (response) return response

  const body = await request.json().catch(() => null)
  const parsed = childSchema.safeParse(body)
  if (!parsed.success) return fail('Invalid details', 422)

  await connectToDatabase()

  const { fullName, preferredName, email, password, age } = parsed.data

  // Clean email/username check
  const checkEmail = email.includes('@') ? email.toLowerCase() : `${email.toLowerCase()}@heritage.local`
  const existing = await User.findOne({ email: checkEmail }).lean()
  if (existing) return fail('Username or email is already taken.', 409)

  // 1. Calculate price dynamically
  let basePrice = 70
  let discounts = [10, 5, 5]

  const pricingDoc = await SiteContent.findOne({ key: 'pricing_plans' }).lean()
  if (pricingDoc?.value && typeof pricingDoc.value === 'object') {
    const val = pricingDoc.value as { basePrice?: number; discounts?: number[] }
    if (typeof val.basePrice === 'number') basePrice = val.basePrice
    if (Array.isArray(val.discounts)) discounts = val.discounts
  }

  // Count existing active or pending children
  const count = await User.countDocuments({ parent: session.userId, role: 'student' })
  let childPrice = basePrice
  if (count === 1) childPrice = basePrice - (discounts[0] || 0)
  else if (count === 2) childPrice = basePrice - (discounts[1] || 0)
  else if (count >= 3) childPrice = basePrice - (discounts[2] || 0)

  // 2. Hash password & create pending child
  const passwordHash = await hashPassword(password)
  const child = await User.create({
    role: 'student',
    status: 'pending_payment',
    email: checkEmail,
    passwordHash,
    fullName,
    preferredName,
    age,
    parent: session.userId,
    cohort: null,
  })

  // 3. Initiate Payment
  const reference = `HC-ADD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase()

  const currency = 'CAD'
  const payment = await Payment.create({
    account: session.userId,
    amount: childPrice,
    currency,
    status: 'pending',
    provider: 'paystack',
    providerPaymentId: reference,
    metadata: {
      studentId: String(child._id),
      parent: session.userId,
    },
  })

  if (!paystackConfigured()) {
    // Payment fallback simulation if keys are missing
    payment.status = 'succeeded'
    payment.paidAt = new Date()
    payment.invoiceNumber = `HC-SIM-${reference}`
    await payment.save()

    child.status = 'active'
    await child.save()

    return ok({ simulated: true, childPrice })
  }

  // Convert price if settlement currency is different
  const chargeCurrency = paystackCurrency()
  const converted = await convertAmount(childPrice, currency, chargeCurrency)
  const chargeAmount = roundForCurrency(converted, chargeCurrency)

  try {
    const init = await initializeTransaction({
      email: session.email || 'parent@heritage.local',
      amount: chargeAmount,
      currency: chargeCurrency,
      reference,
      callbackUrl: `${request.headers.get('origin') || 'http://localhost:3000'}/payment/callback`,
      metadata: {
        paymentId: String(payment._id),
        studentId: String(child._id),
      },
    })
    return ok({ authorizationUrl: init.data.authorization_url, reference, childPrice })
  } catch (err) {
    await Payment.updateOne({ _id: payment._id }, { status: 'failed' })
    await User.deleteOne({ _id: child._id }) // Clean up user if initiation fails
    return fail(err instanceof Error ? err.message : 'Could not initialize payment.', 502)
  }
}
