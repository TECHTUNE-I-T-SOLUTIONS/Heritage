import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function EducatorLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s) redirect('/login')
  if (s.role !== 'educator') redirect(`/dashboard/${s.role}`)
  return <DashboardShell role="educator" user={{ name: s.name, email: s.email }}>{children}</DashboardShell>
}
