/**
 * Timezone utilities for handling Canada (PST/PDT), Nigeria (WAT), and user local timezone conversions
 * 
 * Nigeria uses WAT (West Africa Time) = UTC+1 year-round
 * Canada uses PST (Pacific Standard Time) = UTC-8 in winter
 * Canada uses PDT (Pacific Daylight Time) = UTC-7 in summer (March-November)
 */

export type Timezone = 'PST' | 'PDT' | 'WAT' | 'LOCAL'

/**
 * Convert a date/time string from one timezone to another
 */
export function convertTimezone(
  date: Date | string,
  fromTimezone: Timezone,
  toTimezone: Timezone
): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  
  const offsets: Record<Timezone, number> = {
    PST: -8, // UTC-8
    PDT: -7, // UTC-7
    WAT: 1,  // UTC+1
  }
  
  const offsetMs = (offsets[toTimezone] - offsets[fromTimezone]) * 60 * 60 * 1000
  return new Date(utc + offsetMs)
}

/**
 * Get the current Canada timezone (PST or PDT based on date)
 */
export function getCanadaTimezone(date: Date = new Date()): 'PST' | 'PDT' {
  // Daylight saving time in Canada: Second Sunday in March to first Sunday in November
  const year = date.getFullYear()
  
  // Calculate second Sunday in March
  const marchStart = new Date(year, 2, 1)
  const marchSunday = 2 - marchStart.getDay()
  const marchSecondSunday = new Date(year, 2, marchSunday + 14)
  
  // Calculate first Sunday in November
  const novemberStart = new Date(year, 10, 1)
  const novemberSunday = 2 - novemberStart.getDay()
  const novemberFirstSunday = new Date(year, 10, novemberSunday + 7)
  
  if (date >= marchSecondSunday && date < novemberFirstSunday) {
    return 'PDT' // Daylight time
  }
  return 'PST' // Standard time
}

/**
 * Convert Nigeria time (WAT) to Canada time (PST/PDT)
 */
export function nigeriaToCanada(nigeriaTime: Date | string): Date {
  const canadaTimezone = getCanadaTimezone(typeof nigeriaTime === 'string' ? new Date(nigeriaTime) : nigeriaTime)
  return convertTimezone(nigeriaTime, 'WAT', canadaTimezone)
}

/**
 * Convert Canada time (PST/PDT) to Nigeria time (WAT)
 */
export function canadaToNigeria(canadaTime: Date | string): Date {
  const canadaTimezone = getCanadaTimezone(typeof canadaTime === 'string' ? new Date(canadaTime) : canadaTime)
  return convertTimezone(canadaTime, canadaTimezone, 'WAT')
}

/**
 * Format time for display with timezone label
 */
export function formatTimeWithTimezone(date: Date, timezone: Timezone): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes} ${timezone}`
}

/**
 * Get time difference in hours between two timezones
 */
export function getTimezoneDifference(from: Timezone, to: Timezone): number {
  const offsets: Record<Timezone, number> = {
    PST: -8,
    PDT: -7,
    WAT: 1,
  }
  return offsets[to] - offsets[from]
}

/**
 * Convert a time string (HH:MM) from Nigeria to Canada
 * Returns { time: string, timezone: 'PST' | 'PDT' }
 */
export function convertNigeriaTimeToCanada(timeStr: string): { time: string; timezone: 'PST' | 'PDT' } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const nigeriaDate = new Date()
  nigeriaDate.setHours(hours, minutes, 0, 0)
  
  const canadaDate = nigeriaToCanada(nigeriaDate)
  const canadaTimezone = getCanadaTimezone(canadaDate)
  
  const canadaHours = canadaDate.getHours().toString().padStart(2, '0')
  const canadaMinutes = canadaDate.getMinutes().toString().padStart(2, '0')
  
  return {
    time: `${canadaHours}:${canadaMinutes}`,
    timezone: canadaTimezone,
  }
}

/**
 * Convert a time string (HH:MM) from Canada to Nigeria
 * Returns { time: string, timezone: 'WAT' }
 */
export function convertCanadaTimeToNigeria(timeStr: string, canadaTimezone?: 'PST' | 'PDT'): { time: string; timezone: 'WAT' } {
  const tz = canadaTimezone || getCanadaTimezone()
  const [hours, minutes] = timeStr.split(':').map(Number)
  const canadaDate = new Date()
  canadaDate.setHours(hours, minutes, 0, 0)
  
  const nigeriaDate = canadaToNigeria(canadaDate)
  
  const nigeriaHours = nigeriaDate.getHours().toString().padStart(2, '0')
  const nigeriaMinutes = nigeriaDate.getMinutes().toString().padStart(2, '0')
  
  return {
    time: `${nigeriaHours}:${nigeriaMinutes}`,
    timezone: 'WAT',
  }
}

/**
 * Get the user's local timezone offset in hours from UTC
 */
export function getLocalTimezoneOffset(): number {
  return -(new Date().getTimezoneOffset() / 60)
}

/**
 * Get the user's local timezone name (IANA format)
 */
export function getLocalTimezoneName(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert Nigeria time to user's local timezone
 */
export function nigeriaToLocal(nigeriaTime: Date | string): { time: string; timezone: string } {
  const nigeriaDate = typeof nigeriaTime === 'string' ? new Date(nigeriaTime) : nigeriaTime
  const utc = nigeriaDate.getTime() + nigeriaDate.getTimezoneOffset() * 60000
  
  const localOffset = getLocalTimezoneOffset()
  const localTime = new Date(utc + localOffset * 60 * 60 * 1000)
  
  const hours = localTime.getHours().toString().padStart(2, '0')
  const minutes = localTime.getMinutes().toString().padStart(2, '0')
  const timezone = getLocalTimezoneName()
  
  return {
    time: `${hours}:${minutes}`,
    timezone: timezone || 'Local',
  }
}

/**
 * Convert a time string (HH:MM) from Nigeria to user's local timezone
 */
export function convertNigeriaTimeToLocal(timeStr: string): { time: string; timezone: string } {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const nigeriaDate = new Date()
  nigeriaDate.setHours(hours, minutes, 0, 0)
  
  return nigeriaToLocal(nigeriaDate)
}

/**
 * Format time with user's local timezone
 */
export function formatLocalTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZoneName: 'short'
  })
}
