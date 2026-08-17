'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthFrame } from '@/app/login/page'
import { Field, Input } from '@/components/ui/form'
import { apiPost } from '@/lib/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiPost<{ sent: boolean; devToken?: string }>('/api/auth/forgot-password', { email })
      setSent(true)
      if (res.devToken) setDevToken(res.devToken)
    } catch {
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      eyebrow="Account recovery"
      title="Find your way back."
      subtitle="Enter your email and we'll send instructions to reset your password."
      footer={<p className="mt-6 text-center text-sm text-muted-foreground">Remember it? <Link href="/login" className="text-foreground underline underline-offset-4">Sign in</Link></p>}
    >
      {sent ? (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-5 text-sm leading-6">
          If an account exists for <strong>{email}</strong>, recovery instructions are on their way.
          {devToken && (
            <p className="mt-3 break-all text-xs text-muted-foreground">
              Dev token: <code>{devToken}</code> —{' '}
              <Link className="underline" href={`/reset-password?email=${encodeURIComponent(email)}&token=${devToken}`}>reset now</Link>
            </p>
          )}
        </div>
      ) : (
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <Field label="Email address">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <button disabled={loading} className="mt-2 h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
            {loading ? 'Sending…' : 'Send recovery link'}
          </button>
        </form>
      )}
    </AuthFrame>
  )
}
