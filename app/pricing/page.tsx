'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, Star } from 'lucide-react'
import { PublicChrome } from '@/components/public-chrome'
import { PLAN_LIST, formatCurrency } from '@/lib/format'

const baseFeatures = ['Full programme access', 'Live weekend classes', 'Quizzes, assignments & projects', 'XP, levels & leaderboard', 'Progress tracking']

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.plans) setPlans(j.data.plans)
      })
      .catch(() => {})
  }, [])

  const activePlans = plans.length > 0 ? plans : PLAN_LIST

  return (
    <PublicChrome>
      <main>
        <section className="mx-auto max-w-7xl px-5 pb-10 pt-20 lg:px-8 lg:pt-28">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[.24em] text-accent">Membership</p>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] text-balance sm:text-7xl">Simple plans for every family.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Choose the rhythm that fits your family. Every membership includes full access to the Heritage Club learning home. Prices in Canadian dollars, billed monthly.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-4 sm:grid-cols-2">
            {activePlans.map((plan) => {
              const recommended = plan.key === 'family2'
              return (
                <div key={plan.key} className={`flex flex-col rounded-3xl border p-6 ${recommended ? 'border-foreground bg-foreground text-background' : 'border-border bg-card'}`}>
                  <div className="mb-8 flex items-center justify-between">
                    <span className={`font-mono text-[10px] uppercase tracking-widest ${recommended ? 'opacity-70' : 'text-muted-foreground'}`}>{plan.tag || `${plan.children} children`}</span>
                    {recommended && <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground"><Star className="h-3 w-3" /> Popular</span>}
                  </div>
                  <h2 className="text-xl font-semibold">{plan.label}</h2>
                  <div className="mt-5 text-3xl font-semibold">{formatCurrency(plan.price)}<span className={`text-sm font-normal ${recommended ? 'opacity-60' : 'text-muted-foreground'}`}> / month</span></div>
                  <div className="mt-6 space-y-3 text-sm">
                    {baseFeatures.map((f) => (
                      <div key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{f}</div>
                    ))}
                    {plan.children > 1 && <div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />Up to {plan.children} children · family dashboard</div>}
                  </div>
                  <Link href="/enroll" className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium ${recommended ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'}`}>Enroll Now <ArrowRight className="h-4 w-4" /></Link>
                </div>
              )
            })}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">Billing is set up after your account is created. No payment is taken at sign-up.</p>
        </section>

        <section className="border-t border-border bg-muted/40 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl text-center">
            <h2 className="font-serif text-3xl sm:text-4xl">What families are saying</h2>
            <div className="mx-auto mt-8 max-w-xl rounded-3xl border border-dashed border-border bg-background p-10">
              <p className="text-muted-foreground">Testimonials coming soon as we welcome our first Heritage Club families.</p>
            </div>
          </div>
        </section>
      </main>
    </PublicChrome>
  )
}
