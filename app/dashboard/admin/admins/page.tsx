'use client'

import { useState } from 'react'
import { ShieldCheck, Mail, Plus } from 'lucide-react'
import { useApi, apiPost, apiDelete } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, useToast, Modal } from '@/components/ui/interactive'
import { Field, Input, Select } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface AdminRow extends Record<string, unknown> {
  id: string
  fullName: string
  email: string
  adminRole: string
  status: string
  createdAt: string
}

interface InviteRow extends Record<string, unknown> {
  id: string
  email: string
  role: string
  code: string
  used: boolean
  expiresAt: string
}

const statusTone = (s: string) => (s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'suspended' ? 'error' : 'neutral')

export default function AdminsPage() {
  const { data, loading, error, refetch } = useApi<{ admins: AdminRow[], invites: InviteRow[] }>('/api/admin/admins')
  const { push } = useToast()
  
  const [inviting, setInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'admin' })
  const [busy, setBusy] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingInvite, setDeletingInvite] = useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await apiPost('/api/admin/admins/invite', inviteForm)
      push('Invitation sent successfully!')
      setInviting(false)
      setInviteForm({ email: '', role: 'admin' })
      refetch()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not send invite', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(id: string) {
    setBusy(true)
    try {
      await apiDelete(`/api/admin/admins?id=${id}`)
      push('Admin deleted.')
      setDeleting(null)
      refetch()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not delete admin', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function handleDeleteInvite(id: string) {
    setBusy(true)
    try {
      await apiDelete(`/api/admin/admins/invite?id=${id}`)
      push('Invitation revoked.')
      setDeletingInvite(null)
      refetch()
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not revoke invite', 'error')
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<AdminRow>[] = [
    { key: 'fullName', header: 'Name', render: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    { key: 'adminRole', header: 'Role', render: (r) => <span className="capitalize">{r.adminRole || 'Admin'}</span> },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setDeleting(r.id)}
            className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 text-xs"
          >
            Revoke Access
          </button>
        </div>
      ),
    },
  ]

  const inviteColumns: Column<InviteRow>[] = [
    { key: 'email', header: 'Email', render: (r) => <span className="font-medium">{r.email}</span> },
    { key: 'role', header: 'Role', render: (r) => <span className="capitalize">{r.role}</span> },
    { key: 'code', header: 'Code', render: (r) => <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{r.code}</code> },
    { key: 'expiresAt', header: 'Expires', render: (r) => formatDate(r.expiresAt) },
    { key: 'used', header: 'Status', render: (r) => <Badge tone={r.used ? 'success' : 'warning'}>{r.used ? 'Used' : 'Pending'}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2 flex-wrap sm:flex-nowrap">
          {!r.used && (
            <button
              onClick={() => setDeletingInvite(r.id)}
              className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 text-xs"
            >
              Revoke
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeading eyebrow="Management" title="Admins & Roles" description="Manage access to the Heritage Club platform." />
        <button onClick={() => setInviting(true)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus size={16} /> Invite Admin
        </button>
      </div>

      {loading && <Skeleton className="h-64 mt-8" />}
      {error && <EmptyState title="Couldn't load" description={error} />}
      
      {data && (
        <div className="space-y-12 mt-8">
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><ShieldCheck size={20} className="text-primary" /> Active Admins</h3>
            <DataTable columns={columns} rows={data.admins} empty={<EmptyState title="No other admins found." description="Invite colleagues to help manage the platform." />} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2"><Mail size={20} className="text-muted-foreground" /> Pending Invites</h3>
            <DataTable columns={inviteColumns} rows={data.invites} empty={<p className="text-sm text-muted-foreground">No pending invites.</p>} />
          </div>
        </div>
      )}

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite an Admin" footer={
        <>
          <button onClick={() => setInviting(false)} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary transition">Cancel</button>
          <button onClick={handleInvite} disabled={busy || !inviteForm.email} className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60 transition">
            Send Invite
          </button>
        </>
      }>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Send an email invitation with a secure signup code. They will be able to create an account and access the admin dashboard.
          </p>
          <form onSubmit={handleInvite} className="space-y-4 pt-2">
            <Field label="Email Address">
              <Input type="email" required placeholder="admin@example.com" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
            </Field>
            <Field label="Admin Role">
              <Select value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                <option value="super">Super Admin (Full Access)</option>
                <option value="admin">Admin (Manage Users & Cohorts)</option>
                <option value="sub">Sub Admin (View Only)</option>
              </Select>
            </Field>
          </form>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke Admin Access" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary transition">Cancel</button>
          <button onClick={() => deleting && handleDelete(deleting)} disabled={busy} className="rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-60 transition">
            Revoke Access
          </button>
        </>
      }>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to revoke this admin's access? This will permanently delete their account and they will no longer be able to log in.
        </p>
      </Modal>

      <Modal open={!!deletingInvite} onClose={() => setDeletingInvite(null)} title="Revoke Invitation" footer={
        <>
          <button onClick={() => setDeletingInvite(null)} className="rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary transition">Cancel</button>
          <button onClick={() => deletingInvite && handleDeleteInvite(deletingInvite)} disabled={busy} className="rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground disabled:opacity-60 transition">
            Revoke Invitation
          </button>
        </>
      }>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to revoke this pending invitation? The invite code will immediately become invalid.
        </p>
      </Modal>
    </>
  )
}
