'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Logo } from '@/components/logo'
import { apiPost } from '@/lib/client'

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const [state, setState] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('Confirming your payment…')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!reference) {
      setState('failed')
      setMessage('No payment reference was provided.')
      return
    }
    ;(async () => {
      try {
        const res = await apiPost<{ status: string }>('/api/payments/paystack/verify', { reference })
        if (res.status === 'succeeded') {
          setState('success')
          setMessage('Payment confirmed! Setting up your dashboard…')
          try {
            const me = await fetch('/api/auth/me').then((r) => r.json())
            const role = me?.data?.role ?? 'parent'
            
            // If this was a child payment, redirect to children page
            const urlParams = new URLSearchParams(window.location.search)
            const isChildPayment = urlParams.get('type') === 'child'
            
            setTimeout(() => {
              if (isChildPayment && role === 'parent') {
                router.push('/dashboard/parent/children')
              } else {
                router.push(`/dashboard/${role}`)
              }
            }, 1400)
          } catch {
            setTimeout(() => router.push('/login'), 1400)
          }
        } else {
          setState('failed')
          setMessage('Your payment was not completed. You can try again from your dashboard.')
        }
      } catch (err) {
        setState('failed')
        setMessage(err instanceof Error ? err.message : 'We could not verify your payment.')
      }
    })()
  }, [reference, router])

  return (
    <main className="grid min-h-screen place-items-center bg-background px-5 text-foreground">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex justify-center"><Logo /></div>
        <div className="mt-8 flex justify-center">
          {state === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-accent" />}
          {state === 'success' && <CheckCircle2 className="h-12 w-12 text-emerald-500" />}
          {state === 'failed' && <XCircle className="h-12 w-12 text-red-500" />}
        </div>
        <h1 className="mt-6 font-serif text-2xl">
          {state === 'verifying' ? 'One moment…' : state === 'success' ? 'Welcome to Heritage Club!' : 'Payment incomplete'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
        {state === 'failed' && (
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard/parent/subscription" className="h-11 rounded-full bg-primary text-sm font-medium leading-[2.75rem] text-primary-foreground">Go to billing</Link>
            <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4">Sign in</Link>
          </div>
        )}
      </div>
    </main>
  )
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-accent" /></main>}>
      <CallbackInner />
    </Suspense>
  )
}
