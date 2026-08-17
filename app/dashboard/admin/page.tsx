'use client'

import { Users, GraduationCap, Shapes, CreditCard, ShieldAlert, Wallet, BookOpen } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, StatCard, SkeletonCards, EmptyState } from '@/components/ui/kit'
import { formatCurrency } from '@/lib/format'

interface Stats {
  students: number
  parents: number
  educators: number
  cohorts: number
  activeSubs: number
  pendingMod: number
  revenue: number
}

export default function AdminOverview() {
  const { data, loading, error } = useApi<Stats>('/api/admin')

  return (
    <>
      <PageHeading eyebrow="Operations centre" title="Heritage Club at a glance." description="Live counts across members, cohorts, billing, and moderation." />

      {loading && <SkeletonCards count={4} />}
      {error && <EmptyState title="Couldn't load overview" description={error} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Students" value={data.students} icon={<GraduationCap size={18} />} />
            <StatCard label="Parents" value={data.parents} icon={<Users size={18} />} />
            <StatCard label="Educators" value={data.educators} icon={<GraduationCap size={18} />} />
            <StatCard label="Cohorts" value={data.cohorts} icon={<Shapes size={18} />} />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active subscriptions" value={data.activeSubs} icon={<CreditCard size={18} />} />
            <StatCard label="Revenue (paid)" value={formatCurrency(data.revenue)} icon={<Wallet size={18} />} />
            <StatCard label="Pending moderation" value={data.pendingMod} detail={data.pendingMod > 0 ? 'Needs review' : 'All clear'} icon={<ShieldAlert size={18} />} />
            <StatCard label="Curriculum" value="Manage" detail="Pillars & lessons" icon={<BookOpen size={18} />} />
          </div>
        </>
      )}
    </>
  )
}
