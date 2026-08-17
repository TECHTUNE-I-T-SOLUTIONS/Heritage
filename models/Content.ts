import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface ITestimonial {
  _id: Types.ObjectId
  authorName: string
  relationship?: string // e.g. "Parent of two"
  quote: string
  rating?: number
  published: boolean
  createdAt: Date
  updatedAt: Date
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    authorName: { type: String, required: true },
    relationship: { type: String },
    quote: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    published: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

/** Key-value editable site content (hero, about, contact, social, etc.). */
export interface ISiteContent {
  _id: Types.ObjectId
  key: string
  value: unknown
  updatedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const SiteContentSchema = new Schema<ISiteContent>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export interface INotification {
  _id: Types.ObjectId
  user: Types.ObjectId
  type:
    | 'class_reminder'
    | 'assignment_deadline'
    | 'assignment_feedback'
    | 'quiz_result'
    | 'subscription'
    | 'payment_failed'
    | 'welcome'
    | 'announcement'
  title: string
  body?: string
  link?: string
  read: boolean
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'class_reminder',
        'assignment_deadline',
        'assignment_feedback',
        'quiz_result',
        'subscription',
        'payment_failed',
        'welcome',
        'announcement',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
)

export const Testimonial: Model<ITestimonial> =
  models.Testimonial || model<ITestimonial>('Testimonial', TestimonialSchema)
export const SiteContent: Model<ISiteContent> =
  models.SiteContent || model<ISiteContent>('SiteContent', SiteContentSchema)
export const Notification: Model<INotification> =
  models.Notification || model<INotification>('Notification', NotificationSchema)
