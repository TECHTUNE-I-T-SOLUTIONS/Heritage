'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { useApi, apiPatch, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton } from '@/components/ui/kit'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { useToast } from '@/components/ui/interactive'
import { initials } from '@/lib/format'
import { COUNTRIES, TIMEZONES } from '@/lib/options'

interface Profile {
  _id?: string
  fullName?: string
  preferredName?: string
  email?: string
  phone?: string
  country?: string
  timezone?: string
  bio?: string
  role?: string
  avatarUrl?: string
}

const ACCEPT = 'image/png,image/jpeg,image/jpg'
const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_BYTES = 3 * 1024 * 1024

export function SettingsForm({ showBio = false }: { showBio?: boolean }) {
  const { data, loading, error } = useApi<Profile>('/api/account')
  const { push } = useToast()
  const [form, setForm] = useState<Profile>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarBroken, setAvatarBroken] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (data) {
      setForm(data)
      setAvatarUrl(data.avatarUrl)
    }
  }, [data])

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED.includes(file.type.toLowerCase())) return push('Only PNG, JPG and JPEG images are allowed.', 'error')
    if (file.size > MAX_BYTES) return push('Image is too large. Max size is 3MB.', 'error')
    setUploadingAvatar(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/account/avatar', { method: 'POST', body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setAvatarBroken(false)
      setAvatarUrl(json.data.avatarUrl)
      push('Profile picture updated.')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not upload image', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true)
    try {
      const res = await fetch('/api/account/avatar', { method: 'DELETE' })
      if (!res.ok) throw new Error('Could not remove image')
      setAvatarUrl(undefined)
      push('Profile picture removed.')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not remove image', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await apiPatch('/api/account', {
        fullName: form.fullName,
        preferredName: form.preferredName,
        phone: form.phone,
        country: form.country,
        timezone: form.timezone,
        ...(showBio ? { bio: form.bio } : {}),
      })
      push('Profile updated.')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not save', 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pw.newPassword !== pw.confirm) return push('Passwords do not match.', 'error')
    setSavingPw(true)
    try {
      await apiPost('/api/account/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword })
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      push('Password changed.')
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not change password', 'error')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <>
      <PageHeading eyebrow="Settings" title="Your account." description="Keep your profile and security up to date." />
      {loading && <Skeleton className="h-64" />}
      {error && <EmptyState title="Couldn't load your account" description={error} />}

      {data && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="lg:col-span-2">
            <h3 className="font-serif text-xl">Profile picture</h3>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPG or JPEG · up to 3MB.</p>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <div className="relative">
                {avatarUrl && !avatarBroken ? (
                  <Image
                    src={avatarUrl}
                    alt={form.fullName ?? 'Profile'}
                    width={80}
                    height={80}
                    unoptimized
                    onError={() => setAvatarBroken(true)}
                    className="h-20 w-20 rounded-2xl object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent text-2xl font-semibold text-accent-foreground">
                    {initials(form.fullName)}
                  </div>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 grid place-items-center rounded-2xl bg-foreground/40">
                    <Loader2 className="h-6 w-6 animate-spin text-background" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={onPickAvatar} />
                <button type="button" disabled={uploadingAvatar} onClick={() => fileRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60">
                  <Upload size={15} /> {avatarUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarUrl && !avatarBroken && (
                  <button type="button" disabled={uploadingAvatar} onClick={removeAvatar} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-60">
                    <Trash2 size={15} /> Remove
                  </button>
                )}
              </div>
            </div>
          </Card>
          <Card>
            <h3 className="font-serif text-xl">Profile</h3>
            <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}>
              <Field label="Full name"><Input value={form.fullName ?? ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
              <Field label="Preferred name"><Input value={form.preferredName ?? ''} onChange={(e) => setForm({ ...form, preferredName: e.target.value })} /></Field>
              <Field label="Email"><Input value={form.email ?? ''} disabled /></Field>
              <Field label="Phone"><Input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              <Field label="Country">
                <Select value={form.country ?? ''} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Time zone">
                <Select value={form.timezone ?? ''} onChange={(e) => setForm({ ...form, timezone: e.target.value })}>
                  <option value="" disabled>Select time zone</option>
                  {TIMEZONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              {showBio && <div className="sm:col-span-2"><Field label="Bio"><Textarea value={form.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field></div>}
              <div className="sm:col-span-2"><button disabled={savingProfile} className="h-11 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60">{savingProfile ? 'Saving…' : 'Save profile'}</button></div>
            </form>
          </Card>
          <Card>
            <h3 className="font-serif text-xl">Password</h3>
            <form className="mt-5 grid gap-4" onSubmit={changePassword}>
              <Field label="Current password"><Input type="password" required value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
              <Field label="New password"><Input type="password" required value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} placeholder="At least 8 characters" /></Field>
              <Field label="Confirm new password"><Input type="password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              <div><button disabled={savingPw} className="h-11 rounded-full border border-border px-6 text-sm font-medium hover:bg-secondary disabled:opacity-60">{savingPw ? 'Updating…' : 'Change password'}</button></div>
            </form>
          </Card>
        </div>
      )}
    </>
  )
}
