'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, CreditCard, Users, Check } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton } from '@/components/ui/kit'
import { Field, Input, Select } from '@/components/ui/form'
import { Modal, useToast } from '@/components/ui/interactive'
import { formatCurrency } from '@/lib/format'
import { TIMEZONES, AVAILABILITY_OPTIONS } from '@/lib/options'

type ChildForm = { fullName: string; preferredName: string; email: string; password: string; age: string; dateOfBirth: string; timezone: string; availability: string }
const emptyChild = (): ChildForm => ({ fullName: '', preferredName: '', email: '', password: '', age: '', dateOfBirth: '', timezone: '', availability: '' })

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

export default function AddChildPage() {
  const router = useRouter()
  const { push } = useToast()
  const { data: parentData, loading: parentLoading } = useApi<{ children: any[]; subscription: any }>('/api/parent')
  
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [child, setChild] = useState<ChildForm>(emptyChild())
  const [price, setPrice] = useState(0)

  // Handle age change - auto-set date of birth year
  const handleAgeChange = (age: string) => {
    setChild({ ...child, age })
    if (age) {
      const ageNum = Number(age)
      const currentYear = new Date().getFullYear()
      const birthYear = currentYear - ageNum
      // Set to January 1st of that year as default
      setChild({ ...child, age, dateOfBirth: `${birthYear}-01-01` })
    }
  }

  // Handle date of birth change - auto-calculate age
  const handleDateOfBirthChange = (dateOfBirth: string) => {
    setChild({ ...child, dateOfBirth })
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      setChild({ ...child, dateOfBirth, age: String(age) })
    }
  }
  
  const steps = ['Child Details', 'Review & Payment']

  useEffect(() => {
    if (parentData) {
      // Calculate price based on existing children count
      const existingCount = parentData.children?.length || 0
      let basePrice = 70
      let discounts = [10, 5, 5]
      
      let childPrice = basePrice
      if (existingCount === 1) childPrice = basePrice - discounts[0]
      else if (existingCount === 2) childPrice = basePrice - discounts[1]
      else if (existingCount >= 3) childPrice = basePrice - discounts[2]
      
      setPrice(childPrice)
    }
  }, [parentData])

  function validate(): string | null {
    if (step === 0) {
      const errors = []
      if (!child.fullName) errors.push('Full name is required')
      if (!child.email) errors.push('Email/Username is required')
      if (!child.password) errors.push('Password is required')
      else if (child.password.length < 8) errors.push('Password must be at least 8 characters')
      if (!child.dateOfBirth) errors.push('Date of birth is required')
      else {
        // Validate age based on date of birth
        const birthDate = new Date(child.dateOfBirth)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        if (age < 3 || age > 19) errors.push('Child age must be between 3 and 19 years old based on date of birth')
      }
      if (!child.timezone) errors.push('Time zone is required')
      if (!child.availability) errors.push('Preferred class time is required')
      if (errors.length > 0) return errors.join('. ')
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
    if (step === 0) {
      router.back()
    } else {
      setStep((s) => s - 1)
    }
  }

  async function addAndPay() {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        fullName: child.fullName,
        preferredName: child.preferredName || undefined,
        email: child.email,
        password: child.password,
        age: Number(child.age),
        dateOfBirth: child.dateOfBirth || undefined,
        timezone: child.timezone || undefined,
        availability: child.availability ? [child.availability] : [],
      }

      const res = await apiPost<{ authorizationUrl: string; childId: string }>('/api/parent/children', payload)
      
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl
      } else {
        push('Child added successfully!')
        router.push('/dashboard/parent/children')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add child.')
      setLoading(false)
    }
  }

  if (parentLoading) {
    return (
      <div>
        <PageHeading eyebrow="Add a child" title="Enroll a new learner." description="Add another child to your family account." />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <>
      <PageHeading
        eyebrow="Add a child"
        title="Enroll a new learner."
        description="Add another child to your family account."
        action={
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        }
      />

      <div className="mt-8">
        {/* Stepper */}
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">
            Step {step + 1} of {steps.length} · {steps[step]}
          </p>
          <div className="mt-3 flex gap-2">
            {steps.map((s, i) => (
              <span key={s} className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
        </div>

        {/* Step 0: Child Details */}
        {step === 0 && (
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name">
                <Input required value={child.fullName} onChange={(e) => setChild({ ...child, fullName: e.target.value })} placeholder="Child's full name" />
              </Field>
              <Field label="Preferred name">
                <Input value={child.preferredName} onChange={(e) => setChild({ ...child, preferredName: e.target.value })} placeholder="What they go by" />
              </Field>
              <Field label="Email/Username">
                <Input required value={child.email} onChange={(e) => setChild({ ...child, email: e.target.value })} placeholder="username or email@domain.com" />
              </Field>
              <Field label="Password">
                <Input type="password" required value={child.password} onChange={(e) => setChild({ ...child, password: e.target.value })} placeholder="At least 8 characters" />
              </Field>
              <Field label="Age">
                <Input type="number" min={3} max={19} required value={child.age} onChange={(e) => handleAgeChange(e.target.value)} placeholder="3-19" />
              </Field>
              <Field label="Date of birth">
                <Input type="date" min={getMinDateOfBirth()} max={getMaxDateOfBirth()} value={child.dateOfBirth} onChange={(e) => handleDateOfBirthChange(e.target.value)} />
              </Field>
              <Field label="Time zone">
                <Select required value={child.timezone} onChange={(e) => setChild({ ...child, timezone: e.target.value })}>
                  <option value="" disabled>Select time zone</option>
                  {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Preferred class time">
                <Select required value={child.availability} onChange={(e) => setChild({ ...child, availability: e.target.value })}>
                  <option value="" disabled>Select preferred class time</option>
                  {AVAILABILITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
              </Field>
            </div>
          </Card>
        )}

        {/* Step 1: Review & Payment */}
        {step === 1 && (
          <div className="grid gap-4">
            <Card className="p-6">
              <h3 className="font-serif text-xl mb-4">Child Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Name</dt><dd>{child.fullName}</dd></div>
                {child.preferredName && <div className="flex justify-between"><dt className="text-muted-foreground">Preferred name</dt><dd>{child.preferredName}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted-foreground">Email/Username</dt><dd>{child.email}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Age</dt><dd>{child.age} years old</dd></div>
                {child.dateOfBirth && <div className="flex justify-between"><dt className="text-muted-foreground">Date of birth</dt><dd>{child.dateOfBirth}</dd></div>}
                {child.timezone && <div className="flex justify-between"><dt className="text-muted-foreground">Time zone</dt><dd>{TIMEZONES.find(t => t.value === child.timezone)?.label || child.timezone}</dd></div>}
                {child.availability && <div className="flex justify-between"><dt className="text-muted-foreground">Preferred class time</dt><dd>{child.availability}</dd></div>}
              </dl>
            </Card>

            <Card className="p-6">
              <h3 className="font-serif text-xl mb-4">Payment Summary</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Existing children</dt><dd>{parentData?.children?.length || 0}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">New child</dt><dd>1</dd></div>
                <div className="flex justify-between border-t border-border pt-2 font-medium text-lg">
                  <dt>Total due today</dt>
                  <dd>{formatCurrency(price)}</dd>
                </div>
              </dl>
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-1" />
                  Sibling discount applied based on your current family size.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="font-serif text-xl mb-4">What's Included</h3>
              <ul className="space-y-2 text-sm">
                {['Live weekly small-group sessions', 'Full interactive curriculum & quizzes', 'Creative projects with educator feedback', 'Progress dashboard & achievements'].map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> {f}</li>
                ))}
              </ul>
            </Card>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button onClick={prevStep} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm transition hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {step === steps.length - 1 ? (
            <button onClick={addAndPay} disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
              <CreditCard className="h-4 w-4" /> {loading ? 'Processing...' : `Pay ${formatCurrency(price)} & Add Child`}
            </button>
          ) : (
            <button onClick={nextStep} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:opacity-90">
              Continue <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </>
  )
}
