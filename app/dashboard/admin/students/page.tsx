'use client'
import { AdminUsers } from '@/components/admin-users'
export default function AdminStudentsPage() {
  return <AdminUsers role="student" eyebrow="Students" title="Learners." description="Every enrolled child, their cohort, and XP." showAge showXp />
}
