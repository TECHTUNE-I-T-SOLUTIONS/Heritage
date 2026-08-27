'use client'

import { useState, useEffect } from 'react'
import { ClipboardList, Calendar, Send, Check, X, Eye, Edit2, Trash2 } from 'lucide-react'
import { useApi, apiPost, apiPatch } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { DataTable, type Column, Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/format'

interface WaitlistLead {
  id: string
  name: string
  email: string
  role: 'parent' | 'student'
  childrenCount: number | null
  parentEmail: string | null
  createdAt: string
}

interface SettingsResponse {
  basePrice: number
  discounts: number[]
  launchDate: string
}

const EMAIL_TEMPLATES = [
  {
    key: 'custom',
    label: 'Blank / Custom Email ✍️',
    subject: '',
    body: ''
  },
  {
    key: 'launch_day',
    label: 'Launch Day Announcement 🚀',
    subject: 'Heritage Club is officially open! 🚀',
    body: `Hello {{name}},\n\nThe wait is finally over! We are absolutely thrilled to announce that Heritage Club has officially launched.\n\nYour spot on the pre-launch waitlist guarantees you priority access to our platform. You can now enroll your children or join as an independent student to secure weekend live slots and explore our cultural curriculum modules.\n\nClick the link below to get started and complete your registration:\nhttps://heritage.damzynextgen.app/enroll\n\nWe cannot wait to welcome you to the Heritage Club family!\n\nBest regards,\nThe Heritage Club Team`
  },
  {
    key: 'one_week_reminder',
    label: 'One Week to Launch Reminder 📅',
    subject: '1 Week to Launch: Get ready for Heritage Club! 📅',
    body: `Hello {{name}},\n\nWe are exactly one week away from the official launch of Heritage Club!\n\nOur team of educators is putting the finishing touches on our interactive learning space, live weekend slots, and cultural gamification modules. As a waitlist member, you will receive priority sign-up links 24 hours before the general public.\n\nKeep an eye on your inbox next week!\n\nWarm regards,\nThe Heritage Club Team`
  }
]

export default function AdminWaitlist() {
  const { data: leads, loading: loadingLeads, error: errorLeads, refetch: refetchLeads } = useApi<WaitlistLead[]>('/api/admin/waitlist')
  const { data: settings, refetch: refetchSettings } = useApi<SettingsResponse>('/api/admin/settings')
  const { push } = useToast()

  const [launchDate, setLaunchDate] = useState('')
  const [busy, setBusy] = useState(false)

  // Mailer states
  const [templateKey, setTemplateKey] = useState('custom')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [fromAlias, setFromAlias] = useState<'support' | 'finance' | 'admin' | 'hello' | 'no-reply'>('hello')
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)

  function handleTemplateChange(key: string) {
    setTemplateKey(key)
    const tmpl = EMAIL_TEMPLATES.find((t) => t.key === key)
    if (tmpl) {
      setSubject(tmpl.subject)
      setBody(tmpl.body)
    }
  }

  // Edit / Delete states
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<WaitlistLead | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'parent', childrenCount: 1, parentEmail: '' })

  useEffect(() => {
    if (settings?.launchDate) {
      setLaunchDate(settings.launchDate.split('T')[0])
    }
  }, [settings])

  async function handleSaveLaunch() {
    setBusy(true)
    try {
      await apiPatch('/api/admin/settings', { launchDate: launchDate ? new Date(launchDate).toISOString() : '' })
      push('Launch countdown date saved!')
      refetchSettings()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not save launch date', 'error')
    } finally { setBusy(false) }
  }

  // Filtered Leads
  const filteredLeads = (leads ?? []).filter((l) => {
    const matchesRole = roleFilter === 'all' || l.role === roleFilter
    const matchesSearch = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  function toggleSelectAll() {
    const filteredEmails = filteredLeads.map((l) => l.email)
    const allSelected = filteredEmails.every((email) => selectedEmails.includes(email))

    if (allSelected) {
      setSelectedEmails(selectedEmails.filter((email) => !filteredEmails.includes(email)))
    } else {
      setSelectedEmails(Array.from(new Set([...selectedEmails, ...filteredEmails])))
    }
  }

  function toggleSelectOne(email: string) {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email))
    } else {
      setSelectedEmails([...selectedEmails, email])
    }
  }

  async function handleSendCampaign() {
    if (selectedEmails.length === 0) return push('Select recipients from the waitlist.', 'error')
    if (!subject.trim() || !body.trim()) return push('Fill subject and body content.', 'error')

    setBusy(true)
    try {
      await apiPost('/api/admin/waitlist', {
        subject,
        body,
        recipients: selectedEmails,
        fromAlias,
      })
      push(`Launch update email sent to ${selectedEmails.length} waitlist leads!`)
      setSubject('')
      setBody('')
      setSelectedEmails([])
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to send campaign', 'error')
    } finally { setBusy(false) }
  }

  // Edit action
  function openEditModal(lead: WaitlistLead) {
    setSelectedLead(lead)
    setEditForm({
      name: lead.name,
      email: lead.email,
      role: lead.role,
      childrenCount: lead.childrenCount ?? 1,
      parentEmail: lead.parentEmail ?? '',
    })
    setEditOpen(true)
  }

  async function handleSaveEdit() {
    if (!selectedLead) return
    setBusy(true)
    try {
      await apiPatch('/api/admin/waitlist', {
        id: selectedLead.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        childrenCount: Number(editForm.childrenCount),
        parentEmail: editForm.role === 'student' && editForm.parentEmail ? editForm.parentEmail : null,
      })
      push('Lead updated successfully!')
      setEditOpen(false)
      refetchLeads()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to update lead', 'error')
    } finally { setBusy(false) }
  }

  // Delete action
  function openDeleteModal(lead: WaitlistLead) {
    setSelectedLead(lead)
    setDeleteOpen(true)
  }

  async function handleDeleteLead() {
    if (!selectedLead) return
    setBusy(true)
    try {
      await fetch(`/api/admin/waitlist?id=${selectedLead.id}`, { method: 'DELETE' })
      push('Lead deleted successfully!')
      setDeleteOpen(false)
      refetchLeads()
    } catch (e) {
      push(e instanceof Error ? e.message : 'Failed to delete lead', 'error')
    } finally { setBusy(false) }
  }

  const columns: Column<any>[] = [
    {
      key: 'select_lead',
      header: 'Select',
      render: (r) => (
        <input
          type="checkbox"
          checked={selectedEmails.includes(r.email)}
          onChange={() => toggleSelectOne(r.email)}
          className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
          aria-label="Select lead"
        />
      ),
    },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (r) => (
        <Badge tone={r.role === 'parent' ? 'success' : 'neutral'} className="capitalize">
          {r.role}
        </Badge>
      ),
    },
    {
      key: 'childrenCount',
      header: 'Planned Enrollment',
      render: (r) => (r.role === 'parent' ? `${r.childrenCount ?? 1} Child(ren)` : r.parentEmail ? `Parent: ${r.parentEmail}` : 'N/A'),
    },
    { key: 'createdAt', header: 'Joined', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(r)} className="p-1 hover:text-accent transition" aria-label="Edit lead"><Edit2 size={14} /></button>
          <button onClick={() => openDeleteModal(r)} className="p-1 hover:text-red-500 transition" aria-label="Delete lead"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ]

  const previewHtml = `
    <html>
      <body style="font-family: sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <tr>
            <td style="background-color: #1a202c; padding: 20px; text-align: center;">
              <img src="https://heritage.damzynextgen.app/heritage.png" alt="Heritage Club Logo" style="height: 40px;">
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; color: #2d3748; line-height: 1.6;">
              ${body.replace(/\n/g, '<br />') || '<p style="color:#a0aec0">Start writing campaign content...</p>'}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f7fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #718096;">
              <p>&copy; ${new Date().getFullYear()} Heritage Club. All rights reserved.</p>
              <p style="font-size: 10px; color: #a0aec0;">
                General Directory: hello@damzynextgen.app | Support: support@damzynextgen.app
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  return (
    <>
      <PageHeading
        eyebrow="Pre-launch"
        title="Launch Countdown & Waitlist"
        description="Set launch dates (automatically locks login/signup portals behind countdown pages) and email prospective leads."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
        <div className="space-y-6">
          {/* Launch Date configurator */}
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2"><Calendar size={18} /> Launch Timeline</h2>
            <Field label="Launch countdown target date">
              <Input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
            </Field>
            <button
              onClick={handleSaveLaunch}
              disabled={busy}
              className="w-full inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground disabled:opacity-60 transition"
            >
              Set launch Countdown
            </button>
          </Card>

          {/* Email Campaign composer */}
          <Card className="p-5 space-y-4">
            <h2 className="text-base font-semibold">Email Leads</h2>
            <Field label="Choose Template">
              <Select value={templateKey} onChange={(e) => handleTemplateChange(e.target.value)}>
                {EMAIL_TEMPLATES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Sender Profile">
              <Select value={fromAlias} onChange={(e) => setFromAlias(e.target.value as any)}>
                <option value="hello">hello@damzynextgen.app</option>
                <option value="support">support@damzynextgen.app</option>
                <option value="admin">admin@damzynextgen.app</option>
                <option value="no-reply">no-reply@damzynextgen.app</option>
              </Select>
            </Field>
            <Field label="Subject">
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Heritage Club is officially open! 🚀" />
            </Field>
            <Field label="Message">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write launch notification email..." />
            </Field>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border text-sm hover:bg-secondary transition"
              >
                <Eye size={14} /> Preview
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={busy || selectedEmails.length === 0}
                className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60 transition"
              >
                <Send size={14} /> Send ({selectedEmails.length})
              </button>
            </div>
          </Card>
        </div>

        {/* Waitlist list */}
        <div className="space-y-4">
          <Card className="p-5 h-full flex flex-col">
            <h2 className="text-base font-semibold mb-4 flex items-center justify-between">
              <span>Waitlist Interest Leads</span>
              <Badge tone="accent">{(leads ?? []).length} leads</Badge>
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All Roles</option>
                <option value="parent">Parents</option>
                <option value="student">Students</option>
              </Select>
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search leads..." />
            </div>

            <div className="flex items-center justify-between mb-4">
              <button
                onClick={toggleSelectAll}
                className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary transition"
              >
                <Check size={12} /> Select All Filtered
              </button>
              <button
                onClick={() => setSelectedEmails([])}
                className="text-xs text-muted-foreground hover:text-red-500"
              >
                Clear Selection
              </button>
            </div>

            {loadingLeads && <Skeleton className="h-64" />}
            {errorLeads && <EmptyState title="Could not load leads" description={errorLeads} />}
            {leads && (
              <div className="flex-1">
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <DataTable columns={columns} rows={filteredLeads} empty={<EmptyState icon={<ClipboardList size={20} />} title="Waitlist is empty" description="Signups will show here." />} />
                </div>
                {/* Mobile View responsive card list */}
                <div className="md:hidden space-y-3">
                  {filteredLeads.length === 0 ? (
                    <EmptyState icon={<ClipboardList size={20} />} title="Waitlist is empty" description="Signups will show here." />
                  ) : (
                    filteredLeads.map((l) => (
                      <div key={l.id} className="border border-border dark:bg-[#141722] rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(l.email)}
                            onChange={() => toggleSelectOne(l.email)}
                            className="rounded text-primary focus:ring-primary h-4 w-4 border-gray-300"
                            aria-label="Select lead"
                          />
                          <Badge tone={l.role === 'parent' ? 'success' : 'neutral'} className="capitalize">{l.role}</Badge>
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{l.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{l.email}</p>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t border-border/50">
                          <span>Joined: {formatDate(l.createdAt)}</span>
                          <span>{l.role === 'parent' ? `${l.childrenCount ?? 1} Child(ren)` : l.parentEmail ? `Parent: ${l.parentEmail}` : 'N/A'}</span>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border/30">
                          <button
                            onClick={() => openEditModal(l)}
                            className="flex-1 inline-flex justify-center items-center gap-1 border border-border rounded-full py-1.5 text-[11px] font-semibold hover:bg-secondary transition"
                          >
                            <Edit2 size={10} /> Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(l)}
                            className="flex-1 inline-flex justify-center items-center gap-1 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-full py-1.5 text-[11px] font-semibold transition"
                          >
                            <Trash2 size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Waitlist Lead" footer={
        <>
          <button onClick={() => setEditOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleSaveEdit} disabled={busy} className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground font-semibold">Save Changes</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Full Name"><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></Field>
          <Field label="Email Address"><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></Field>
          <Field label="Role">
            <Select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
              <option value="parent">Parent</option>
              <option value="student">Student</option>
            </Select>
          </Field>
          {editForm.role === 'parent' ? (
            <Field label="Number of children">
              <Input type="number" value={editForm.childrenCount} onChange={(e) => setEditForm({ ...editForm, childrenCount: Number(e.target.value) })} />
            </Field>
          ) : (
            <Field label="Parent's Email (Optional)">
              <Input value={editForm.parentEmail} onChange={(e) => setEditForm({ ...editForm, parentEmail: e.target.value })} />
            </Field>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Lead?" footer={
        <>
          <button onClick={() => setDeleteOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Cancel</button>
          <button onClick={handleDeleteLead} disabled={busy} className="rounded-full bg-red-600 text-white px-5 py-2.5 text-sm font-semibold">Delete</button>
        </>
      }>
        <p className="text-sm text-muted-foreground">Are you sure you want to remove <strong>{selectedLead?.name}</strong> ({selectedLead?.email}) from the waitlist?</p>
      </Modal>

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Launch campaign preview" footer={
        <button onClick={() => setPreviewOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
      }>
        <div className="border border-border rounded-2xl overflow-hidden">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[50vh] border-0"
            title="Email Preview"
          />
        </div>
      </Modal>
    </>
  )
}
