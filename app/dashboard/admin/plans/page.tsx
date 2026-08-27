'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Save } from 'lucide-react'
import { useApi, apiPatch } from '@/lib/client'
import { PageHeading, Card, Skeleton } from '@/components/ui/kit'
import { Field, Input } from '@/components/ui/form'
import { useToast } from '@/components/ui/interactive'
import { formatCurrency } from '@/lib/format'

interface SettingsResponse {
  basePrice: number
  discounts: number[]
  launchDate: string
}

export default function AdminPricingSettings() {
  const { data, loading, error, refetch } = useApi<SettingsResponse>('/api/admin/settings')
  const { push } = useToast()
  
  const [basePrice, setBasePrice] = useState(70)
  const [discount2, setDiscount2] = useState(10)
  const [discount3, setDiscount3] = useState(5)
  const [discount4, setDiscount4] = useState(5)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (data) {
      setBasePrice(data.basePrice)
      setDiscount2(data.discounts[0] ?? 10)
      setDiscount3(data.discounts[1] ?? 5)
      setDiscount4(data.discounts[2] ?? 5)
    }
  }, [data])

  async function handleSave() {
    setBusy(true)
    try {
      await apiPatch('/api/admin/settings', {
        basePrice: Number(basePrice),
        discounts: [Number(discount2), Number(discount3), Number(discount4)],
      })
      push('Pricing settings saved!')
      refetch()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save pricing settings', 'error')
    } finally { setBusy(false) }
  }

  // Calculated Preview Tiers
  const tier1 = basePrice
  const tier2 = (basePrice * 2) - discount2
  const tier3 = (basePrice * 3) - discount2 - discount3
  const tier4 = (basePrice * 4) - discount2 - discount3 - discount4

  return (
    <>
      <PageHeading
        eyebrow="Settings"
        title="Pricing & Plan Config"
        description="Configure your base per-child membership rates, additional sibling discounts, and inspect real-time tiers."
      />

      {loading && <Skeleton className="h-64" />}
      
      {data && (
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CreditCard size={18} /> Configure Pricing</h2>
            
            <Field label="Base Price Per-Child (Monthly CAD)">
              <Input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} />
            </Field>

            <div className="border-t border-border pt-4 mt-4 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sibling Discount Thresholds</h3>
              <p className="text-xs text-muted-foreground">Deductions applied to cumulative totals as siblings are added.</p>

              <div className="grid grid-cols-3 gap-3">
                <Field label="2nd Child (-$)">
                  <Input type="number" value={discount2} onChange={(e) => setDiscount2(Number(e.target.value))} />
                </Field>
                <Field label="3rd Child (-$)">
                  <Input type="number" value={discount3} onChange={(e) => setDiscount3(Number(e.target.value))} />
                </Field>
                <Field label="4th+ Child (-$)">
                  <Input type="number" value={discount4} onChange={(e) => setDiscount4(Number(e.target.value))} />
                </Field>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={busy}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60 transition"
            >
              <Save size={16} /> {busy ? 'Saving…' : 'Save Pricing settings'}
            </button>
          </Card>

          {/* Pricing Preview Cards */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Active Plan Previews</h2>
            <div className="grid gap-3">
              {[
                { label: 'Individual (1 child)', price: tier1, desc: `${formatCurrency(tier1)} / child` },
                { label: 'Family (2 children)', price: tier2, desc: `${formatCurrency(tier2)} total (${formatCurrency(tier2/2)} / child)` },
                { label: 'Family (3 children)', price: tier3, desc: `${formatCurrency(tier3)} total (${formatCurrency(tier3/3)} / child)` },
                { label: 'Family (4 children)', price: tier4, desc: `${formatCurrency(tier4)} total (${formatCurrency(tier4/4)} / child)` },
              ].map((tier, idx) => (
                <div key={idx} className="border border-border bg-card rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">{tier.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
                  </div>
                  <span className="text-xl font-bold text-accent">{formatCurrency(tier.price)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
