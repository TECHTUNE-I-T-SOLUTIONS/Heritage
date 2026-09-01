import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IAssignment {
  _id: Types.ObjectId
  title: string
  instructions: string
  pillar?: Types.ObjectId
  module?: Types.ObjectId
  cohort?: Types.ObjectId | null
  createdBy?: Types.ObjectId
  dueDate?: Date
  allowedTypes: string[] // document, image, video, audio, link
  xpReward: number
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true, trim: true },
    instructions: { type: String, required: true },
    pillar: { type: Schema.Types.ObjectId, ref: 'Pillar' },
    module: { type: Schema.Types.ObjectId, ref: 'Module' },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    allowedTypes: [{ type: String }],
    xpReward: { type: Number, default: 150 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
)

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned' | 'late'
export type ModerationStatus = 'pending' | 'approved' | 'flagged' | 'rejected' | 'under_review'

export interface ISubmissionFile {
  kind: 'document' | 'image' | 'video' | 'audio' | 'link'
  name?: string
  url: string
}

export interface ISubmission {
  _id: Types.ObjectId
  assignment: Types.ObjectId
  student: Types.ObjectId
  note?: string
  files: ISubmissionFile[]
  status: SubmissionStatus
  moderation: ModerationStatus
  grade?: number
  feedback?: string
  gradedBy?: Types.ObjectId
  submittedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const SubmissionSchema = new Schema<ISubmission>(
  {
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    note: { type: String },
    files: [
      {
        kind: { type: String, enum: ['document', 'image', 'video', 'audio', 'link'], required: true },
        name: String,
        url: { type: String, required: true },
      },
    ],
    status: { type: String, enum: ['draft', 'submitted', 'graded', 'returned', 'late'], default: 'draft', index: true },
    moderation: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'rejected', 'under_review'],
      default: 'pending',
      index: true,
    },
    grade: { type: Number },
    feedback: { type: String },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    submittedAt: { type: Date },
  },
  { timestamps: true },
)

export const Assignment: Model<IAssignment> = models.Assignment || model<IAssignment>('Assignment', AssignmentSchema)
export const Submission: Model<ISubmission> = models.Submission || model<ISubmission>('Submission', SubmissionSchema)
