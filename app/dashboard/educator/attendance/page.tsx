'use client'

import { useState, useMemo } from 'react'
import { Calendar, Users, Award, TrendingUp, Search, CheckCircle, XCircle, Clock, AlertCircle, Edit } from 'lucide-react'
import { useApi, apiPut } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge, Card } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { Select } from '@/components/ui/form'

interface AttendanceRecord {
  _id: string
  student: { fullName: string; preferredName: string }
  cohort: string
  sessionDate: string
  week: number
  session: number
  pillar?: string
  module?: string
  status: 'present' | 'absent' | 'late' | 'excused'
  markedBy?: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface StudentRow {
  id: string
  name: string
  cohortCode: string
  totalSessions: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  attendanceRate: number
  totalXp: number
  streak: number
  level: number
}

interface Cohort { id: string; code: string; name: string }

export default function EducatorAttendance() {
  const { data: cohorts } = useApi<{ cohorts: Cohort[] }>('/api/educator')
  const [selectedCohort, setSelectedCohort] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null)
  const [editForm, setEditForm] = useState({ status: 'present' as const, note: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const { push } = useToast()

  async function updateAttendance() {
    if (!selectedAttendance) return
    setBusy(true)
    try {
      await apiPut('/api/educator/attendance', {
        attendanceId: selectedAttendance._id,
        status: editForm.status,
        note: editForm.note,
      })
      push('Attendance updated successfully.')
      setIsEditing(false)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update attendance', 'error')
    } finally {
      setBusy(false)
    }
  }

  function openEdit() {
    setIsEditing(true)
  }

  function closeEdit() {
    setIsEditing(false)
    if (selectedAttendance) {
      setEditForm({ status: selectedAttendance.status, note: selectedAttendance.note || '' })
    }
  }

  const { data: attendance, loading, error, refetch } = useApi<AttendanceRecord[]>(
    `/api/educator/attendance${selectedCohort ? `?cohortId=${selectedCohort}` : ''}`
  )

  const { data: students } = useApi<StudentRow[]>('/api/educator/students')

  // Process attendance data into student summaries
  const studentSummaries = useMemo(() => {
    if (!students) return []

    const studentMap = new Map<string, StudentRow>()

    // Initialize with student data
    students.forEach((student) => {
      studentMap.set(student.id, {
        id: student.id,
        name: student.name,
        cohortCode: student.cohortCode || '',
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        excusedCount: 0,
        attendanceRate: 0,
        totalXp: student.xp,
        streak: student.streak,
        level: student.level,
      })
    })

    // Add attendance data if available
    if (attendance && attendance.length > 0) {
      attendance.forEach((record) => {
        const studentId = record.student._id.toString()
        const student = studentMap.get(studentId)
        if (student) {
          student.totalSessions++
          if (record.status === 'present') student.presentCount++
          else if (record.status === 'absent') student.absentCount++
          else if (record.status === 'late') student.lateCount++
          else if (record.status === 'excused') student.excusedCount++

          // Calculate attendance rate (present + late) / total
          const attendedSessions = student.presentCount + student.lateCount
          student.attendanceRate = student.totalSessions > 0 
            ? Math.round((attendedSessions / student.totalSessions) * 100) 
            : 0
        }
      })
    }

    return Array.from(studentMap.values())
  }, [attendance, students])

  // Filter based on search and selection
  const filteredStudents = useMemo(() => {
    return studentSummaries.filter((student) => {
      const matchesCohort = !selectedCohort || student.cohortCode === cohorts?.cohorts.find(c => c.id === selectedCohort)?.code
      const matchesStudent = !selectedStudent || student.id === selectedStudent
      const matchesSearch = !searchQuery || student.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCohort && matchesStudent && matchesSearch
    })
  }, [studentSummaries, selectedCohort, selectedStudent, searchQuery, cohorts])

  // Filter attendance records based on date range
  const filteredAttendance = useMemo(() => {
    if (!attendance) return []
    return attendance.filter((record) => {
      const recordDate = new Date(record.sessionDate)
      const startDate = dateRange.start ? new Date(dateRange.start) : null
      const endDate = dateRange.end ? new Date(dateRange.end) : null

      if (startDate && recordDate < startDate) return false
      if (endDate && recordDate > endDate) return false
      return true
    })
  }, [attendance, dateRange])

  const summaryColumns: Column<StudentRow>[] = [
    { key: 'name', header: 'Student' },
    { key: 'cohortCode', header: 'Cohort', render: (r) => r.cohortCode || '—' },
    { 
      key: 'attendanceRate', 
      header: 'Attendance Rate', 
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${r.attendanceRate}%` }}
            />
          </div>
          <span className="text-sm font-medium">{r.attendanceRate}%</span>
        </div>
      )
    },
    { key: 'presentCount', header: 'Present', render: (r) => <span className="text-emerald-600">{r.presentCount}</span> },
    { key: 'absentCount', header: 'Absent', render: (r) => <span className="text-red-600">{r.absentCount}</span> },
    { key: 'lateCount', header: 'Late', render: (r) => <span className="text-amber-600">{r.lateCount}</span> },
    { key: 'totalXp', header: 'Total XP', render: (r) => r.totalXp.toLocaleString() },
    { key: 'streak', header: 'Streak', render: (r) => <span className="font-medium">{r.streak}🔥</span> },
    { key: 'level', header: 'Level', render: (r) => `Lv ${r.level}` },
  ]

  const detailedColumns: Column<AttendanceRecord>[] = [
    { 
      key: 'student', 
      header: 'Student', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          {r.student.preferredName || r.student.fullName}
        </button>
      )
    },
    { 
      key: 'sessionDate', 
      header: 'Date', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          {new Date(r.sessionDate).toLocaleDateString()}
        </button>
      )
    },
    { 
      key: 'week', 
      header: 'Week', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          Week {r.week}
        </button>
      )
    },
    { 
      key: 'session', 
      header: 'Session', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          {r.session === 1 ? 'Saturday' : 'Sunday'}
        </button>
      )
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => {
        const statusConfig = {
          present: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          absent: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          late: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          excused: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
        }
        const config = statusConfig[r.status]
        const Icon = config.icon
        return (
          <button
            onClick={() => {
              setSelectedAttendance(r)
              setEditForm({ status: r.status, note: r.note || '' })
              setIsEditing(false)
            }}
            className="text-left hover:text-primary transition"
          >
            <Badge tone={r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : 'neutral'}>
              <Icon className="h-3 w-3 mr-1" />
              {r.status}
            </Badge>
          </button>
        )
      }
    },
    { 
      key: 'note', 
      header: 'Note', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          {r.note || '—'}
        </button>
      )
    },
    { 
      key: 'createdAt', 
      header: 'Marked On', 
      render: (r) => (
        <button
          onClick={() => {
            setSelectedAttendance(r)
            setEditForm({ status: r.status, note: r.note || '' })
            setIsEditing(false)
          }}
          className="text-left hover:text-primary transition"
        >
          {new Date(r.createdAt).toLocaleDateString()}
        </button>
      )
    },
  ]

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!filteredStudents.length) return null
    
    const totalSessions = filteredStudents.reduce((sum, s) => sum + s.totalSessions, 0)
    const totalPresent = filteredStudents.reduce((sum, s) => sum + s.presentCount, 0)
    const totalAbsent = filteredStudents.reduce((sum, s) => sum + s.absentCount, 0)
    const totalLate = filteredStudents.reduce((sum, s) => sum + s.lateCount, 0)
    const totalXp = filteredStudents.reduce((sum, s) => sum + s.totalXp, 0)
    const avgAttendance = totalSessions > 0 ? Math.round((totalPresent + totalLate) / totalSessions * 100) : 0

    return {
      totalStudents: filteredStudents.length,
      totalSessions,
      totalPresent,
      totalAbsent,
      totalLate,
      totalXp,
      avgAttendance,
    }
  }, [filteredStudents])

  return (
    <>
      <PageHeading
        eyebrow="Attendance Tracking"
        title="Student Attendance & XP"
        description="Monitor attendance patterns, track XP awarded, and view detailed attendance records."
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'summary' ? 'detailed' : 'summary')}
              className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
            >
              {viewMode === 'summary' ? 'View Detailed Records' : 'View Summary'}
            </button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Cohort</label>
            <Select 
              value={selectedCohort} 
              onChange={(e) => setSelectedCohort(e.target.value)}
            >
              <option value="">All Cohorts</option>
              {cohorts?.cohorts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Search Student</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-9 px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range Start</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date Range End</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
            />
          </div>
        </div>
      </Card>

      {/* Overall Statistics */}
      {overallStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Students</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalStudents}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total Sessions</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalSessions}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Present</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{overallStats.totalPresent}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-muted-foreground">Absent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{overallStats.totalAbsent}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Avg Attendance</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.avgAttendance}%</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total XP Awarded</span>
            </div>
            <p className="text-2xl font-bold">{overallStats.totalXp.toLocaleString()}</p>
          </Card>
        </div>
      )}

      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load attendance data" description={error} />}
      
      {!loading && !error && (
        <>
          {viewMode === 'summary' ? (
            <DataTable
              columns={summaryColumns}
              rows={filteredStudents}
              empty={
                <EmptyState
                  icon={<Users size={20} />}
                  title="No attendance data"
                  description="Select a cohort to view attendance statistics."
                />
              }
            />
          ) : (
            <DataTable
              columns={detailedColumns}
              rows={filteredAttendance}
              empty={
                <EmptyState
                  icon={<Calendar size={20} />}
                  title="No attendance records"
                  description="No attendance records found for the selected filters."
                />
              }
            />
          )}
        </>
      )}

      {/* Attendance Detail Modal */}
      <Modal
        open={!!selectedAttendance}
        onClose={() => { setSelectedAttendance(null); setIsEditing(false) }}
        title={isEditing ? "Edit Attendance Record" : "Attendance Details"}
        footer={
          isEditing ? (
            <>
              <button
                onClick={closeEdit}
                disabled={busy}
                className="rounded-full border border-border px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={updateAttendance}
                disabled={busy}
                className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedAttendance(null)}
                className="rounded-full border border-border px-5 py-2.5 text-sm"
              >
                Close
              </button>
              <button
                onClick={openEdit}
                className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
              >
                <Edit size={14} className="inline mr-1" /> Edit
              </button>
            </>
          )
        }
      >
        {selectedAttendance && (
          <div className="space-y-4">
            <div className="bg-secondary/50 p-4 rounded-lg border border-border">
              <p className="text-xs font-semibold mb-3">Attendance Information</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <span className="text-muted-foreground">Student:</span>
                <span className="font-medium">{selectedAttendance.student.preferredName || selectedAttendance.student.fullName}</span>
                <span className="text-muted-foreground">Cohort ID:</span>
                <span className="font-medium">{selectedAttendance.cohort}</span>
                <span className="text-muted-foreground">Session Date:</span>
                <span className="font-medium">{new Date(selectedAttendance.sessionDate).toLocaleDateString()}</span>
                <span className="text-muted-foreground">Week:</span>
                <span className="font-medium">Week {selectedAttendance.week}</span>
                <span className="text-muted-foreground">Session:</span>
                <span className="font-medium">{selectedAttendance.session === 1 ? 'Saturday (Session 1)' : 'Sunday (Session 2)'}</span>
                <span className="text-muted-foreground">Pillar:</span>
                <span className="font-medium">{selectedAttendance.pillar || 'Not specified'}</span>
                <span className="text-muted-foreground">Module:</span>
                <span className="font-medium">{selectedAttendance.module || 'Not specified'}</span>
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">{selectedAttendance.status}</span>
                <span className="text-muted-foreground">Note:</span>
                <span className="font-medium">{selectedAttendance.note || 'No notes'}</span>
                <span className="text-muted-foreground">Marked On:</span>
                <span className="font-medium">{new Date(selectedAttendance.createdAt).toLocaleString()}</span>
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{new Date(selectedAttendance.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-sm font-medium mb-2">Update Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50 appearance-none"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Note</label>
                  <textarea
                    value={editForm.note}
                    onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                    placeholder="Add any notes about this attendance record..."
                    className="min-h-28 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}