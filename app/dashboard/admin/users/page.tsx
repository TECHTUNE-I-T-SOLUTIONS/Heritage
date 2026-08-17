'use client'
import { AdminUsers } from '@/components/admin-users'
export default function AdminUsersPage() {
  return <AdminUsers eyebrow="Users" title="Everyone in Heritage Club." description="All accounts across roles. Suspend or reactivate access." showRole showXp />
}
