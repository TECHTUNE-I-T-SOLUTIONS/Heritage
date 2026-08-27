'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthSplit } from '@/components/auth-split'
import { Field, Input } from '@/components/ui/form'
import { apiPost } from '@/lib/client'

/**
 * Backwards-compatible frame used by the forgot/reset password pages.
 * Now renders on the shared split-screen layout.
 */
function AuthFrame({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <AuthSplit eyebrow={eyebrow} title={title} subtitle={subtitle} footer={footer}>
      {children}
    </AuthSplit>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Redirect to waitlist if not launched yet
  useEffect(() => {
    fetch('/api/waitlist/status')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data && !j.data.launched) {
          router.push('/waitlist')
        }
      })
      .catch(() => {})
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiPost<{
        role: string
        needsPayment?: boolean
        subscriptionId?: string
      }>('/api/auth/login', { email, password })

      // Subscription not yet active — send them back into checkout so they can
      // pay again. Once Paystack confirms, the callback routes to the dashboard.
      if (res.needsPayment && res.subscriptionId) {
        setError(null)
        try {
          const pay = await apiPost<{ authorizationUrl: string }>(
            '/api/payments/paystack/initialize',
            { subscriptionId: res.subscriptionId },
          )
          window.location.href = pay.authorizationUrl
          return
        } catch {
          // Could not start checkout — send them to the dashboard, where the
          // "complete payment" banner lets them retry.
          router.push(`/dashboard/${res.role}`)
          return
        }
      }

      router.push(`/dashboard/${res.role}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
      setLoading(false)
    }
  }

  return (
    <AuthSplit
      eyebrow="Welcome back"
      title="Continue learning."
      subtitle="Sign in to your Heritage Club learning space."
      footer={
        <p>
          New to Heritage Club?{' '}
          <Link href="/enroll" className="text-foreground underline underline-offset-4">Enroll now</Link>
          <span className="mt-2 block text-muted-foreground">
            Staff?{' '}
            <Link href="/educator/login" className="underline underline-offset-4 hover:text-foreground">Educator</Link>
            {' · '}
            <Link href="/admin/login" className="underline underline-offset-4 hover:text-foreground">Admin</Link>
          </span>
        </p>
      }
    >
      <form className="mt-8 grid gap-4" onSubmit={submit}>
        <Field label="Email address">
          <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <Input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
        </Field>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button disabled={loading} className="mt-2 h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <Link href="/forgot-password" className="text-center text-xs text-muted-foreground underline underline-offset-4">Forgot your password?</Link>
      </form>
    </AuthSplit>
  )
}

export { AuthFrame }
