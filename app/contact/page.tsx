'use client'

import { useState } from 'react'
import { Mail, MessageCircle, CircleFadingPlus, Send } from 'lucide-react'
import { PublicChrome } from '@/components/public-chrome'
import { Field, Input, Textarea } from '@/components/ui/form'
import { apiPost } from '@/lib/client'

const channels = [
  { icon: Mail, label: 'Email', value: 'hello@damzynextgen.app', href: 'mailto:hello@damzynextgen.app' },
  { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with our team', href: 'https://wa.me/' },
  { icon: CircleFadingPlus, label: 'Social', value: '@heritageclub', href: 'https://instagram.com/' },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await apiPost('/api/contact', form)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicChrome>
      <main className="mx-auto max-w-7xl px-5 pb-24 pt-20 lg:px-8 lg:pt-28">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[.24em] text-accent">Contact</p>
          <h1 className="mt-5 font-serif text-5xl leading-[1.02] text-balance sm:text-7xl">We'd love to hear from you.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Questions about enrolment, cohorts, or heritage learning? Send us a message and our team will get back to you.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div className="grid gap-4 self-start">
            {channels.map((c) => (
              <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-foreground/40">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary"><c.icon className="h-5 w-5 text-accent" /></span>
                <span>
                  <span className="block text-sm font-medium">{c.label}</span>
                  <span className="block text-sm text-muted-foreground">{c.value}</span>
                </span>
              </a>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            {done ? (
              <div className="rounded-2xl border border-border bg-secondary/60 p-6 text-sm leading-6">
                Thank you for reaching out. Your message has been received and our team will respond soon.
              </div>
            ) : (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <Field label="Full name"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <div className="sm:col-span-2"><Field label="Subject"><Input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field></div>
                <div className="sm:col-span-2"><Field label="Message"><Textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field></div>
                {error && <p className="sm:col-span-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="sm:col-span-2">
                  <button disabled={loading} className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                    <Send className="h-4 w-4" /> {loading ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </PublicChrome>
  )
}
