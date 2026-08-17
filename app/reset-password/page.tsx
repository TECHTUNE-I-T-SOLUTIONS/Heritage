'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthFrame } from '@/app/login/page'
import { Field, Input } from '@/components/ui/form'
import { apiPost } from '@/lib/client'

function ResetForm() {
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [token, setToken] = useState(params.get('token') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await apiPost('/api/auth/reset-password', { email, token, password })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-5 text-sm leading-6">
        Your password has been updated. <Link href="/login" className="underline underline-offset-4">Sign in</Link>
      </div>
    )
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={submit}>
      <Field label="Email address">
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Reset token">
        <Input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" />
      </Field>
      <Field label="New password">
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
      </Field>
      <Field label="Confirm password">
        <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button disabled={loading} className="mt-2 h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
        {loading ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthFrame eyebrow="Choose a new password" title="Set a fresh password." subtitle="Your new password should be unique and easy for you to protect.">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthFrame>
  )
}
