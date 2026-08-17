'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { useApi } from '@/lib/client'
import { PageHeading, Card, Badge, ProgressBar, EmptyState, SkeletonCards } from '@/components/ui/kit'
import { ChildEditButton } from '@/components/child-edit-button'

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

  return (
    <>
      <PageHeading eyebrow="My children" title="Everyone in your family, in one place." action={<Link href="/enroll" className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground">Add a child</Link>} />

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
              <div className="mt-3">
                <ChildEditButton child={{ id: child.id, fullName: child.fullName, preferredName: child.preferredName, age: child.age }} onSaved={refetch} />
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
            </Card>
          ))}
        </div>
      ))}
    </>
  )
}
