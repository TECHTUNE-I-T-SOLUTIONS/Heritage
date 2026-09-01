'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { StaffAuthSplit } from '@/components/staff-auth-split'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { apiPost } from '@/lib/client'
import { COUNTRIES, TIMEZONES } from '@/lib/options'

type Portal = 'educator' | 'admin'
const label: Record<Portal, string> = { educator: 'Educator', admin: 'Admin' }

const btn =
  'mt-2 h-11 rounded-full bg-primary text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60'

/* ---------------- Login ---------------- */

export function StaffLoginForm({ portal }: { portal: Portal }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiPost<{ role: string }>('/api/auth/login', { email, password })
      if (res.role !== portal) {
        setError(`This portal is for ${label[portal].toLowerCase()} accounts. Please use the correct sign-in page.`)
        setLoading(false)
        return
      }
      router.push(`/dashboard/${res.role}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
      setLoading(false)
    }
  }

  return (
    <StaffAuthSplit
      portal={portal}
      eyebrow={`${label[portal]} sign in`}
      title="Welcome back."
      subtitle={`Sign in to your Heritage Club ${label[portal].toLowerCase()} workspace.`}
      footer={
        <p>
          Need a {label[portal].toLowerCase()} account?{' '}
          <Link href={`/${portal}/signup`} className="text-foreground underline underline-offset-4">Sign up</Link>
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
        <button disabled={loading} className={btn}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <Link href={`/staff/forgot-password?portal=${portal}`} className="text-center text-xs text-muted-foreground underline underline-offset-4">Forgot your password?</Link>
      </form>
    </StaffAuthSplit>
  )
}

/* ---------------- Signup ---------------- */

function StaffSignupInner({ portal }: { portal: Portal }) {
  const router = useRouter()
  const params = useSearchParams()
  const [form, setForm] = useState({ 
    fullName: '', 
    email: params.get('email') ?? '', 
    password: '', 
    confirm: '', 
    phone: '', 
    country: '', 
    timezone: '', 
    bio: '', 
    code: params.get('code') ?? '' 
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const res = await apiPost<{ role: string }>('/api/auth/register-staff', {
        flow: portal,
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        country: form.country || undefined,
        timezone: form.timezone || undefined,
        bio: portal === 'educator' && form.bio ? form.bio : undefined,
        code: form.code,
      })
      router.push(`/dashboard/${res.role}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.')
      setLoading(false)
    }
  }

  const codeLabel = portal === 'admin' ? 'Admin setup code' : 'Educator invite code'

  return (
    <StaffAuthSplit
      portal={portal}
      eyebrow={`${label[portal]} sign up`}
      title="Join the team."
      subtitle={`Create your Heritage Club ${label[portal].toLowerCase()} account. You'll need your ${codeLabel.toLowerCase()}.`}
      footer={
        <p>
          Already have an account?{' '}
          <Link href={`/${portal}/login`} className="text-foreground underline underline-offset-4">Sign in</Link>
        </p>
      }
    >
      <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2"><Field label="Full name"><Input required value={form.fullName} onChange={set('fullName')} /></Field></div>
        <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone (optional)"><Input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Password"><Input type="password" required value={form.password} onChange={set('password')} placeholder="At least 8 characters" /></Field>
        <Field label="Confirm password"><Input type="password" required value={form.confirm} onChange={set('confirm')} /></Field>
        <Field label="Country">
          <Select value={form.country} onChange={set('country')}>
            <option value="" disabled>Select country</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Time zone">
          <Select value={form.timezone} onChange={set('timezone')}>
            <option value="" disabled>Select time zone</option>
            {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        {portal === 'educator' && (
          <div className="sm:col-span-2"><Field label="Short bio (optional)"><Textarea value={form.bio} onChange={set('bio')} placeholder="Tell us about your teaching background." /></Field></div>
        )}
        <div className="sm:col-span-2"><Field label={codeLabel}><Input required value={form.code} onChange={set('code')} placeholder="Provided by an administrator" /></Field></div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2"><button disabled={loading} className={`${btn} w-full`}>{loading ? 'Creating account…' : `Create ${label[portal].toLowerCase()} account`}</button></div>
      </form>
    </StaffAuthSplit>
  )
}

export function StaffSignupForm({ portal }: { portal: Portal }) {
  return (
    <Suspense fallback={null}>
      <StaffSignupInner portal={portal} />
    </Suspense>
  )
}

/* ---------------- Forgot password ---------------- */

function ForgotInner() {
  const params = useSearchParams()
  const portal = (params.get('portal') === 'admin' ? 'admin' : 'educator') as Portal
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
    <StaffAuthSplit
      portal={portal}
      eyebrow="Account recovery"
      title="Find your way back."
      subtitle="Enter your email and we'll send instructions to reset your password."
      footer={<p>Remember it? <Link href={`/${portal}/login`} className="text-foreground underline underline-offset-4">Sign in</Link></p>}
    >
      {sent ? (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-5 text-sm leading-6">
          <p className="font-medium mb-2">Check your email</p>
          <p className="text-muted-foreground">
            If an account exists for <strong>{email}</strong>, recovery instructions have been sent to your email address.
          </p>
          <p className="text-muted-foreground mt-2">
            The link will expire in 1 hour for your security.
          </p>
          {process.env.NODE_ENV !== 'production' && devToken && (
            <div className="mt-4 p-3 bg-background rounded-lg border border-border">
              <p className="text-xs font-semibold mb-1">Development Mode</p>
              <p className="break-all text-xs text-muted-foreground mb-2">
                Dev token: <code className="bg-secondary px-1 rounded">{devToken}</code>
              </p>
              <Link 
                className="inline-block text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:opacity-90"
                href={`/staff/reset-password?portal=${portal}&email=${encodeURIComponent(email)}&token=${devToken}`}
              >
                Reset Password (Dev)
              </Link>
            </div>
          )}
        </div>
      ) : (
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <Field label="Email address"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>
          <button disabled={loading} className={btn}>{loading ? 'Sending…' : 'Send recovery link'}</button>
        </form>
      )}
    </StaffAuthSplit>
  )
}

export function StaffForgotForm() {
  return <Suspense fallback={null}><ForgotInner /></Suspense>
}

/* ---------------- Reset password ---------------- */

function ResetInner() {
  const params = useSearchParams()
  const portal = (params.get('portal') === 'admin' ? 'admin' : 'educator') as Portal
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

  return (
    <StaffAuthSplit
      portal={portal}
      eyebrow="Choose a new password"
      title="Set a fresh password."
      subtitle="Your new password should be unique and easy for you to protect."
      footer={<p>Back to <Link href={`/${portal}/login`} className="text-foreground underline underline-offset-4">sign in</Link></p>}
    >
      {done ? (
        <div className="mt-8 rounded-2xl border border-border bg-secondary/60 p-5 text-sm leading-6">
          Your password has been updated. <Link href={`/${portal}/login`} className="underline underline-offset-4">Sign in</Link>
        </div>
      ) : (
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <Field label="Email address"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {process.env.NODE_ENV !== 'production' ? (
            <Field label="Reset token (Dev Mode)">
              <Input required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" />
            </Field>
          ) : (
            <input type="hidden" value={token} />
          )}
          <Field label="New password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
          <Field label="Confirm password"><Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button disabled={loading} className={btn}>{loading ? 'Updating…' : 'Update password'}</button>
        </form>
      )}
    </StaffAuthSplit>
  )
}

export function StaffResetForm() {
  return <Suspense fallback={null}><ResetInner /></Suspense>
}
