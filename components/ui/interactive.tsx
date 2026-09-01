'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

/* ---------------- Table (responsive: cards on mobile) ---------------- */

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  className?: string
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, empty, onRowClick }: { columns: Column<T>[]; rows: T[]; empty?: ReactNode; onRowClick?: (row: T) => void }) {
  if (!rows.length && empty) return <>{empty}</>
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Desktop table */}
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-5 py-3.5 font-medium">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr 
              key={i} 
              className="border-t border-border cursor-pointer hover:bg-secondary/50 transition" 
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('px-5 py-4', c.className)}>{c.render ? c.render(row) : String(row[c.key] ?? '—')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* Mobile cards */}
      <div className="divide-y divide-border sm:hidden">
        {rows.map((row, i) => (
          <div 
            key={i} 
            className="space-y-2 p-4 cursor-pointer hover:bg-secondary/50 transition" 
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((c) => (
              <div key={c.key} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{c.header}</span>
                <span className="text-right font-medium">{c.render ? c.render(row) : String(row[c.key] ?? '—')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Tabs ---------------- */

export function Tabs({ tabs, value, onChange }: { tabs: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          className={cn(
            'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
            value === t.key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ---------------- Modal ---------------- */

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-in-fade" onClick={onClose}>
      <div
        className="animate-in-pop max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="font-serif text-2xl">{title}</h3>}
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------- Toast ---------------- */

type Toast = { id: number; message: string; tone: 'success' | 'error' | 'info' }
const ToastCtx = createContext<{ push: (message: string, tone?: Toast['tone']) => void }>({ push: () => {} })
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id))
  const push = (message: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    setTimeout(() => dismiss(id), 4000)
  }
  const icon = { success: CheckCircle2, error: XCircle, info: Info }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col gap-2.5">
        {toasts.map((t) => {
          const Icon = icon[t.tone]
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'animate-in-toast flex items-start gap-3 rounded-xl border bg-card px-4 py-3 text-sm shadow-lg shadow-foreground/5',
                t.tone === 'success' && 'border-emerald-500/30',
                t.tone === 'error' && 'border-red-500/30',
                t.tone === 'info' && 'border-border',
              )}
            >
              <Icon
                size={18}
                className={cn(
                  'mt-0.5 shrink-0',
                  t.tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
                  t.tone === 'error' && 'text-red-600 dark:text-red-400',
                  t.tone === 'info' && 'text-muted-foreground',
                )}
              />
              <span className="flex-1 leading-5 text-foreground">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 shrink-0 rounded-md p-0.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
