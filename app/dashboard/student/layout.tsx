import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s) redirect('/login')
  if (s.role !== 'student') redirect(`/dashboard/${s.role}`)
  return <DashboardShell role="student" user={{ name: s.name, email: s.email }}>{children}</DashboardShell>
}
