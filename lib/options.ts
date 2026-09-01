/**
 * Shared option lists for signup / profile dropdowns.
 * Kept intentionally focused on the diaspora regions Heritage Club serves,
 * with a generic fallback so no family is excluded.
 */

export const COUNTRIES = [
  'Canada',
  'United States',
  'United Kingdom',
  'Ireland',
  'France',
  'Germany',
  'Netherlands',
  'Belgium',
  'Italy',
  'Spain',
  'Sweden',
  'Norway',
  'Denmark',
  'Switzerland',
  'United Arab Emirates',
  'Qatar',
  'Saudi Arabia',
  'Australia',
  'New Zealand',
  'South Africa',
  'Nigeria',
  'Ghana',
  'Kenya',
  'Other',
] as const

/** IANA timezone → friendly label, grouped loosely by region. */
export const TIMEZONES: { value: string; label: string }[] = [
  { value: 'America/Vancouver', label: 'Pacific — Vancouver, Los Angeles (PST/PDT)' },
  { value: 'America/Edmonton', label: 'Mountain — Calgary, Denver (MST/MDT)' },
  { value: 'America/Chicago', label: 'Central — Winnipeg, Chicago (CST/CDT)' },
  { value: 'America/Toronto', label: 'Eastern — Toronto, New York (EST/EDT)' },
  { value: 'America/Halifax', label: 'Atlantic — Halifax (AST/ADT)' },
  { value: 'America/Sao_Paulo', label: 'Brazil — São Paulo (BRT)' },
  { value: 'Europe/London', label: 'UK & Ireland — London, Dublin (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central Europe — Paris, Berlin (CET/CEST)' },
  { value: 'Europe/Athens', label: 'Eastern Europe — Athens (EET/EEST)' },
  { value: 'Africa/Lagos', label: 'West Africa — Lagos, Accra (WAT)' },
  { value: 'Africa/Nairobi', label: 'East Africa — Nairobi (EAT)' },
  { value: 'Africa/Johannesburg', label: 'Southern Africa — Johannesburg (SAST)' },
  { value: 'Asia/Dubai', label: 'Gulf — Dubai, Abu Dhabi (GST)' },
  { value: 'Australia/Sydney', label: 'Australia — Sydney (AEST/AEDT)' },
]

/** Weekend-oriented class availability windows learners can opt into. */
export const AVAILABILITY_OPTIONS = [
  'Saturday morning',
  'Saturday afternoon',
  'Saturday evening',
  'Sunday morning',
  'Sunday afternoon',
  'Sunday evening',
] as const

export const RELATIONSHIPS = ['Parent', 'Guardian', 'Grandparent', 'Other family'] as const
