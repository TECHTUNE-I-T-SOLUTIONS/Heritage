import { Schema, model, models, type Model, type Types } from 'mongoose'

export type PublishStatus = 'draft' | 'published' | 'archived'

/** Top-level pillar: Language, Stories & History, Values & Symbols, Creative Expression */
export interface IPillar {
  _id: Types.ObjectId
  title: string
  slug: string
  description?: string
  icon?: string
  order: number
  status: PublishStatus
  createdAt: Date
  updatedAt: Date
}

const PillarSchema = new Schema<IPillar>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    icon: { type: String },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
  },
  { timestamps: true },
)

export interface IModule {
  _id: Types.ObjectId
  pillar: Types.ObjectId
  title: string
  description?: string
  order: number
  status: PublishStatus
  unlockedByEducator?: boolean // Whether educator has explicitly unlocked this module
  createdAt: Date
  updatedAt: Date
}

const ModuleSchema = new Schema<IModule>(
  {
    pillar: { type: Schema.Types.ObjectId, ref: 'Pillar', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    unlockedByEducator: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export interface ILessonResource {
  kind: 'text' | 'image' | 'pdf' | 'video' | 'audio' | 'link'
  title?: string
  url?: string
  body?: string
}

export interface ILesson {
  _id: Types.ObjectId
  pillar: Types.ObjectId
  module: Types.ObjectId
  week: number
  title: string
  customTitle?: string // Custom title for a specific scheduled class session
  summary?: string
  content?: string
  resources: ILessonResource[]
  xpReward: number
  order: number
  status: PublishStatus
  meetingLink?: string // Google Meet or Zoom link for live class
  recordingLink?: string // Video recording link after class concludes
  scheduledDate?: Date // Date and time when the class is scheduled
  scheduledDay?: 'Saturday' | 'Sunday' // Weekend day for the class
  scheduledTime?: string // Time slot for the class
  createdAt: Date
  updatedAt: Date
}

const LessonSchema = new Schema<ILesson>(
  {
    pillar: { type: Schema.Types.ObjectId, ref: 'Pillar', required: true, index: true },
    module: { type: Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    week: { type: Number, default: 1 },
    title: { type: String, required: true, trim: true },
    customTitle: { type: String, trim: true },
    summary: { type: String },
    content: { type: String },
    resources: [
      {
        kind: { type: String, enum: ['text', 'image', 'pdf', 'video', 'audio', 'link'], required: true },
        title: String,
        url: String,
        body: String,
      },
    ],
    xpReward: { type: Number, default: 50 },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published' },
    meetingLink: { type: String, trim: true },
    recordingLink: { type: String, trim: true },
    scheduledDate: { type: Date },
    scheduledDay: { type: String, enum: ['Saturday', 'Sunday'] },
    scheduledTime: { type: String, trim: true },
  },
  { timestamps: true },
)

/** Tracks a student completing a lesson. */
export interface ILessonProgress {
  _id: Types.ObjectId
  student: Types.ObjectId
  lesson: Types.ObjectId
  completed: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const LessonProgressSchema = new Schema<ILessonProgress>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { timestamps: true },
)
LessonProgressSchema.index({ student: 1, lesson: 1 }, { unique: true })

export const Pillar: Model<IPillar> = models.Pillar || model<IPillar>('Pillar', PillarSchema)
export const Module: Model<IModule> = models.Module || model<IModule>('Module', ModuleSchema)
export const Lesson: Model<ILesson> = models.Lesson || model<ILesson>('Lesson', LessonSchema)
export const LessonProgress: Model<ILessonProgress> =
  models.LessonProgress || model<ILessonProgress>('LessonProgress', LessonProgressSchema)
