'use client'

import { useCallback, useEffect, useState } from 'react'

async function parse(res: Response) {
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`)
  return json.data
}

/** POST/PUT/PATCH/DELETE JSON helper. */
export async function apiSend<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return parse(res)
}

export const apiPost = <T = unknown>(url: string, body?: unknown) => apiSend<T>(url, 'POST', body)
export const apiPut = <T = unknown>(url: string, body?: unknown) => apiSend<T>(url, 'PUT', body)
export const apiPatch = <T = unknown>(url: string, body?: unknown) => apiSend<T>(url, 'PATCH', body)
export const apiDelete = <T = unknown>(url: string) => apiSend<T>(url, 'DELETE')

/** Client-side data fetching hook with loading + error + refetch. */
export function useApi<T = unknown>(url: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!url)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!url) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(url)
      setData(await parse(res))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [url])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { data, loading, error, refetch, setData }
}
