'use client'

import { useState } from 'react'
import { Sparkles, Eye, Send, Paperclip, X, Check, Users } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Card, EmptyState, Skeleton, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Input, Select, Textarea } from '@/components/ui/form'

interface UserItem {
  id: string
  fullName: string
  email: string
  role: string
}

interface CohortItem {
  id: string
  code: string
  name: string
}

interface ApiResponse {
  users: UserItem[]
  cohorts: CohortItem[]
}

interface AttachmentFile {
  filename: string
  base64: string
  contentType: string
}

export default function AdminMarketing() {
  const { data, loading, error } = useApi<ApiResponse>('/api/admin/marketing')
  const { push } = useToast()

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [fromAlias, setFromAlias] = useState<'support' | 'finance' | 'admin' | 'hello' | 'no-reply'>('no-reply')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])

  // Recipient selection states
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const users = data?.users ?? []

  // Filtered users for selection list
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesRole && matchesSearch
  })

  // File upload converting to base64
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    filesArray.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1]
        setAttachments((prev) => [
          ...prev,
          {
            filename: file.name,
            base64: base64String,
            contentType: file.type,
          },
        ])
      }
      reader.readAsDataURL(file)
    })
  }

  function toggleSelectAll() {
    const filteredEmails = filteredUsers.map((u) => u.email)
    const allSelected = filteredEmails.every((email) => selectedEmails.includes(email))

    if (allSelected) {
      // Remove all filtered emails
      setSelectedEmails(selectedEmails.filter((email) => !filteredEmails.includes(email)))
    } else {
      // Add all filtered emails
      const newSelection = Array.from(new Set([...selectedEmails, ...filteredEmails]))
      setSelectedEmails(newSelection)
    }
  }

  function toggleSelectOne(email: string) {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter((e) => e !== email))
    } else {
      setSelectedEmails([...selectedEmails, email])
    }
  }

  async function handleSend() {
    if (selectedEmails.length === 0) return push('Select at least one recipient.', 'error')
    if (!subject.trim()) return push('Please add a subject line.', 'error')
    if (!body.trim()) return push('Please compose the email body.', 'error')

    setBusy(true)
    try {
      await apiPost('/api/admin/marketing', {
        subject,
        body,
        recipients: selectedEmails,
        fromAlias,
        attachments: attachments.length > 0 ? attachments : undefined,
      })
      push(`Bulk emails sent successfully to ${selectedEmails.length} recipients!`)
      setSubject('')
      setBody('')
      setAttachments([])
      setSelectedEmails([])
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not send marketing campaign', 'error')
    } finally { setBusy(false) }
  }

  // Construct standard HTML for Preview Modal
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
              ${body.replace(/\n/g, '<br />') || '<p style="color:#a0aec0">Start writing to preview details...</p>'}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f7fafc; padding: 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #718096;">
              <p>&copy; ${new Date().getFullYear()} Heritage Club. All rights reserved.</p>
              <p style="font-size: 10px; color: #a0aec0;">
                Support: support@damzynextgen.app | Finance: finance@damzynextgen.app
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
        eyebrow="Marketing"
        title="Marketing Mailer Console"
        description="Compose and dispatch premium notifications, announcements, and newsletters in bulk to your users."
      />

      {loading && <Skeleton className="h-96" />}
      {error && <EmptyState title="Couldn't load recipients" description={error} />}

      {data && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Email Composer Form */}
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold mb-2">Compose Email</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="From Sender Alias">
                <Select value={fromAlias} onChange={(e) => setFromAlias(e.target.value as any)}>
                  <option value="no-reply">no-reply@damzynextgen.app</option>
                  <option value="hello">hello@damzynextgen.app</option>
                  <option value="support">support@damzynextgen.app</option>
                  <option value="finance">finance@damzynextgen.app</option>
                  <option value="admin">admin@damzynextgen.app</option>
                </Select>
              </Field>
              <Field label="Subject Line">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Heritage Club updates, class starts, etc." />
              </Field>
            </div>

            <Field label="Email Content (Supports HTML / linebreaks)">
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} placeholder="Write your email contents here..." />
            </Field>

            {/* Attachments list */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attachments</label>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary transition bg-background">
                  <Paperclip size={14} />
                  <span>Upload Files</span>
                  <input type="file" multiple className="hidden" onChange={handleFileChange} />
                </label>

                {attachments.map((att, idx) => (
                  <Badge key={idx} tone="accent" className="flex items-center gap-1 py-1 px-3">
                    <span className="max-w-[120px] truncate">{att.filename}</span>
                    <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setPreviewOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-secondary"
              >
                <Eye className="h-4 w-4" /> Preview Email
              </button>
              <button
                onClick={handleSend}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60 font-semibold"
              >
                <Send className="h-4 w-4" /> {busy ? 'Sending Dispatch…' : 'Send Campaign'}
              </button>
            </div>
          </Card>

          {/* Recipient Selection Card */}
          <Card className="p-6 flex flex-col h-[75vh]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold flex items-center justify-between">
                <span>Select Recipients</span>
                <Badge tone="accent">{selectedEmails.length} selected</Badge>
              </h2>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="parent">Parents</option>
                  <option value="educator">Educators</option>
                  <option value="admin">Admins</option>
                </Select>
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name/email" />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs hover:bg-secondary transition"
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
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-border pr-2">
              {filteredUsers.length === 0 ? (
                <EmptyState icon={<Users size={16} />} title="No matches" description="Try adjusting your filters or search query." />
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedEmails.includes(u.email)
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectOne(u.email)}
                      className={`py-2 px-3 flex items-center justify-between cursor-pointer rounded-xl transition ${isSelected ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary' : 'hover:bg-secondary'}`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{u.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Badge tone={u.role === 'admin' ? 'error' : u.role === 'educator' ? 'warning' : 'success'} className="capitalize shrink-0">
                        {u.role}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Live Preview Modal */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Branded Email Preview" footer={
        <button onClick={() => setPreviewOpen(false)} className="rounded-full border border-border px-5 py-2.5 text-sm">Close</button>
      }>
        <div className="border border-border rounded-2xl overflow-hidden">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[50vh] border-0"
            title="Email Preview Frame"
          />
        </div>
      </Modal>
    </>
  )
}
