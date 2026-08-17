'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react'

export function Field({ label, hint, error, children }: { label?: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      {label && <span className="font-medium">{label}</span>}
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  )
}

const base =
  'h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40 disabled:opacity-50'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(base, className)} {...props} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(base, 'appearance-none bg-background', className)} {...props}>
      {children}
    </select>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('min-h-28 w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40', className)} {...props} />
})

/** Simple URL-based uploader placeholder — real storage provider can be wired later. */
export function FileUploader({ onAdd, accept = 'documents, images, audio, video' }: { onAdd: (url: string, name: string) => void; accept?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-center text-sm">
      <p className="font-medium">Add your work</p>
      <p className="mt-1 text-xs text-muted-foreground">Paste a link to your {accept}. File storage can be connected to a provider later.</p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const url = (form.elements.namedItem('url') as HTMLInputElement).value.trim()
          const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim()
          if (url) {
            onAdd(url, name || url)
            form.reset()
          }
        }}
      >
        <input name="name" placeholder="Title" className={cn(base, 'sm:flex-1')} />
        <input name="url" placeholder="https://…" className={cn(base, 'sm:flex-[2]')} />
        <button className="h-11 shrink-0 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Attach</button>
      </form>
    </div>
  )
}
