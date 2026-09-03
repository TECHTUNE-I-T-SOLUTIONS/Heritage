import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'

const links: [string, string][] = [
  ['About', '/about'],
  ['How it works', '/how-it-works'],
  ['Pricing', '/pricing'],
  ['Contact', '/contact'],
]

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm text-muted-foreground transition hover:text-foreground">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="hidden text-sm sm:block">Sign in</Link>
          <Link href="/enroll" className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90">Enroll now</Link>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted-foreground">A modern cultural learning experience helping the next generation connect with their African heritage.</p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium">Discover</p>
            <div className="mt-4 grid gap-3">
              {links.map(([label, href]) => (
                <Link key={href} href={href} className="text-sm text-muted-foreground hover:text-foreground">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Join</p>
            <div className="mt-4 grid gap-3">
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="/enroll" className="text-sm text-muted-foreground hover:text-foreground">Enroll</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Legal</p>
            <div className="mt-4 grid gap-3">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link>
              <Link href="/refund" className="text-sm text-muted-foreground hover:text-foreground">Refund &amp; Cancellation</Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-border px-5 py-5 text-xs text-muted-foreground lg:px-8">© 2026 Heritage Club. All rights reserved.</div>
    </footer>
  )
}

export function PublicChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  )
}
