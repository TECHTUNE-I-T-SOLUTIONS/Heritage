import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IQuizQuestion {
  _id?: Types.ObjectId
  prompt: string
  options: string[]
  correctIndex: number
  points: number
}

export interface IQuiz {
  _id: Types.ObjectId
  title: string
  description?: string
  pillar?: Types.ObjectId
  cohort?: Types.ObjectId | null
  createdBy?: Types.ObjectId
  questions: IQuizQuestion[]
  xpReward: number
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}

const QuizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    pillar: { type: Schema.Types.ObjectId, ref: 'Pillar' },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    questions: [
      {
        prompt: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctIndex: { type: Number, required: true },
        points: { type: Number, default: 1 },
      },
    ],
    xpReward: { type: Number, default: 100 },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'published', index: true },
  },
  { timestamps: true },
)

export interface IQuizAttempt {
  _id: Types.ObjectId
  quiz: Types.ObjectId
  student: Types.ObjectId
  answers: number[]
  score: number
  totalPoints: number
  percentage: number
  xpEarned: number
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answers: [{ type: Number }],
    score: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const Quiz: Model<IQuiz> = models.Quiz || model<IQuiz>('Quiz', QuizSchema)
export const QuizAttempt: Model<IQuizAttempt> =
  models.QuizAttempt || model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema)
