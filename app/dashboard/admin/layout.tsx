import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { DashboardShell } from '@/components/dashboard-shell'
import { connectToDatabase } from '@/lib/db'
import { User } from '@/models/User'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession()
  if (!s) redirect('/login')
  if (s.role !== 'admin') redirect(`/dashboard/${s.role}`)

  await connectToDatabase()
  const user = await User.findById(s.userId).select('adminRole').lean()

  return <DashboardShell role="admin" user={{ name: s.name, email: s.email, adminRole: user?.adminRole || 'admin' }}>{children}</DashboardShell>
}
