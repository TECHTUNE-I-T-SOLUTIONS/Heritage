'use client'

import { SettingsForm } from '@/components/settings-form'
import { StudentParentCard } from '@/components/student-parent-card'

export default function StudentProfile() {
  return (
    <>
      <SettingsForm />
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <StudentParentCard />
      </div>
    </>
  )
}
