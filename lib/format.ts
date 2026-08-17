export const PLAN_LIST = [
  { key: 'individual', label: 'Individual', price: 59, children: 1, tag: '1 child' },
  { key: 'family2', label: 'Family — 2 Children', price: 109, children: 2, tag: '2 children' },
  { key: 'family3', label: 'Family — 3 Children', price: 129, children: 3, tag: '3 children' },
  { key: 'family4', label: 'Family — 4 Children', price: 149, children: 4, tag: '4 children' },
] as const

export function formatCurrency(amount: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(input?: string | Date | null) {
  if (!input) return '—'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function initials(name?: string) {
  if (!name) return 'HC'
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function levelFromXp(xp = 0) {
  return Math.max(1, Math.floor(xp / 500) + 1)
}

export function levelProgress(xp = 0) {
  const level = levelFromXp(xp)
  const into = xp - (level - 1) * 500
  return { level, into, needed: 500, pct: Math.round((into / 500) * 100) }
}
