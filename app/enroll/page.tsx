'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Plus, Trash2, Users, GraduationCap, Check, CreditCard } from 'lucide-react'
import { AuthSplit } from '@/components/auth-split'
import { Field, Input, Select } from '@/components/ui/form'
import { apiPost } from '@/lib/client'
import { PLAN_LIST, formatCurrency } from '@/lib/format'
import { COUNTRIES, TIMEZONES, AVAILABILITY_OPTIONS } from '@/lib/options'

type Child = { fullName: string; age: string; dateOfBirth: string; preferredName: string; timezone: string; availability: string }
const emptyChild = (): Child => ({ fullName: '', age: '', dateOfBirth: '', preferredName: '', timezone: '', availability: '' })

// Calculate min and max date for date of birth (3-19 years old)
const getMinDateOfBirth = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 19)
  return date.toISOString().split('T')[0]
}

const getMaxDateOfBirth = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 3)
  return date.toISOString().split('T')[0]
}

function planForChildren(n: number) {
  if (n >= 4) return 'family4'
  if (n === 3) return 'family3'
  if (n === 2) return 'family2'
  return 'individual'
}

const PARENT_STEPS = ['Account', 'Children', 'Plan', 'Payment']
const STUDENT_STEPS = ['Account', 'Learner', 'Plan', 'Payment']

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mt-8">
      <p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">
        Step {current + 1} of {steps.length} · {steps[current]}
      </p>
      <div className="mt-3 flex gap-2">
        {steps.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full transition ${i <= current ? 'bg-primary' : 'bg-border'}`} />
        ))}
      </div>
    </div>
  )
}

const primaryBtn =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60'
const ghostBtn =
  'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm transition hover:bg-secondary'

export default function EnrollPage() {
  const router = useRouter()
  const [flow, setFlow] = useState<'choose' | 'parent' | 'student'>('choose')
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [parent, setParent] = useState({ fullName: '', email: '', phone: '', password: '', country: '', timezone: '' })
  const [children, setChildren] = useState<Child[]>([emptyChild()])
  const [student, setStudent] = useState({ fullName: '', email: '', password: '', dateOfBirth: '', age: '', preferredName: '', country: '', timezone: '', availability: '' })

  // Handle age change for child - auto-set date of birth year
  const handleChildAgeChange = (index: number, age: string) => {
    const updatedChildren = children.map((c, i) => {
      if (i === index) {
        if (age) {
          const ageNum = Number(age)
          const currentYear = new Date().getFullYear()
          const birthYear = currentYear - ageNum
          return { ...c, age, dateOfBirth: `${birthYear}-01-01` }
        }
        return { ...c, age }
      }
      return c
    })
    setChildren(updatedChildren)
  }

  // Handle date of birth change for child - auto-calculate age
  const handleChildDateOfBirthChange = (index: number, dateOfBirth: string) => {
    const updatedChildren = children.map((c, i) => {
      if (i === index) {
        if (dateOfBirth) {
          const birthDate = new Date(dateOfBirth)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
          return { ...c, dateOfBirth, age: String(age) }
        }
        return { ...c, dateOfBirth }
      }
      return c
    })
    setChildren(updatedChildren)
  }

  // Handle age change for student - auto-set date of birth year
  const handleStudentAgeChange = (age: string) => {
    if (age) {
      const ageNum = Number(age)
      const currentYear = new Date().getFullYear()
      const birthYear = currentYear - ageNum
      setStudent({ ...student, age, dateOfBirth: `${birthYear}-01-01` })
    } else {
      setStudent({ ...student, age })
    }
  }

  // Handle date of birth change for student - auto-calculate age
  const handleStudentDateOfBirthChange = (dateOfBirth: string) => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      setStudent({ ...student, dateOfBirth, age: String(age) })
    } else {
      setStudent({ ...student, dateOfBirth })
    }
  }

  const [dbPlans, setDbPlans] = useState<any[]>([])



  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.plans) setDbPlans(j.data.plans)
      })
      .catch(() => {})
  }, [])

  const steps = flow === 'student' ? STUDENT_STEPS : PARENT_STEPS
  const childCount = flow === 'student' ? 1 : children.length
  const planKey = planForChildren(childCount)
  const activePlans = dbPlans.length > 0 ? dbPlans : PLAN_LIST
  const plan = useMemo(() => activePlans.find((p) => p.key === planKey) || activePlans[0], [planKey, activePlans])

  function reset(next: 'parent' | 'student') {
    setFlow(next)
    setStep(0)
    setError(null)
  }

  // ---- validation per step ----
  function validate(): string | null {
    if (flow === 'parent') {
      if (step === 0) {
        const errors = []
        if (!parent.fullName) errors.push('Full name is required')
        if (!parent.email) errors.push('Email is required')
        if (!parent.password) errors.push('Password is required')
        else if (parent.password.length < 8) errors.push('Password must be at least 8 characters')
        if (!parent.country) errors.push('Country is required')
        if (!parent.timezone) errors.push('Time zone is required')
        if (errors.length > 0) return errors.join('. ')
      }
      if (step === 1) {
        for (const c of children) {
          const errors = []
          if (!c.fullName) errors.push('Child full name is required')
          if (!c.dateOfBirth) errors.push('Child date of birth is required')
          else {
            // Validate age based on date of birth
            const birthDate = new Date(c.dateOfBirth)
            const today = new Date()
            let age = today.getFullYear() - birthDate.getFullYear()
            const monthDiff = today.getMonth() - birthDate.getMonth()
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--
            }
            if (age < 3 || age > 19) errors.push('Child age must be between 3 and 19 years old based on date of birth')
          }
          if (!c.timezone) errors.push('Child time zone is required')
          if (!c.availability) errors.push('Child preferred class time is required')
          if (errors.length > 0) return errors.join('. ')
        }
      }
    } else {
      if (step === 0) {
        const errors = []
        if (!student.fullName) errors.push('Full name is required')
        if (!student.email) errors.push('Email is required')
        if (!student.password) errors.push('Password is required')
        else if (student.password.length < 8) errors.push('Password must be at least 8 characters')
        if (errors.length > 0) return errors.join('. ')
      }
      if (step === 1) {
        const errors = []
        if (!student.dateOfBirth) errors.push('Date of birth is required')
        else {
          // Validate age based on date of birth
          const birthDate = new Date(student.dateOfBirth)
          const today = new Date()
          let age = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--
          }
          if (age < 3 || age > 19) errors.push('Age must be between 3 and 19 years old based on date of birth')
        }
        if (!student.country) errors.push('Country is required')
        if (!student.timezone) errors.push('Time zone is required')
        if (!student.availability) errors.push('Preferred class time is required')
        if (errors.length > 0) return errors.join('. ')
      }
    }
    return null
  }

  function nextStep() {
    const v = validate()
    if (v) return setError(v)
    setError(null)
    setStep((s) => Math.min(s + 1, steps.length - 1))
  }
  function prevStep() {
    setError(null)
    if (step === 0) return setFlow('choose')
    setStep((s) => s - 1)
  }

  // ---- final: create account, then start Paystack checkout ----
  async function createAndPay() {
    setError(null)
    setLoading(true)
    try {
      const payload =
        flow === 'parent'
          ? {
              flow: 'parent' as const,
              ...parent,
              planKey,
              children: children.map((c) => ({
                fullName: c.fullName,
                age: Number(c.age),
                dateOfBirth: c.dateOfBirth || undefined,
                preferredName: c.preferredName || undefined,
                timezone: c.timezone || parent.timezone || undefined,
                availability: c.availability ? [c.availability] : [],
              })),
            }
          : {
              flow: 'student' as const,
              ...student,
              age: Number(student.age),
              availability: student.availability ? [student.availability] : [],
            }

      const reg = await apiPost<{ role: string; subscriptionId: string }>('/api/auth/register', payload)

      try {
        const pay = await apiPost<{ authorizationUrl: string }>('/api/payments/paystack/initialize', {
          subscriptionId: reg.subscriptionId,
        })
        window.location.href = pay.authorizationUrl
      } catch (payErr) {
        // Account exists; payment couldn't start (e.g. provider keys not yet configured).
        setError(
          (payErr instanceof Error ? payErr.message : 'Payment could not be started.') +
            ' Your account was created — you can complete payment from your dashboard.',
        )
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete enrollment.')
      setLoading(false)
    }
  }

  // ---------------- CHOOSE ----------------
  if (flow === 'choose') {
    return (
      <AuthSplit eyebrow="Join Heritage Club" title="Begin the journey." subtitle="Choose how you'd like to join. You can link accounts together later.">
        <div className="mt-8 grid gap-4">
          <button onClick={() => reset('parent')} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50">
            <Users className="h-6 w-6 text-accent" />
            <h2 className="mt-4 font-serif text-2xl">I'm a parent or guardian</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Create a family account and enroll one or more children.</p>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </button>
          <button onClick={() => reset('student')} className="group rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary/50">
            <GraduationCap className="h-6 w-6 text-accent" />
            <h2 className="mt-4 font-serif text-2xl">I'm a student</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Register on your own and start learning independently.</p>
            <span className="mt-3 inline-flex items-center gap-2 text-sm font-medium">Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account? <Link href="/login" className="text-foreground underline underline-offset-4">Sign in</Link>
          </p>
        </div>
      </AuthSplit>
    )
  }

  const title = flow === 'parent' ? 'Create your family account.' : 'Create your student account.'
  const isLast = step === steps.length - 1

  return (
    <AuthSplit eyebrow="Join Heritage Club" title={title} subtitle="A few quick steps and you're ready to learn." wide>
      <Stepper steps={steps} current={step} />

      <div className="mt-6">
        {/* ---- PARENT: Account ---- */}
        {flow === 'parent' && step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input required value={parent.fullName} onChange={(e) => setParent({ ...parent, fullName: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" required value={parent.email} onChange={(e) => setParent({ ...parent, email: e.target.value })} /></Field>
            <Field label="Phone (optional)"><Input value={parent.phone} onChange={(e) => setParent({ ...parent, phone: e.target.value })} /></Field>
            <Field label="Password"><Input type="password" required value={parent.password} onChange={(e) => setParent({ ...parent, password: e.target.value })} placeholder="At least 8 characters" /></Field>
            <Field label="Country">
              <Select required value={parent.country} onChange={(e) => setParent({ ...parent, country: e.target.value })}>
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Time zone">
              <Select required value={parent.timezone} onChange={(e) => setParent({ ...parent, timezone: e.target.value })}>
                <option value="" disabled>Select time zone</option>
                {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
          </div>
        )}

        {/* ---- PARENT: Children ---- */}
        {flow === 'parent' && step === 1 && (
          <div className="grid gap-4">
            {children.map((child, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">Child {i + 1}</p>
                  {children.length > 1 && (
                    <button type="button" onClick={() => setChildren(children.filter((_, x) => x !== i))} className="text-muted-foreground hover:text-red-500" aria-label="Remove child"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name"><Input required value={child.fullName} onChange={(e) => setChildren(children.map((c, x) => (x === i ? { ...c, fullName: e.target.value } : c)))} /></Field>
                  <Field label="Preferred name"><Input value={child.preferredName} onChange={(e) => setChildren(children.map((c, x) => (x === i ? { ...c, preferredName: e.target.value } : c)))} /></Field>
                  <Field label="Age">
                    <Input type="number" min={3} max={19} required value={child.age} onChange={(e) => handleChildAgeChange(i, e.target.value)} />
                  </Field>
                  <Field label="Date of birth"><Input type="date" min={getMinDateOfBirth()} max={getMaxDateOfBirth()} value={child.dateOfBirth} onChange={(e) => handleChildDateOfBirthChange(i, e.target.value)} /></Field>
                  <Field label="Time zone">
                    <Select required value={child.timezone} onChange={(e) => setChildren(children.map((c, x) => (x === i ? { ...c, timezone: e.target.value } : c)))}>
                      <option value="" disabled>Select time zone</option>
                      {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </Field>
                  <Field label="Preferred class time">
                    <Select required value={child.availability} onChange={(e) => setChildren(children.map((c, x) => (x === i ? { ...c, availability: e.target.value } : c)))}>
                      <option value="" disabled>Select preferred class time</option>
                      {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
            {children.length < 4 && (
              <button type="button" onClick={() => setChildren([...children, emptyChild()])} className="inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-border px-4 py-3 text-sm hover:bg-secondary"><Plus className="h-4 w-4" /> Add another child</button>
            )}
          </div>
        )}

        {/* ---- STUDENT: Account ---- */}
        {flow === 'student' && step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input required value={student.fullName} onChange={(e) => setStudent({ ...student, fullName: e.target.value })} /></Field>
            <Field label="Preferred name"><Input value={student.preferredName} onChange={(e) => setStudent({ ...student, preferredName: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" required value={student.email} onChange={(e) => setStudent({ ...student, email: e.target.value })} /></Field>
            <Field label="Password"><Input type="password" required value={student.password} onChange={(e) => setStudent({ ...student, password: e.target.value })} placeholder="At least 8 characters" /></Field>
          </div>
        )}

        {/* ---- STUDENT: Learner details ---- */}
        {flow === 'student' && step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age">
              <Input type="number" min={3} max={19} required value={student.age} onChange={(e) => handleStudentAgeChange(e.target.value)} />
            </Field>
            <Field label="Date of birth"><Input type="date" min={getMinDateOfBirth()} max={getMaxDateOfBirth()} value={student.dateOfBirth} onChange={(e) => handleStudentDateOfBirthChange(e.target.value)} /></Field>
            <Field label="Country">
              <Select required value={student.country} onChange={(e) => setStudent({ ...student, country: e.target.value })}>
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Time zone">
              <Select required value={student.timezone} onChange={(e) => setStudent({ ...student, timezone: e.target.value })}>
                <option value="" disabled>Select time zone</option>
                {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Preferred class time">
                <Select required value={student.availability} onChange={(e) => setStudent({ ...student, availability: e.target.value })}>
                  <option value="" disabled>Select preferred class time</option>
                  {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* ---- Plan (both) ---- */}
        {step === 2 && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif text-2xl">{plan.label}</h3>
              <p className="font-serif text-2xl">{formatCurrency(plan.price)}<span className="text-sm text-muted-foreground">/mo</span></p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {flow === 'parent'
                ? `Covers ${childCount} ${childCount === 1 ? 'child' : 'children'}. Add or remove children on the previous step to change your plan.`
                : 'Individual membership for one independent learner.'}
            </p>
            <ul className="mt-5 grid gap-2 text-sm">
              {['Live weekly small-group sessions', 'Full interactive curriculum & quizzes', 'Creative projects with educator feedback', 'Progress dashboard & achievements'].map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> {f}</li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">Billed monthly in {plan ? 'CAD' : ''}. Cancel anytime from your dashboard.</p>
          </div>
        )}

        {/* ---- Payment / Review (both) ---- */}
        {step === 3 && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-sm">
              <p className="font-medium">Review &amp; secure checkout</p>
              <dl className="mt-3 space-y-2">
                <div className="flex justify-between"><dt className="text-muted-foreground">Account</dt><dd>{flow === 'parent' ? parent.email : student.email}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd>{plan.label}</dd></div>
                {flow === 'parent' && <div className="flex justify-between"><dt className="text-muted-foreground">Children</dt><dd>{childCount}</dd></div>}
                <div className="flex justify-between border-t border-border pt-2 font-medium"><dt>Due today</dt><dd>{formatCurrency(plan.price)}</dd></div>
              </dl>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Selecting “Pay &amp; enroll” creates your account and opens our secure payment provider to complete your first month.
              A Heritage Club educator will place {flow === 'parent' ? 'each child' : 'you'} into an available cohort after payment is confirmed.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
          <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" onClick={prevStep} className={ghostBtn}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {isLast ? (
          <button type="button" disabled={loading} onClick={createAndPay} className={primaryBtn}>
            <CreditCard className="h-4 w-4" /> {loading ? 'Redirecting…' : `Pay ${formatCurrency(plan.price)} & enroll`}
          </button>
        ) : (
          <button type="button" onClick={nextStep} className={primaryBtn}>
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </AuthSplit>
  )
}
