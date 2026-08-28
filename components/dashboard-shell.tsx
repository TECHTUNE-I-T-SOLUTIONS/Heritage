'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, BookOpen, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, FileText,
  Gauge, GraduationCap, LayoutDashboard, LogOut, Menu, MessageSquareQuote,
  Settings, Shapes, ShieldCheck, Sparkles, Trophy, UserCircle, Users, Wallet, X, ClipboardList,
} from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { Modal } from '@/components/ui/interactive'
import { initials } from '@/lib/format'
import { apiPost } from '@/lib/client'

type Icon = ComponentType<{ size?: number | string; className?: string }>
type NavItem = [href: string, label: string, icon: Icon, reqAdminRole?: string]
export type ShellRole = 'student' | 'parent' | 'educator' | 'admin'

const roleLinks: Record<ShellRole, NavItem[]> = {
  student: [
    ['/dashboard/student', 'Dashboard', LayoutDashboard],
    ['/dashboard/student/classes', 'Classes', CalendarDays],
    ['/dashboard/student/quizzes', 'Quizzes', CheckCircle2],
    ['/dashboard/student/assignments', 'Assignments', FileText],
    ['/dashboard/student/leaderboard', 'Leaderboard', Trophy],
    ['/dashboard/student/progress', 'My Progress', BarChart3],
    ['/dashboard/student/testimonials', 'Testimonials', MessageSquareQuote],
    ['/dashboard/student/profile', 'Profile', UserCircle],
  ],
  parent: [
    ['/dashboard/parent', 'Overview', LayoutDashboard],
    ['/dashboard/parent/children', 'My Children', Users],
    ['/dashboard/parent/progress', 'Progress', BarChart3],
    ['/dashboard/parent/subscription', 'Subscription', CreditCard],
    ['/dashboard/parent/payments', 'Payments', Wallet],
    ['/dashboard/parent/settings', 'Settings', Settings],
  ],
  educator: [
    ['/dashboard/educator', 'Overview', LayoutDashboard],
    ['/dashboard/educator/students', 'Students', Users],
    ['/dashboard/educator/lessons', 'Lessons', BookOpen],
    ['/dashboard/educator/quizzes', 'Quizzes', CheckCircle2],
    ['/dashboard/educator/assignments', 'Assignments', FileText],
    ['/dashboard/educator/progress', 'Progress', BarChart3],
    ['/dashboard/educator/testimonials', 'Testimonials', MessageSquareQuote],
  ],
  admin: [
    ['/dashboard/admin', 'Overview', LayoutDashboard],
    ['/dashboard/admin/users', 'Users', Users],
    ['/dashboard/admin/students', 'Students', GraduationCap],
    ['/dashboard/admin/parents', 'Parents', Users],
    ['/dashboard/admin/educators', 'Educators', GraduationCap],
    ['/dashboard/admin/admins', 'Admins', ShieldCheck, 'super'],
    ['/dashboard/admin/cohorts', 'Cohorts', Shapes],
    ['/dashboard/admin/curriculum', 'Curriculum', BookOpen],
    ['/dashboard/admin/lessons', 'Lessons', BookOpen],
    ['/dashboard/admin/quizzes', 'Quizzes', CheckCircle2],
    ['/dashboard/admin/assignments', 'Assignments', FileText],
    ['/dashboard/admin/submissions', 'Submissions', FileText],
    ['/dashboard/admin/gamification', 'Gamification', Sparkles],
    ['/dashboard/admin/subscriptions', 'Subscriptions', CreditCard],
    ['/dashboard/admin/payments', 'Payments', Wallet],
    ['/dashboard/admin/testimonials', 'Testimonials', MessageSquareQuote],
    ['/dashboard/admin/marketing', 'Marketing Mailer', Sparkles],
    ['/dashboard/admin/waitlist', 'Waitlist Leads', ClipboardList],
    ['/dashboard/admin/plans', 'Pricing Settings', CreditCard],
    ['/dashboard/admin/website-content', 'Website Content', BookOpen],
    ['/dashboard/admin/moderation', 'Moderation', ShieldCheck],
    ['/dashboard/admin/analytics', 'Analytics', Gauge],
    ['/dashboard/admin/settings', 'Settings', Settings],
  ],
}

const roleLabel: Record<ShellRole, string> = { student: 'Student', parent: 'Parent', educator: 'Educator', admin: 'Admin' }

export interface ShellUser {
  name: string
  email?: string
  detail?: string
  avatarUrl?: string
  userId?: string
  switchedFromParentName?: string
  adminRole?: string
}

function Avatar({ user, size = 36, className = '' }: { user: ShellUser; size?: number; className?: string }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [broken, setBroken] = useState(false)

  // Pull the freshest avatar (session cookie doesn't carry it).
  useEffect(() => {
    if (user.avatarUrl !== undefined) return
    let alive = true
    fetch('/api/account')
      .then((r) => r.json())
      .then((j) => { if (alive && j?.data?.avatarUrl) setAvatarUrl(j.data.avatarUrl) })
      .catch(() => { })
    return () => { alive = false }
  }, [user.avatarUrl])

  if (avatarUrl && !broken) {
    return (
      <Image
        src={avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        unoptimized
        onError={() => setBroken(true)}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(user.name)}
    </div>
  )
}

function ProfileMenu({ role, user, onSignOut }: { role: ShellRole; user: ShellUser; onSignOut: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onEsc) }
  }, [open])

  const profileHref = role === 'student' ? '/dashboard/student/profile' : `/dashboard/${role}/settings`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-2 ring-offset-background transition hover:ring-2 hover:ring-accent/40 focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Avatar user={user} size={36} />
      </button>

      {open && (
        <div className="animate-in-pop absolute right-0 top-12 z-50 w-64 origin-top-right overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center gap-3 border-b border-border bg-secondary/40 p-4">
            <Avatar user={user} size={44} />
            <div className="min-w-0">
              <p className="truncate font-medium leading-tight">{user.name}</p>
              {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
              <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">{roleLabel[role]}</span>
            </div>
          </div>
          <div className="p-1.5">
            <Link href={profileHref} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <UserCircle size={16} /> {role === 'student' ? 'My profile' : 'Account settings'}
            </Link>
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <BookOpen size={16} /> Visit site
            </Link>
            <button type="button" onClick={onSignOut} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function DashboardShell({ role, user, children }: { role: ShellRole; user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false) // mobile drawer
  const [collapsed, setCollapsed] = useState(false) // desktop rail
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  let links = roleLinks[role]

  // Filter admin links if user is not super
  if (role === 'admin' && user.adminRole !== 'super') {
    links = links.filter((link) => link[3] !== 'super')
  }

  // Restore collapsed preference.
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('hc-sidebar-collapsed') === '1') } catch { }
  }, [])
  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v
      try { localStorage.setItem('hc-sidebar-collapsed', next ? '1' : '0') } catch { }
      return next
    })
  }

  async function doSignOut() {
    setSigningOut(true)
    try { await apiPost('/api/auth/logout') } catch { }
    router.push('/login')
  }

  const railWidth = collapsed ? 'lg:w-20' : 'lg:w-72'
  const contentPad = collapsed ? 'lg:pl-20' : 'lg:pl-72'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {open && <div className="fixed inset-0 z-30 bg-foreground/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card transition-all duration-300 lg:translate-x-0 ${railWidth} ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className={`flex items-center py-5 ${collapsed ? 'lg:justify-center lg:px-0 px-6 justify-between' : 'justify-between px-6'}`}>
          <span className={collapsed ? 'lg:hidden' : ''}><Logo /></span>
          {collapsed && <span className="hidden lg:block"><Logo showText={false} /></span>}
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20} /></button>
        </div>

        {!collapsed && (
          <div className="mx-6 rounded-2xl bg-secondary p-4">
            <p className="text-xs uppercase tracking-[.18em] text-muted-foreground">{roleLabel[role]} space</p>
            <p className="mt-1.5 truncate font-medium">{user.name}</p>
            {user.detail && <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.detail}</p>}
          </div>
        )}

        <nav className={`mt-6 flex-1 space-y-1 overflow-y-auto pb-4 ${collapsed ? 'lg:px-3 px-4' : 'px-4'}`}>
          {links.map(([href, label, Icon]) => {
            const active = pathname === href
            return (
              <div key={href} className="group/navitem relative">
                <Link
                  onClick={() => setOpen(false)}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <Icon size={18} />
                  <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
                </Link>
                {/* Tooltip when collapsed (desktop only) */}
                {collapsed && (
                  <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity duration-150 group-hover/navitem:opacity-100 lg:block">
                    {label}
                  </span>
                )}
              </div>
            )
          })}
        </nav>

        <div className="group/navitem relative m-4">
          <button
            onClick={() => setConfirmSignOut(true)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <LogOut size={18} /><span className={collapsed ? 'lg:hidden' : ''}>Sign out</span>
          </button>
          {collapsed && (
            <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background opacity-0 shadow-lg transition-opacity group-hover/navitem:opacity-100 lg:block">Sign out</span>
          )}
        </div>
      </aside>

      {/* Divider-attached collapse toggle (desktop aesthetic) */}
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={`fixed top-[4.5rem] z-40 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all duration-300 hover:text-foreground hover:shadow-lg lg:flex ${collapsed ? 'left-[4.25rem]' : 'left-[17.25rem]'}`}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      <div className={`transition-all duration-300 ${contentPad}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-2">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button>
            <p className="hidden text-sm text-muted-foreground lg:block">{role === 'admin' ? 'Operations centre' : 'Welcome back'}</p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="hidden rounded-full border border-border px-4 py-2 text-sm sm:block">Visit site</Link>
            <ProfileMenu role={role} user={user} onSignOut={() => setConfirmSignOut(true)} />
          </div>
        </header>
        <main className="animate-in-fade mx-auto max-w-7xl p-5 lg:p-8">
          {user.switchedFromParentName && (
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 px-5 py-3 text-sm text-yellow-500">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                <span>Logged in as <strong>{user.name}</strong> (Viewing child portal via parent <strong>{user.switchedFromParentName}</strong>)</span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await apiPost('/api/auth/switch', { action: 'parent' })
                    window.location.href = '/dashboard/parent'
                  } catch (e) {
                    alert('Could not switch back to parent dashboard.')
                  }
                }}
                className="rounded-full bg-yellow-500 px-4 py-1.5 text-xs font-semibold text-black hover:bg-yellow-400 transition"
              >
                Back to Parent dashboard
              </button>
            </div>
          )}
          {children}
        </main>
      </div>

      <Modal
        open={confirmSignOut}
        onClose={() => { if (!signingOut) setConfirmSignOut(false) }}
        title="Sign out?"
        footer={
          <>
            <button
              type="button"
              disabled={signingOut}
              onClick={() => setConfirmSignOut(false)}
              className="h-11 rounded-full border border-border px-6 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={signingOut}
              onClick={doSignOut}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-red-600 px-6 text-sm font-medium text-white transition hover:bg-red-600/90 disabled:opacity-60"
            >
              <LogOut size={16} /> {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          You’ll be returned to the login page and will need to sign in again to access your dashboard.
        </p>
      </Modal>
    </div>
  )
}

