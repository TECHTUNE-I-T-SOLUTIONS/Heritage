'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Users, MailPlus, RefreshCw, Eye, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useApi, apiPost, apiDelete } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge, Card } from '@/components/ui/kit'
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
}

interface Invite {
  id: string
  email: string
  fullName?: string
  code: string
  used: boolean
  expiresAt: string
  createdAt: string
  invitedBy?: string
}

export default function AdminEducatorsPage() {
  const { push } = useToast()
  const [activeTab, setActiveTab] = useState<'educators' | 'invites'>('educators')
  const [inviting, setInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', fullName: '' })
  const [selectedEducator, setSelectedEducator] = useState<Educator | null>(null)
  const [selectedInvite, setSelectedInvite] = useState<Invite | null>(null)
  const [loadingResend, setLoadingResend] = useState(false)
  const [editingEducator, setEditingEducator] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', bio: '', country: '', timezone: '' })

  const { data: educators, loading: loadingEducators, refetch: refetchEducators } = useApi<Educator[]>('/api/admin/users?role=educator')
  const { data: invites, loading: loadingInvites, refetch: refetchInvites } = useApi<Invite[]>('/api/admin/educators/invites')

  async function handleInvite() {
    try {
      await apiPost('/api/admin/educators/invite', {
        email: inviteForm.email,
        fullName: inviteForm.fullName,
      })
      push('Educator invited successfully.')
      setInviting(false)
      setInviteForm({ email: '', fullName: '' })
      refetchInvites()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not send invite', 'error')
    }
  }

  async function handleResendInvite(invite: Invite) {
    setLoadingResend(true)
    try {
      await apiPost('/api/admin/educators/invite/resend', { id: invite.id })
      push('Invite resent successfully.')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not resend invite', 'error')
    } finally {
      setLoadingResend(false)
    }
  }

  async function handleDeleteInvite(invite: Invite) {
    if (!confirm('Are you sure you want to delete this invite?')) return
    try {
      await apiDelete(`/api/admin/educators/invite?id=${invite.id}`)
      push('Invite deleted successfully.')
      setSelectedInvite(null)
      refetchInvites()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete invite', 'error')
    }
  }

  async function handleUpdateEducator() {
    if (!selectedEducator) return
    try {
      await apiPost('/api/admin/users/update', {
        id: selectedEducator.id,
        ...editForm,
      })
      push('Educator updated successfully.')
      setEditingEducator(false)
      setSelectedEducator(null)
      refetchEducators()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update educator', 'error')
    }
  }

  async function handleDeleteEducator(educator: Educator) {
    if (!confirm('Are you sure you want to delete this educator? This action cannot be undone.')) return
    try {
      await apiDelete(`/api/admin/users?id=${educator.id}`)
      push('Educator deleted successfully.')
      setSelectedEducator(null)
      refetchEducators()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete educator', 'error')
    }
  }

  const educatorColumns: Column<Educator>[] = [
    { key: 'fullName', header: 'Educator', render: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge> },
    { key: 'country', header: 'Location', render: (r) => r.country || '—' },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2">
          <button onClick={() => { setSelectedEducator(r); setEditForm({ fullName: r.fullName, bio: r.bio || '', country: r.country || '', timezone: r.timezone || '' }) }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1">
            <Eye className="h-3 w-3" /> View
          </button>
        </div>
      ),
    },
  ]

  type CombinedRow = Educator | Invite

  const combinedEducatorColumns: Column<CombinedRow>[] = [
    { 
      key: 'fullName', 
      header: 'Educator/Invite', 
      render: (r) => {
        if ('code' in r) {
          // It's an invite
          return <div><p className="font-medium">{r.fullName || r.email}</p><p className="text-xs text-muted-foreground">{r.email}</p></div>
        }
        // It's an educator
        return <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div>
      }
    },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => {
        if ('code' in r) {
          // It's an invite
          return r.used ? <Badge tone="success">Accepted</Badge> : new Date(r.expiresAt) < new Date() ? <Badge tone="error">Expired</Badge> : <Badge tone="warning">Pending</Badge>
        }
        // It's an educator
        return <Badge tone={r.status === 'active' ? 'success' : 'warning'}>{r.status}</Badge>
      }
    },
    { 
      key: 'type', 
      header: 'Type', 
      render: (r) => 'code' in r ? <span className="text-xs text-muted-foreground">Invite</span> : <span className="text-xs text-muted-foreground">Educator</span>
    },
    { 
      key: 'date', 
      header: 'Date', 
      render: (r) => formatDate('createdAt' in r ? r.createdAt : r.createdAt)
    },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {('code' in r) ? (
            <>
              {!r.used && new Date(r.expiresAt) > new Date() && (
                <button onClick={() => handleResendInvite(r)} disabled={loadingResend} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1 disabled:opacity-50">
                  <RefreshCw className="h-3 w-3" /> Resend
                </button>
              )}
              <button onClick={() => setSelectedInvite(r)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1">
                <Eye className="h-3 w-3" /> View
              </button>
            </>
          ) : (
            <button onClick={() => { setSelectedEducator(r); setEditForm({ fullName: r.fullName, bio: r.bio || '', country: r.country || '', timezone: r.timezone || '' }) }} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1">
              <Eye className="h-3 w-3" /> View
            </button>
          )}
        </div>
      ),
    },
  ]

  const inviteColumns: Column<Invite>[] = [
    { key: 'email', header: 'Email', render: (r) => <div><p className="font-medium">{r.email}</p><p className="text-xs text-muted-foreground">{r.fullName || 'No name provided'}</p></div> },
    { key: 'code', header: 'Code', render: (r) => <code className="px-2 py-1 bg-muted rounded text-xs">{r.code}</code> },
    { key: 'status', header: 'Status', render: (r) => r.used ? <Badge tone="success">Accepted</Badge> : new Date(r.expiresAt) < new Date() ? <Badge tone="error">Expired</Badge> : <Badge tone="warning">Pending</Badge> },
    { key: 'expiresAt', header: 'Expires', render: (r) => formatDate(r.expiresAt) },
    { key: 'createdAt', header: 'Sent', render: (r) => formatDate(r.createdAt) },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {!r.used && new Date(r.expiresAt) > new Date() && (
            <button onClick={() => handleResendInvite(r)} disabled={loadingResend} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1 disabled:opacity-50">
              <RefreshCw className="h-3 w-3" /> Resend
            </button>
          )}
          <button onClick={() => setSelectedInvite(r)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary flex items-center gap-1">
            <Eye className="h-3 w-3" /> View
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/educators/overview" className="text-sm text-accent hover:underline">
            View Educator Overview →
          </Link>
        </div>
        <button onClick={() => setInviting(true)} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">
          <MailPlus className="h-4 w-4" /> Invite Educator
        </button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-border">
          <button onClick={() => setActiveTab('educators')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'educators' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground'}`}>
            Active Educators ({educators?.length || 0})
          </button>
          <button onClick={() => setActiveTab('invites')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'invites' ? 'border-b-2 border-foreground text-foreground' : 'text-muted-foreground'}`}>
            Pending Invites ({invites?.filter(i => !i.used && new Date(i.expiresAt) > new Date()).length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'educators' ? (
        <>
          <PageHeading eyebrow="Educators" title="Teaching team." description="Educators leading Heritage Club cohorts." />
          {loadingEducators && <Skeleton className="h-64" />}
          {!loadingEducators && educators && invites && (
            <DataTable 
              columns={combinedEducatorColumns} 
              rows={[...educators, ...invites.filter(i => !i.used && new Date(i.expiresAt) > new Date())] as CombinedRow[]} 
              empty={<EmptyState icon={<Users size={20} />} title="No educators or pending invites" description="Educators and pending invites will appear here." />} 
            />
          )}
        </>
      ) : (
        <>
          <PageHeading eyebrow="Invites" title="Pending invitations." description="Track and manage educator invitations." />
          {loadingInvites && <Skeleton className="h-64" />}
          {!loadingInvites && invites && (
            <DataTable columns={inviteColumns} rows={invites} empty={<EmptyState icon={<MailPlus size={20} />} title="No pending invites" description="No educator invitations have been sent yet." />} />
          )}
        </>
      )}

      {/* Invite Modal */}
      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite New Educator" footer={
        <>
          <button onClick={() => setInviting(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleInvite} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Send Invite</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name (Optional)</label>
            <input value={inviteForm.fullName} onChange={(e) => setInviteForm({ ...inviteForm, fullName: e.target.value })} placeholder="Educator's full name" className="w-full rounded-lg border border-border px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input type="email" required value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="educator@example.com" className="w-full rounded-lg border border-border px-4 py-2" />
          </div>
        </div>
      </Modal>

      {/* Educator Detail Modal */}
      <Modal open={!!selectedEducator} onClose={() => { setSelectedEducator(null); setEditingEducator(false) }} title={`Educator: ${selectedEducator?.fullName}`} footer={
        <>
          <button onClick={() => setSelectedEducator(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
          {!editingEducator && <button onClick={() => setEditingEducator(true)} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Edit</button>}
          {editingEducator && <button onClick={handleUpdateEducator} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Save Changes</button>}
        </>
      }>
        {selectedEducator && (
          <div className="space-y-6">
            {editingEducator ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} className="w-full rounded-lg border border-border px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className="w-full rounded-lg border border-border px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <input value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} className="w-full rounded-lg border border-border px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Timezone</label>
                  <input value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} className="w-full rounded-lg border border-border px-4 py-2" />
                </div>
              </div>
            ) : (
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
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <p className="text-sm">{selectedEducator.country || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timezone</p>
                  <p className="text-sm">{selectedEducator.timezone || '—'}</p>
                </div>
                {selectedEducator.bio && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-2">Bio</p>
                    <p className="text-sm text-muted-foreground">{selectedEducator.bio}</p>
                  </div>
                )}
              </div>
            )}
            <div className="pt-4 border-t border-border">
              <button onClick={() => handleDeleteEducator(selectedEducator)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete Educator
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Detail Modal */}
      <Modal open={!!selectedInvite} onClose={() => setSelectedInvite(null)} title="Invite Details" footer={
        <>
          <button onClick={() => setSelectedInvite(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
          {selectedInvite && !selectedInvite.used && new Date(selectedInvite.expiresAt) > new Date() && (
            <button onClick={() => handleResendInvite(selectedInvite)} disabled={loadingResend} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-50">
              {loadingResend ? 'Sending...' : 'Resend Invite'}
            </button>
          )}
        </>
      }>
        {selectedInvite && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium">{selectedInvite.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="text-sm">{selectedInvite.fullName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                <code className="px-2 py-1 bg-muted rounded text-sm">{selectedInvite.code}</code>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                {selectedInvite.used ? <Badge tone="success"><CheckCircle className="h-3 w-3 inline mr-1" /> Accepted</Badge> : new Date(selectedInvite.expiresAt) < new Date() ? <Badge tone="error"><XCircle className="h-3 w-3 inline mr-1" /> Expired</Badge> : <Badge tone="warning"><Clock className="h-3 w-3 inline mr-1" /> Pending</Badge>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Expires</p>
                <p className="text-sm">{formatDate(selectedInvite.expiresAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sent</p>
                <p className="text-sm">{formatDate(selectedInvite.createdAt)}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <button onClick={() => handleDeleteInvite(selectedInvite)} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Delete Invite
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
