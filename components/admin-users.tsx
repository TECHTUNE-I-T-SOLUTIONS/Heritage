'use client'

import { useState } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, useToast } from '@/components/ui/interactive'
import { formatDate } from '@/lib/format'

import { Field, Input, Select } from '@/components/ui/form'
import { Modal } from '@/components/ui/interactive'

interface UserRow extends Record<string, unknown> {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  age: number | null
  timezone: string | null
  xp: number
  cohortCode: string | null
  createdAt: string
}

interface Cohort { id: string; code: string; name: string }

const statusTone = (s: string) => (s === 'active' ? 'success' : s === 'pending' ? 'warning' : s === 'suspended' ? 'error' : 'neutral')

export function AdminUsers({
  role,
  eyebrow,
  title,
  description,
  showRole = false,
  showAge = false,
  showXp = false,
}: {
  role?: string
  eyebrow: string
  title: string
  description: string
  showRole?: boolean
  showAge?: boolean
  showXp?: boolean
}) {
  const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users'
  const { data, loading, error, refetch } = useApi<UserRow[]>(url)
  const cohorts = useApi<Cohort[]>('/api/admin/cohorts')
  const { push } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const [editing, setEditing] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState({ id: '', fullName: '', email: '', age: 0, xp: 0, status: '' })

  const [assigning, setAssigning] = useState<UserRow | null>(null)
  const [selectedCohort, setSelectedCohort] = useState('')

  const [deleting, setDeleting] = useState<UserRow | null>(null)

  async function setStatus(id: string, status: string) {
    setBusyId(id)
    try {
      await apiPatch('/api/admin/users', { id, status })
      push('Status updated.')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleEdit() {
    setBusyId(editForm.id)
    try {
      await apiPatch('/api/admin/users', {
        id: editForm.id,
        fullName: editForm.fullName,
        email: editForm.email,
        age: editForm.age || null,
        xp: Number(editForm.xp),
        status: editForm.status,
      })
      push('User details updated.')
      setEditing(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not update', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleAssignCohort() {
    if (!assigning) return
    setBusyId(assigning.id)
    try {
      // Find the cohort ID matching code or selected directly
      await apiPatch('/api/admin/users', {
        id: assigning.id,
        cohort: selectedCohort || null,
      })
      push('Cohort assigned successfully.')
      setAssigning(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not assign cohort', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    setBusyId(deleting.id)
    try {
      const { apiDelete } = await import('@/lib/client')
      await apiDelete(`/api/admin/users?id=${deleting.id}`)
      push('User deleted.')
      setDeleting(null)
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not delete', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const columns: Column<UserRow>[] = [
    { key: 'fullName', header: 'Name', render: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    ...(showRole ? [{ key: 'role', header: 'Role', render: (r: UserRow) => <span className="capitalize">{r.role}</span> } as Column<UserRow>] : []),
    ...(showAge ? [
      { key: 'age', header: 'Age', render: (r: UserRow) => r.age ?? '—' } as Column<UserRow>,
      { key: 'ageBand', header: 'Age Band', render: (r: UserRow) => r.age ? (r.age <= 12 ? '8-12' : '13-16') : '—' } as Column<UserRow>
    ] : []),
    ...(showXp ? [{ key: 'xp', header: 'XP', render: (r: UserRow) => r.xp.toLocaleString() } as Column<UserRow>] : []),
    ...(role === 'student' ? [
      { key: 'timezone', header: 'Timezone', render: (r: UserRow) => r.timezone ? r.timezone.split('/')[1]?.replace('_', ' ') || r.timezone : '—' } as Column<UserRow>,
      { key: 'cohortCode', header: 'Cohort', render: (r: UserRow) => r.cohortCode ?? '—' } as Column<UserRow>
    ] : []),
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2 flex-wrap sm:flex-nowrap">
          {role === 'student' && (
            <button
              onClick={() => {
                setAssigning(r)
                // Find cohort matching cohortCode
                const matched = cohorts.data?.find((c) => c.code === r.cohortCode)
                setSelectedCohort(matched?.id ?? '')
              }}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
            >
              Assign Cohort
            </button>
          )}
          <button
            onClick={() => {
              setEditing(r)
              setEditForm({ id: r.id, fullName: r.fullName, email: r.email, age: r.age ?? 0, xp: r.xp, status: r.status })
            }}
            className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary"
          >
            Edit
          </button>
          {r.status !== 'active' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'active')} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60">Activate</button>}
          {r.status !== 'suspended' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'suspended')} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60">Suspend</button>}
          <button
            onClick={() => setDeleting(r)}
            className="rounded-full border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 px-3 py-1.5 text-xs"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading eyebrow={eyebrow} title={title} description={description} />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load" description={error} />}
      {data && <DataTable columns={columns} rows={data} empty={<EmptyState icon={<UsersIcon size={20} />} title="No records yet" description="They'll appear here as people join." />} />}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit user details" footer={
        <>
          <button onClick={() => setEditing(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleEdit} disabled={busyId === editForm.id} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">Save changes</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Full Name"><Input value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} /></Field>
          <Field label="Email"><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
          <Field label="Age"><Input type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })} /></Field>
          {editing?.role === 'student' && (
            <Field label="XP"><Input type="number" value={editForm.xp} onChange={(e) => setEditForm({ ...editForm, xp: Number(e.target.value) })} /></Field>
          )}
          <Field label="Status">
            <Select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="deactivated">Deactivated</option>
            </Select>
          </Field>
          {editing && (
            <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground space-y-1">
              <p><strong>Role:</strong> <span className="capitalize">{editing.role}</span></p>
              <p><strong>Joined:</strong> {formatDate(editing.createdAt)}</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!assigning} onClose={() => setAssigning(null)} title="Assign student to cohort" footer={
        <>
          <button onClick={() => setAssigning(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleAssignCohort} disabled={busyId === assigning?.id} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">Assign</button>
        </>
      }>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a cohort to assign <strong>{assigning?.fullName}</strong> to:</p>
          <Field label="Cohort">
            <Select value={selectedCohort} onChange={(e) => setSelectedCohort(e.target.value)}>
              <option value="">Unassigned</option>
              {cohorts.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete user account" footer={
        <>
          <button onClick={() => setDeleting(null)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleDelete} disabled={busyId === deleting?.id} className="rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm disabled:opacity-60">Delete account</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to delete the user account for <strong>{deleting?.fullName}</strong>? This action is permanent and cannot be undone.</p>
      </Modal>
    </>
  )
}

