'use client'

import { useState } from 'react'
import { Users as UsersIcon } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, useToast } from '@/components/ui/interactive'
import { formatDate } from '@/lib/format'

interface UserRow extends Record<string, unknown> {
  id: string
  fullName: string
  email: string
  role: string
  status: string
  age: number | null
  xp: number
  cohortCode: string | null
  createdAt: string
}

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
  const { push } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

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

  const columns: Column<UserRow>[] = [
    { key: 'fullName', header: 'Name', render: (r) => <div><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.email}</p></div> },
    ...(showRole ? [{ key: 'role', header: 'Role', render: (r: UserRow) => <span className="capitalize">{r.role}</span> } as Column<UserRow>] : []),
    ...(showAge ? [{ key: 'age', header: 'Age', render: (r: UserRow) => r.age ?? '—' } as Column<UserRow>] : []),
    ...(showXp ? [{ key: 'xp', header: 'XP', render: (r: UserRow) => r.xp.toLocaleString() } as Column<UserRow>] : []),
    ...(role === 'student' ? [{ key: 'cohortCode', header: 'Cohort', render: (r: UserRow) => r.cohortCode ?? '—' } as Column<UserRow>] : []),
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div className="flex justify-end gap-2">
          {r.status !== 'active' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'active')} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60">Activate</button>}
          {r.status !== 'suspended' && <button disabled={busyId === r.id} onClick={() => setStatus(r.id, 'suspended')} className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary disabled:opacity-60">Suspend</button>}
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
    </>
  )
}
