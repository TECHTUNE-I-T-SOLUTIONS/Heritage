'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), [])
  function toggle() {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('hc-theme', next ? 'dark' : 'light') } catch {}
    setDark(next)
  }
  return (
    <button type="button" onClick={toggle} aria-label="Toggle theme" className="rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
