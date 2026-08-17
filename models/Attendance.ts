import { Schema, model, models, type Model, type Types } from 'mongoose'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

/**
 * A live-class attendance record for a student in a cohort session.
 * Sessions are the weekend live classes (see Cohort.schedule / meetingLink);
 * educators mark attendance per session date.
 */
export interface IAttendance {
  _id: Types.ObjectId
  student: Types.ObjectId
  cohort: Types.ObjectId
  sessionDate: Date
  status: AttendanceStatus
  markedBy?: Types.ObjectId | null // educator/admin who recorded it
  note?: string
  createdAt: Date
  updatedAt: Date
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cohort: { type: Schema.Types.ObjectId, ref: 'Cohort', required: true, index: true },
    sessionDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present', index: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true },
  },
  { timestamps: true },
)

// One record per student per session date.
AttendanceSchema.index({ student: 1, sessionDate: 1 }, { unique: true })

export const Attendance: Model<IAttendance> =
  models.Attendance || model<IAttendance>('Attendance', AttendanceSchema)
export default Attendance
