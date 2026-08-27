import { Schema, model, models, type Model, type Types } from 'mongoose'

export const PLANS = {
  individual: { key: 'individual', label: 'Individual', price: 59, children: 1 },
  family2: { key: 'family2', label: 'Family — 2 Children', price: 109, children: 2 },
  family3: { key: 'family3', label: 'Family — 3 Children', price: 129, children: 3 },
  family4: { key: 'family4', label: 'Family — 4 Children', price: 149, children: 4 },
} as const

export type PlanKey = keyof typeof PLANS
export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'incomplete'

export interface ISubscription {
  _id: Types.ObjectId
  account: Types.ObjectId // parent or independent student user
  planKey: PlanKey
  price: number
  currency: string
  childrenCount: number
  status: SubscriptionStatus
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
  provider?: string
  providerSubscriptionId?: string
  createdAt: Date
  updatedAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    account: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planKey: { type: String, enum: Object.keys(PLANS), required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },
    childrenCount: { type: Number, default: 1 },
    status: { type: String, enum: ['active', 'past_due', 'cancelled', 'incomplete'], default: 'incomplete', index: true },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    provider: { type: String },
    providerSubscriptionId: { type: String },
  },
  { timestamps: true },
)

export type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'refunded'

export interface IPayment {
  _id: Types.ObjectId
  account: Types.ObjectId
  subscription?: Types.ObjectId
  amount: number
  currency: string
  status: PaymentStatus
  invoiceNumber?: string
  provider?: string
  providerPaymentId?: string
  metadata?: Record<string, unknown>
  paidAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    account: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscription: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },
    status: { type: String, enum: ['succeeded', 'pending', 'failed', 'refunded'], default: 'pending', index: true },
    invoiceNumber: { type: String },
    provider: { type: String },
    providerPaymentId: { type: String },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
)

export const Subscription: Model<ISubscription> =
  models.Subscription || model<ISubscription>('Subscription', SubscriptionSchema)
export const Payment: Model<IPayment> = models.Payment || model<IPayment>('Payment', PaymentSchema)
