'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Users, Eye, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, Badge, Skeleton, EmptyState } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'

interface Student {
  id: string
  fullName: string
  preferredName: string
  email: string
}

interface AttendanceRecord {
  _id: string
  student: Student & { _id: string }
  status: 'present' | 'absent' | 'late' | 'excused'
  week: number
  session: number
  sessionDate: string
  note: string
}

interface WatchProgress {
  _id: string
  student: Student & { _id: string }
  lesson: string
  progress: number
  completed: boolean
  completedAt: string
  lastWatchedAt: string
}

interface LessonDetails {
  _id: string
  title: string
  customTitle: string
  week: number
  session: number
  recordingLink: string
  scheduledDate: string
  scheduledTime: string
  scheduledDay?: string
}

export default function LessonDetails() {
  const params = useParams()
  const router = useRouter()
  const { push } = useToast()
  
  const [lesson, setLesson] = useState<LessonDetails | null>(null)
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLessonDetails()
  }, [params.id])

  const fetchLessonDetails = async () => {
    try {
      setLoading(true)
      const [lessonRes, attendanceRes, watchRes] = await Promise.all([
        fetch(`/api/educator/lessons/${params.id}`),
        fetch(`/api/educator/lessons/${params.id}/attendance`),
        fetch(`/api/educator/lessons/${params.id}/watch-progress`),
      ])

      if (!lessonRes.ok) throw new Error('Failed to load lesson')
      if (!attendanceRes.ok) throw new Error('Failed to load attendance')
      if (!watchRes.ok) throw new Error('Failed to load watch progress')

      const lessonData = await lessonRes.json()
      const attendanceData = await attendanceRes.json()
      const watchData = await watchRes.json()

      console.log('API Response - Lesson:', lessonData)
      console.log('API Response - Attendance:', attendanceData)
      console.log('API Response - Watch:', watchData)

      // API now returns { data: lesson } format (simplified)
      const lessonObj = lessonData.data || lessonData
      if (!lessonObj) {
        throw new Error('Lesson data not found in response')
      }
      
      setLesson(lessonObj)
      
      // API returns { data: Array } format
      const attendanceArray = Array.isArray(attendanceData.data) ? attendanceData.data : 
                                Array.isArray(attendanceData) ? attendanceData : []
      setAttendance(attendanceArray)
      
      // API returns { data: Array } format
      const watchArray = Array.isArray(watchData.data) ? watchData.data : 
                         Array.isArray(watchData) ? watchData : []
      setWatchProgress(watchArray)
    } catch (err) {
      console.error('Error in fetchLessonDetails:', err)
      setError(err instanceof Error ? err.message : 'Failed to load lesson details')
    } finally {
      setLoading(false)
    }
  }

  const getAttendanceStatus = (studentId: string) => {
    return Array.isArray(attendance) ? attendance.find((a) => a.student._id === studentId) : null
  }

  const getWatchProgress = (studentId: string) => {
    return Array.isArray(watchProgress) ? watchProgress.find((w) => w.student._id === studentId) : null
  }

  const presentCount = Array.isArray(attendance) ? attendance.filter((a) => a.status === 'present' || a.status === 'late').length : 0
  const absentCount = Array.isArray(attendance) ? attendance.filter((a) => a.status === 'absent').length : 0
  const watchedCount = Array.isArray(watchProgress) ? watchProgress.filter((w) => w.completed).length : 0

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="p-6">
        <EmptyState title="Couldn't load lesson details" description={error || 'Lesson not found'} />
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeading
        eyebrow="Lesson Details"
        title={lesson.customTitle || lesson.title}
        description={`Week ${lesson.week}, Session ${lesson.session}`}
        action={
          <button onClick={() => router.back()} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </button>
        }
      />

      {/* Lesson Info */}
      <Card className="mb-6 p-6">
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {lesson.scheduledDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(lesson.scheduledDate).toLocaleDateString()}</span>
            </div>
          )}
          {lesson.scheduledTime && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{lesson.scheduledTime}</span>
            </div>
          )}
          {lesson.recordingLink && (
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Recording available</span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{presentCount}</div>
              <div className="text-sm text-muted-foreground">Present</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{absentCount}</div>
              <div className="text-sm text-muted-foreground">Absent</div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{watchedCount}</div>
              <div className="text-sm text-muted-foreground">Watched Recording</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Student List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Student Attendance & Viewing
        </h3>
        
        {(!Array.isArray(attendance) || attendance.length === 0) && (!Array.isArray(watchProgress) || watchProgress.length === 0) ? (
          <EmptyState title="No data yet" description="Attendance and viewing data will appear here after the class." />
        ) : (
          <div className="space-y-3">
            {Array.isArray(attendance) && attendance.map((record) => {
              const watchRecord = getWatchProgress(record.student._id)
              return (
                <div key={record._id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{record.student.preferredName || record.student.fullName}</div>
                    <div className="text-sm text-muted-foreground">{record.student.email}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge 
                      tone={record.status === 'present' ? 'success' : record.status === 'absent' ? 'danger' : 'neutral'}
                    >
                      {record.status}
                    </Badge>
                    {watchRecord ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">
                          {watchRecord.completed ? 'Watched' : `${Math.round(watchRecord.progress)}%`}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not watched</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
