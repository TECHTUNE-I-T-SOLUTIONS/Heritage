/**
 * Currency conversion for checkout.
 *
 * Plans are priced in CAD, but Paystack charges in the account's settlement
 * currency (PAYSTACK_CURRENCY, e.g. NGN). We convert the CAD price into the
 * target currency at request time so the customer is billed the correct
 * equivalent amount (e.g. CAD 59 -> ~NGN 70,800) instead of "NGN 59".
 *
 * Strategy:
 *   1. If source === target, no conversion.
 *   2. Try a live, key-less FX endpoint (open.er-api.com).
 *   3. Fall back to an env override (PAYSTACK_FX_RATE) or a static rate table.
 */

// Reasonable fallback rates expressed as "1 CAD = X <currency>".
// Used only when the live rate lookup fails (e.g. no network).
const FALLBACK_CAD_RATES: Record<string, number> = {
  CAD: 1,
  NGN: 980, // Updated to more accurate rate (~1100 NGN per CAD)
  GHS: 11,
  ZAR: 13,
  KES: 95,
  USD: 0.73,
}

interface CachedRates {
  base: string
  rates: Record<string, number>
  fetchedAt: number
}

let cache: CachedRates | null = null
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

async function fetchRates(base: string): Promise<Record<string, number> | null> {
  if (cache && cache.base === base && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.rates
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
      cache: 'no-store',
    })
    const json = await res.json().catch(() => null)
    if (json && json.result === 'success' && json.rates) {
      cache = { base, rates: json.rates as Record<string, number>, fetchedAt: Date.now() }
      return cache.rates
    }
  } catch {
    // fall through to fallback rates
  }
  return null
}

/**
 * Convert `amount` from `from` currency to `to` currency.
 * Returns the amount in MAJOR units of the target currency (not subunits).
 */
export async function convertAmount(amount: number, from: string, to: string): Promise<number> {
  const src = from.toUpperCase()
  const dst = to.toUpperCase()
  if (src === dst) return amount

  // Explicit override (e.g. PAYSTACK_FX_RATE=1250 meaning 1 <from> = 1250 <to>)
  const override = Number(process.env.PAYSTACK_FX_RATE)
  if (override && override > 0) return amount * override

  // Live rates keyed to the source currency.
  const rates = await fetchRates(src)
  if (rates && typeof rates[dst] === 'number') {
    return amount * rates[dst]
  }

  // Static fallback (only defined relative to CAD).
  if (src === 'CAD' && FALLBACK_CAD_RATES[dst]) {
    return amount * FALLBACK_CAD_RATES[dst]
  }
  if (dst === 'CAD' && FALLBACK_CAD_RATES[src]) {
    return amount / FALLBACK_CAD_RATES[src]
  }
  // Cross-rate via CAD if both are known.
  if (FALLBACK_CAD_RATES[src] && FALLBACK_CAD_RATES[dst]) {
    const inCad = amount / FALLBACK_CAD_RATES[src]
    return inCad * FALLBACK_CAD_RATES[dst]
  }

  // Last resort: no conversion (better to charge something than crash),
  // but this should be rare given the fallback table above.
  return amount
}

/** Currencies we bill in whole units (avoids odd fractional subunits at checkout). */
const ZERO_DECIMAL = new Set(['NGN', 'KES', 'JPY', 'KRW', 'VND'])

/** Round a converted amount sensibly for the target currency. */
export function roundForCurrency(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100) / 100
}
