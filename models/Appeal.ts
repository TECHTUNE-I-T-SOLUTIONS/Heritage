import { Schema, model, models, type Model, type Types } from 'mongoose'

/** Tracks student progress watching a class recording */
export interface IRecordingWatchProgress {
  _id: Types.ObjectId
  student: Types.ObjectId
  lesson: Types.ObjectId
  attendance: Types.ObjectId // Reference to the attendance record
  progress: number // 0-100 percentage
  completed: boolean
  completedAt?: Date
  lastWatchedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const RecordingWatchProgressSchema = new Schema<IRecordingWatchProgress>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    attendance: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true, index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    lastWatchedAt: { type: Date },
  },
  { timestamps: true },
)
RecordingWatchProgressSchema.index({ student: 1, lesson: 1 }, { unique: true })

/** Absence appeal/pardon request from a student */
export interface IAbsenceAppeal {
  _id: Types.ObjectId
  student: Types.ObjectId
  attendance: Types.ObjectId
  lesson: Types.ObjectId
  cohort: Types.ObjectId
  educator: Types.ObjectId
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  reason?: string
  teacherResponse?: string
  reviewedAt?: Date
  reviewedBy?: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AbsenceAppealSchema = new Schema<IAbsenceAppeal>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    attendance: { type: Schema.Types.ObjectId, ref: 'Attendance', required: true, index: true },
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', required: true },
    educator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'under_review', 'approved', 'rejected'], default: 'pending' },
    reason: { type: String },
    teacherResponse: { type: String },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)
AbsenceAppealSchema.index({ student: 1, attendance: 1 }, { unique: true })

/** Teacher question for an appeal (based on recording) */
export interface IAppealQuestion {
  _id: Types.ObjectId
  appeal: Types.ObjectId
  askedBy: Types.ObjectId // Educator
  question: string
  order: number
  createdAt: Date
}

const AppealQuestionSchema = new Schema<IAppealQuestion>(
  {
    appeal: { type: Schema.Types.ObjectId, ref: 'AbsenceAppeal', required: true, index: true },
    askedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    question: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
)

/** Student answer to an appeal question */
export interface IAppealAnswer {
  _id: Types.ObjectId
  appeal: Types.ObjectId
  question: Types.ObjectId
  answeredBy: Types.ObjectId // Student
  answer: string
  createdAt: Date
  updatedAt: Date
}

const AppealAnswerSchema = new Schema<IAppealAnswer>(
  {
    appeal: { type: Schema.Types.ObjectId, ref: 'AbsenceAppeal', required: true, index: true },
    question: { type: Schema.Types.ObjectId, ref: 'AppealQuestion', required: true, index: true },
    answeredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true },
)
AppealAnswerSchema.index({ appeal: 1, question: 1 }, { unique: true })

export const RecordingWatchProgress: Model<IRecordingWatchProgress> =
  models.RecordingWatchProgress || model<IRecordingWatchProgress>('RecordingWatchProgress', RecordingWatchProgressSchema)
export const AbsenceAppeal: Model<IAbsenceAppeal> =
  models.AbsenceAppeal || model<IAbsenceAppeal>('AbsenceAppeal', AbsenceAppealSchema)
export const AppealQuestion: Model<IAppealQuestion> =
  models.AppealQuestion || model<IAppealQuestion>('AppealQuestion', AppealQuestionSchema)
export const AppealAnswer: Model<IAppealAnswer> =
  models.AppealAnswer || model<IAppealAnswer>('AppealAnswer', AppealAnswerSchema)
