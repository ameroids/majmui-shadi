import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Field, Input, Checkbox } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getFamiliesWithInviteesForUser, getEvents, createInvitation,
  getInvitationsByUser, updateInvitationStatus,
} from '../lib/db'
import { generateMessage, buildWhatsappLink } from '../lib/messageTemplate'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
]

const STEPS = ['Select Family', 'Configure Invitation', 'Preview & Send']

export default function SendInvitationPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [families, setFamilies] = useState([])
  const [events, setEvents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    const [fam, evt, inv] = await Promise.all([
      getFamiliesWithInviteesForUser(user.id),
      getEvents(),
      getInvitationsByUser(user.id),
    ])
    setFamilies(fam)
    setEvents(evt)
    setInvitations(inv)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const handleOpenWhatsapp = async (invitation) => {
    if (window.Android && window.Android.shareToWhatsApp) {
      // Use Android native bridge (which can attach images)
      window.Android.shareToWhatsApp(invitation.recipient_mobile, invitation.generated_message)
    } else {
      // Fallback to standard web intent
      const link = buildWhatsappLink(invitation.recipient_mobile, invitation.generated_message)
      window.open(link, '_blank', 'noopener,noreferrer')
    }
    
    if (invitation.status === 'Ready') {
      await updateInvitationStatus(invitation.id, 'WhatsApp Opened')
      loadAll()
    }
  }

  const handleMarkSent = async (invitation) => {
    await updateInvitationStatus(invitation.id, 'Sent')
    showToast(`Marked ${invitation.surname} family's invitation as sent.`)
    loadAll()
  }

  return (
    <DashboardLayout navItems={NAV} activePath="/dashboard/send-invitation" roleLabel={user.role}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-emerald-deep">Send Invitation</h1>
          <p className="text-sm text-ink/60 mt-1 max-w-xl">
            One WhatsApp message per family. Choose a representative to receive it — the
            message will still name every invited member of that family.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} size="lg">+ New Invitation</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : invitations.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="✉"
            title="No invitations created yet"
            description="Start a new invitation to pick a family, a representative, and the events they're invited to."
            action={<Button onClick={() => setWizardOpen(true)}>+ New Invitation</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/45 bg-ivory-soft border-b border-ivory-line">
                  <th className="py-3 px-4 font-semibold">Family</th>
                  <th className="py-3 px-4 font-semibold">Members</th>
                  <th className="py-3 px-4 font-semibold">Events</th>
                  <th className="py-3 px-4 font-semibold">Recipient</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.id} className="border-b border-ivory-line last:border-0">
                    <td className="py-3 px-4 font-medium text-ink">{inv.surname}</td>
                    <td className="py-3 px-4 text-ink/70">{inv.invitee_ids.length}</td>
                    <td className="py-3 px-4 text-ink/70">{inv.event_names}</td>
                    <td className="py-3 px-4 text-ink/70">
                      {inv.recipient_name}
                      <div className="text-xs text-ink/40 font-mono">{inv.recipient_mobile}</div>
                    </td>
                    <td className="py-3 px-4"><Badge tone={inv.status}>{inv.status}</Badge></td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button variant="whatsapp" size="sm" onClick={() => handleOpenWhatsapp(inv)}>
                        {inv.status === 'Sent' ? 'Reopen' : 'Send on WhatsApp'}
                      </Button>
                      {inv.status !== 'Sent' && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkSent(inv)}>
                          Mark Sent
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <InvitationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        families={families}
        events={events}
        invitations={invitations}
        userId={user.id}
        userName={user.display_name}
        partnerName={user.partner_name}
        userRole={user.role}
        onCreated={() => {
          setWizardOpen(false)
          loadAll()
        }}
      />
    </DashboardLayout>
  )
}

function InvitationWizard({ open, onClose, families, events, invitations, userId, userName, partnerName, userRole, onCreated }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(0)
  const [familyId, setFamilyId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMemberEvents, setSelectedMemberEvents] = useState(new Set())
  const [representativeId, setRepresentativeId] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const family = families.find((f) => f.family_id === familyId)

  useEffect(() => {
    if (!open) {
      setStep(0); setFamilyId(''); setSearch(''); setSelectedMemberEvents(new Set())
      setRepresentativeId(''); setMessage('')
    }
  }, [open])

  useEffect(() => {
    if (family) {
      const initial = new Set()
      family.members.forEach(m => {
        events.forEach(e => initial.add(`${m.id}_${e.id}`))
      })
      setSelectedMemberEvents(initial)
      setRepresentativeId('')
    }
  }, [familyId]) // eslint-disable-line

  const filteredFamilies = useMemo(() => {
    if (!search.trim()) return families
    return families.filter((f) => f.surname.toLowerCase().includes(search.trim().toLowerCase()))
  }, [families, search])

  const activeMemberIds = new Set(Array.from(selectedMemberEvents).map(str => str.split('_')[0]))
  const activeEventIds = new Set(Array.from(selectedMemberEvents).map(str => str.split('_')[1]))

  const activeMembers = family ? family.members.filter(m => activeMemberIds.has(m.id)) : []
  const representative = activeMembers.find((m) => m.id === representativeId)
  const activeEvents = events.filter((e) => activeEventIds.has(e.id))

  const toggleMemberEvent = (memberId, eventId) => {
    setSelectedMemberEvents((prev) => {
      const next = new Set(prev)
      const key = `${memberId}_${eventId}`
      if (next.has(key)) {
        next.delete(key)
        // If this was the last event for the representative, clear rep
        const stillHasEvents = Array.from(next).some(k => k.startsWith(`${memberId}_`))
        if (!stillHasEvents && representativeId === memberId) setRepresentativeId('')
      } else {
        next.add(key)
      }
      return next
    })
  }

  const goToPreview = () => {
    const [brideName, groomName] = [
      userRole === 'bride' ? userName : partnerName,
      userRole === 'groom' ? userName : partnerName,
    ]
    const parsedMemberEvents = Array.from(selectedMemberEvents).map(str => ({
      member_id: str.split('_')[0],
      event_id: str.split('_')[1]
    }))
    const msg = generateMessage({
      recipientName: representative.full_name,
      activeMembers,
      events: activeEvents,
      memberEvents: parsedMemberEvents,
      brideName,
      groomName,
    })
    setMessage(msg)
    setStep(2)
  }

  const canProceed = [
    Boolean(familyId),
    Boolean(representativeId) && activeMembers.length > 0 && activeEvents.length > 0,
    true,
  ][step]

  const handleGenerateAndCreate = async () => {
    setCreating(true)
    try {
      const parsedMemberEvents = Array.from(selectedMemberEvents).map(str => ({
        member_id: str.split('_')[0],
        event_id: str.split('_')[1]
      }))
      const record = await createInvitation(userId, {
        family_id: family.family_id,
        surname: family.surname,
        hof_its: family.hof_its,
        recipient: representative,
        member_events: parsedMemberEvents,
        message,
      })
      buildLinkAndOpen(record.recipient_mobile, record.generated_message)
      await updateInvitationStatus(record.id, 'WhatsApp Opened')
      showToast(`Invitation ready for the ${family.surname} family — WhatsApp opened.`)
      onCreated()
    } catch (err) {
      console.error(err)
      showToast(`Error creating invitation: ${err.message || 'Network error'}`, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Invitation" size="lg" footer={<WizardFooter />}>
      <StepIndicator step={step} />

      {step === 0 && (
        <div>
          <Field label="Select Family">
            <Input placeholder="Search by surname…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Field>
          <div className="mt-4 max-h-72 overflow-y-auto space-y-2">
            {filteredFamilies.length === 0 && (
              <p className="text-sm text-ink/50 py-6 text-center">No families match "{search}". Add invitees first from the Add Invitee page.</p>
            )}
            {filteredFamilies.map((f) => {
              const hasInvitation = invitations.some(inv => inv.family_id === f.family_id)
              return (
              <button
                key={f.family_id}
                onClick={() => !hasInvitation && setFamilyId(f.family_id)}
                disabled={hasInvitation}
                className={`w-full text-left rounded-lg border px-4 py-3 transition tap-target ${
                  hasInvitation ? 'opacity-50 cursor-not-allowed bg-ivory-soft' :
                  familyId === f.family_id ? 'border-gold bg-gold-light/30' : 'border-ivory-line hover:border-emerald'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-deep">{f.surname}</span>
                  <div className="flex items-center gap-2">
                    {hasInvitation && <Badge tone="default">Created</Badge>}
                    <span className="text-xs text-ink/45">{f.members.length} member{f.members.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <p className="text-xs font-mono text-ink/40 mt-0.5">HOF ITS {f.hof_its}</p>
              </button>
            )})}
          </div>
        </div>
      )}

      {step === 1 && family && (
        <div>
          <p className="text-sm text-ink/60 mb-3">
            Check the boxes to invite specific members of the <strong>{family.surname}</strong> family to specific events, then mark one as the WhatsApp representative.
          </p>
          <div className="overflow-x-auto border border-ivory-line rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-ivory-soft border-b border-ivory-line">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-ink/70">Member</th>
                  <th className="py-3 px-4 text-center font-semibold text-ink/70">Representative</th>
                  {events.map(e => (
                    <th key={e.id} className="py-3 px-4 text-center font-semibold text-ink/70 whitespace-nowrap">
                      {e.event_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-line">
                {family.members.map(m => (
                  <tr key={m.id} className="hover:bg-ivory-soft/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">{m.full_name}</div>
                      <div className="text-xs font-mono text-ink/40">{m.mobile}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="radio"
                        name="representative"
                        checked={representativeId === m.id}
                        onChange={() => setRepresentativeId(m.id)}
                        disabled={!activeMemberIds.has(m.id)}
                        className="accent-emerald-deep cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </td>
                    {events.map(e => (
                      <td key={e.id} className="py-3 px-4 text-center">
                        <Checkbox
                          id={`grid-${m.id}-${e.id}`}
                          checked={selectedMemberEvents.has(`${m.id}_${e.id}`)}
                          onChange={() => toggleMemberEvent(m.id, e.id)}
                          label=""
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {activeMembers.length > 0 && !representativeId && (
            <p className="text-xs text-wine font-medium mt-3">Select one representative to receive the WhatsApp message.</p>
          )}
        </div>
      )}

      {step === 2 && (
        <PreviewStep
          representative={representative}
          message={message}
          setMessage={setMessage}
          onSend={handleGenerateAndCreate}
          creating={creating}
        />
      )}
    </Modal>
  )

  function buildLinkAndOpen(mobile, msg) {
    if (window.Android && window.Android.shareToWhatsApp) {
      window.Android.shareToWhatsApp(mobile, msg)
      return null
    } else {
      const link = buildWhatsappLink(mobile, msg)
      window.open(link, '_blank', 'noopener,noreferrer')
      return link
    }
  }

  function WizardFooter() {
    if (step === 2) return null
    return (
      <>
        {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>}
        {step === 0 && (
          <Button disabled={!canProceed} onClick={() => setStep(1)}>Continue</Button>
        )}
        {step === 1 && (
          <Button disabled={!canProceed} onClick={goToPreview}>Generate Invitation</Button>
        )}
      </>
    )
  }
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
            i === step ? 'bg-emerald-deep text-ivory' : i < step ? 'bg-gold text-emerald-deep' : 'bg-ivory-line text-ink/40'
          }`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-semibold ${i === step ? 'text-emerald-deep' : 'text-ink/40'}`}>{label}</span>
          {i < STEPS.length - 1 && <span className="w-4 h-px bg-ivory-line" />}
        </div>
      ))}
    </div>
  )
}

function PreviewStep({ representative, message, setMessage, onSend, creating }) {
  const [editing, setEditing] = useState(false)

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1">WhatsApp Invitation Preview</p>
      <div className="rounded-xl border border-ivory-line overflow-hidden">
        <div className="bg-ivory-soft px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-ink/45">To</p>
            <p className="font-semibold text-emerald-deep">{representative?.full_name || 'Loading...'} · <span className="font-mono text-sm">{representative?.mobile}</span></p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Done editing' : 'Edit Message'}
          </Button>
        </div>
        <div className="p-4 bg-white">
          {editing ? (
            <textarea
              className="w-full min-h-[220px] text-sm rounded-lg border border-ivory-line p-3 focus:border-gold focus:ring-1 focus:ring-gold outline-none font-body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-body text-sm text-ink leading-relaxed">{message}</pre>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 mt-5">
        <Button variant="whatsapp" size="lg" onClick={onSend} loading={creating}>
          Send on WhatsApp
        </Button>
      </div>
      <p className="text-xs text-ink/40 mt-3">
        This opens WhatsApp with the number and message pre-filled. You'll still need to press WhatsApp's own Send button.
      </p>
    </div>
  )
}
