import { Schema, model, models, type Model, type Types } from 'mongoose'

export interface IAssessment {
  _id: Types.ObjectId
  student: Types.ObjectId
  cohort: Types.ObjectId
  title: string
  score: number
  maxScore: number
  feedback?: string
  recordedBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    title: { type: String, required: true, trim: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true, default: 100 },
    feedback: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

export const Assessment: Model<IAssessment> =
  models.Assessment || model<IAssessment>('Assessment', AssessmentSchema)
export default Assessment
