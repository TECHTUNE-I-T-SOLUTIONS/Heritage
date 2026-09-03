'use client'

import { useState } from 'react'
import { Users, Calendar, CheckCircle, Clock, BookOpen, TrendingUp, Eye } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, StatCard, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { formatDate } from '@/lib/format'

interface Educator {
  id: string
  fullName: string
  email: string
  status: string
  bio?: string
  createdAt: string
  country?: string
  timezone?: string
  cohortCount?: number
  studentCount?: number
  classesScheduled?: number
  avgAttendance?: number
  totalSessions?: number
}

interface EducatorActivity {
  educatorId: string
  educatorName: string
  recentClasses: Array<{
    id: string
    title: string
    date: string
    attendance: number
    studentCount: number
  }>
  totalStudents: number
  avgAttendance: number
}

export default function EducatorOverview() {
  const { data, loading, error } = useApi<Educator[]>('/api/admin/educators/overview')
  const { push } = useToast()
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(null)
  const [educatorActivity, setEducatorActivity] = useState<EducatorActivity | null>(null)
  const [loadingActivity, setLoadingActivity] = useState(false)

  async function viewEducatorDetails(educator: Educator) {
    setSelectedEducator(educator)
    setLoadingActivity(true)
    try {
      const response = await fetch(`/api/admin/educators/${educator.id}/activity`)
      const activity = await response.json()
      setEducatorActivity(activity)
    } catch (e) {
      push('Failed to load educator activity', 'error')
    } finally {
      setLoadingActivity(false)
    }
  }

  const columns: Column<Educator>[] = [
    { key: 'fullName', header: 'Educator', render: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'country', header: 'Location', render: (r) => r.country || '—' },
    { key: 'studentCount', header: 'Students', render: (r) => r.studentCount ?? 0 },
    { key: 'classesScheduled', header: 'Classes', render: (r) => r.classesScheduled ?? 0 },
    { key: 'avgAttendance', header: 'Avg Attendance', render: (r) => r.avgAttendance ? `${r.avgAttendance}%` : '—' },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => viewEducatorDetails(r)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1">
            <Eye className="h-3 w-3" /> View Details
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        eyebrow="Educator Overview"
        title="Teaching team performance."
        description="Monitor educator activity, class schedules, and student engagement metrics."
      />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load educator data" description={error} />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatCard label="Total Educators" value={data.length} icon={<Users size={18} />} />
            <StatCard label="Active Students" value={data.reduce((sum, e) => sum + (e.studentCount || 0), 0)} icon={<BookOpen size={18} />} />
            <StatCard label="Total Classes" value={data.reduce((sum, e) => sum + (e.classesScheduled || 0), 0)} icon={<Calendar size={18} />} />
            <StatCard label="Avg Attendance" value={`${Math.round(data.reduce((sum, e) => sum + (e.avgAttendance || 0), 0) / Math.max(data.length, 1))}%`} icon={<CheckCircle size={18} />} />
          </div>
          <DataTable columns={columns} rows={data} empty={<EmptyState icon={<Users size={20} />} title="No educators yet" description="Educators will appear here once they join the platform." />} />
        </>
      )}

      {/* Educator Detail Modal */}
      <Modal open={!!selectedEducator} onClose={() => { setSelectedEducator(null); setEducatorActivity(null) }} title={`Educator: ${selectedEducator?.fullName}`} footer={
        <>
          <button onClick={() => setSelectedEducator(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
        </>
      }>
        {selectedEducator && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium">{selectedEducator.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge tone={selectedEducator.status === 'active' ? 'success' : 'warning'}>{selectedEducator.status}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Joined</p>
                <p className="text-sm">{formatDate(selectedEducator.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Students</p>
                <p className="text-sm font-medium">{selectedEducator.studentCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Classes Scheduled</p>
                <p className="text-sm font-medium">{selectedEducator.classesScheduled || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Attendance</p>
                <p className="text-sm font-medium">{selectedEducator.avgAttendance ? `${selectedEducator.avgAttendance}%` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
                <p className="text-sm font-medium">{selectedEducator.totalSessions || 0}</p>
              </div>
            </div>
            {selectedEducator.bio && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Bio</p>
                <p className="text-sm text-muted-foreground">{selectedEducator.bio}</p>
              </div>
            )}
            
            {loadingActivity ? (
              <Skeleton className="h-32" />
            ) : educatorActivity ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Classes</p>
                    <p className="text-2xl font-semibold">{educatorActivity?.recentClasses?.length || 0}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-1">Avg Attendance</p>
                    <p className="text-2xl font-semibold">{educatorActivity?.avgAttendance || 0}%</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-1">Total Students</p>
                    <p className="text-2xl font-semibold">{educatorActivity?.totalStudents || 0}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-3">Recent Classes</p>
                  {!educatorActivity?.recentClasses || educatorActivity.recentClasses?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes scheduled yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {educatorActivity.recentClasses.map((cls) => (
                        <div key={cls.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                          <div>
                            <p className="text-sm font-medium">{cls.title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(cls.date)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{cls.attendance}%</p>
                            <p className="text-xs text-muted-foreground">{cls.studentCount} students</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity data available.</p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
