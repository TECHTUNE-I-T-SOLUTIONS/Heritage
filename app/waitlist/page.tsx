'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Calendar, Mail, CheckCircle2 } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { Card, PageHeading } from '@/components/ui/kit'
import { Field, Input, Select } from '@/components/ui/form'

export default function WaitlistPage() {
  const statusRes = useApi<{ launched: boolean; launchDate: string | null }>('/api/waitlist/status')
  
  const [form, setForm] = useState({ name: '', email: '', role: 'parent', childrenCount: 1, parentEmail: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  const launchDateStr = statusRes.data?.launchDate

  useEffect(() => {
    if (!launchDateStr) return
    const target = new Date(launchDateStr).getTime()

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        clearInterval(interval)
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [launchDateStr])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)

    try {
      await apiPost('/api/waitlist', {
        name: form.name,
        email: form.email,
        role: form.role,
        childrenCount: form.role === 'parent' ? Number(form.childrenCount) : undefined,
        parentEmail: form.role === 'student' && form.parentEmail ? form.parentEmail : undefined,
      })
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col justify-between py-12 px-6">
      <div className="max-w-4xl mx-auto w-full text-center space-y-8">
        <div className="flex justify-center mb-4">
          <img src="https://heritage.damzynextgen.app/heritage.png" alt="Heritage Club" className="h-14" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200">
          Something special is coming.
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-gray-400 leading-relaxed">
          Heritage Club is preparing to open. Secure your family's spot on the exclusive pre-launch waitlist and get first access to our cultural classes, lessons, and dashboard slots.
        </p>

        {/* Countdown Timer */}
        {launchDateStr && (
          <div className="grid grid-cols-4 gap-4 max-w-xl mx-auto py-8">
            {[
              { label: 'Days', val: timeLeft.days },
              { label: 'Hours', val: timeLeft.hours },
              { label: 'Minutes', val: timeLeft.minutes },
              { label: 'Seconds', val: timeLeft.seconds },
            ].map((t) => (
              <div key={t.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-3xl sm:text-5xl font-bold font-mono tracking-tight">{String(t.val).padStart(2, '0')}</span>
                <span className="text-xs uppercase tracking-wider text-gray-400 mt-2">{t.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Waitlist Form Card */}
        <div className="max-w-md mx-auto">
          {done ? (
            <div className="bg-white/5 border border-yellow-500/20 rounded-3xl p-8 flex flex-col items-center space-y-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-yellow-500/20 text-yellow-400"><CheckCircle2 size={32} /></span>
              <h3 className="text-xl font-semibold">You're on the list!</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Thank you for joining our waitlist. We have sent a confirmation email to <strong>{form.email}</strong>. We'll reach out as soon as we launch!
              </p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 text-left">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2"><Sparkles className="text-yellow-400" /> Join Waitlist</h3>
              <form onSubmit={submit} className="space-y-4">
                <Field label="Full Name">
                  <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="bg-[#141722] border-white/10 text-white" />
                </Field>
                <Field label="Email Address">
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="bg-[#141722] border-white/10 text-white" />
                </Field>
                <Field label="Who are you?">
                  <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="bg-[#141722] border-white/10 text-white">
                    <option value="parent">Parent</option>
                    <option value="student">Student</option>
                  </Select>
                </Field>

                {form.role === 'parent' && (
                  <Field label="Number of children to enroll">
                    <Select value={form.childrenCount} onChange={(e) => setForm({ ...form, childrenCount: Number(e.target.value) })} className="bg-[#141722] border-white/10 text-white">
                      <option value="1">1 Child</option>
                      <option value="2">2 Children</option>
                      <option value="3">3 Children</option>
                      <option value="4">4+ Children</option>
                    </Select>
                  </Field>
                )}

                {form.role === 'student' && (
                  <Field label="Parent's Email (Optional)">
                    <Input type="email" value={form.parentEmail} onChange={(e) => setForm({ ...form, parentEmail: e.target.value })} placeholder="parent@example.com" className="bg-[#141722] border-white/10 text-white" />
                  </Field>
                )}

                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

                <button disabled={busy} className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-full flex items-center justify-center gap-2 transition disabled:opacity-60 mt-6">
                  <Mail size={16} /> {busy ? 'Joining…' : 'Secure my spot'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-gray-500 mt-12">
        &copy; {new Date().getFullYear()} Heritage Club. All rights reserved.
      </footer>
    </div>
  )
}
