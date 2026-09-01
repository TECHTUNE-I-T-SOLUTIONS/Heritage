'use client'

import Link from 'next/link'
import { Users, LogIn, Eye } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, Badge, ProgressBar, EmptyState, SkeletonCards } from '@/components/ui/kit'
import { ChildEditButton } from '@/components/child-edit-button'
import { useToast } from '@/components/ui/interactive'

interface ChildCard {
  id: string
  fullName: string
  preferredName: string | null
  age: number | null
  status: string
  xp: number
  level: number
  streak: number
  cohortCode: string | null
  cohortName: string | null
  schedule: string | null
  progress: { lessonsCompleted: number; lessonsTotal: number; lessonsPct: number; avgQuizScore: number; quizzesTaken: number; submissions: number }
}

export default function ParentChildren() {
  const { data, loading, error, refetch } = useApi<{ children: ChildCard[] }>('/api/parent')
  const { push } = useToast()

  async function handleSwitchToChild(childId: string) {
    try {
      await apiPost('/api/auth/switch', { childId })
      push('Switching to child dashboard...')
      window.location.href = '/dashboard/student'
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not log in as child', 'error')
    }
  }

  return (
    <>
      <PageHeading eyebrow="My children" title="Everyone in your family, in one place." action={<Link href="/dashboard/parent/children/add" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Add a child</Link>} />

      {loading && <SkeletonCards count={3} />}
      {error && <EmptyState title="Couldn't load your children" description={error} />}

      {data && (data.children.length === 0 ? (
        <EmptyState icon={<Users size={20} />} title="No children yet" description="Enroll a child to get started." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.children.map((child) => (
            <Card key={child.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-serif text-xl">{child.fullName}</h3>
                  {child.preferredName && <p className="text-sm text-muted-foreground">Goes by {child.preferredName}</p>}
                </div>
                <Badge tone={child.status === 'active' ? 'success' : 'warning'}>{child.status}</Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <ChildEditButton child={{ id: child.id, fullName: child.fullName, preferredName: child.preferredName, age: child.age }} onSaved={refetch} />
                {child.status === 'active' && (
                  <button
                    onClick={() => handleSwitchToChild(child.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition"
                    title="View child's dashboard"
                  >
                    <Eye size={12} /> View Dashboard
                  </button>
                )}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Age</dt><dd className="font-medium">{child.age ?? '—'}</dd></div>
                <div><dt className="text-muted-foreground">Cohort</dt><dd className="font-medium">{child.cohortCode ?? 'Unassigned'}</dd></div>
                <div><dt className="text-muted-foreground">Level</dt><dd className="font-medium">{child.level}</dd></div>
                <div><dt className="text-muted-foreground">XP</dt><dd className="font-medium">{child.xp.toLocaleString()}</dd></div>
                <div><dt className="text-muted-foreground">Quizzes taken</dt><dd className="font-medium">{child.progress.quizzesTaken}</dd></div>
                <div><dt className="text-muted-foreground">Submissions</dt><dd className="font-medium">{child.progress.submissions}</dd></div>
              </dl>
              <div className="mt-4">
                <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Lessons complete</span><span>{child.progress.lessonsPct}%</span></div>
                <ProgressBar value={child.progress.lessonsPct} tone="accent" />
              </div>
              {child.status === 'active' && (
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => handleSwitchToChild(child.id)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
                  >
                    <LogIn size={14} /> Log in as {child.preferredName || child.fullName.split(' ')[0]}
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      ))}
    </>
  )
}
