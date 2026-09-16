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
  getFamiliesWithInviteesForUser, getConfirmationsByUser, createConfirmation,
  updateConfirmationStatus, updateConfirmationMessage, getUserStats
} from '../lib/db'
import { buildWhatsappLink } from '../lib/messageTemplate'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-confirmation', label: 'Confirmations', icon: '✓' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
]

const STEPS = ['Select Family', 'Configure Confirmation', 'Preview & Send']

export default function SendConfirmationPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [families, setFamilies] = useState([])
  const [confirmations, setConfirmations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [lockedModal, setLockedModal] = useState({ open: false, title: '', message: '' })

  const loadAll = async () => {
    setLoading(true)
    const [fam, conf, s] = await Promise.all([
      getFamiliesWithInviteesForUser(user.id),
      getConfirmationsByUser(user.id),
      getUserStats(user.id),
    ])
    setFamilies(fam)
    setConfirmations(conf)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const handleOpenWhatsapp = async (confirmation) => {
    if (!confirmation.recipient_mobile) {
      showToast('This family does not have a mobile number saved! Please edit the family to add a mobile number first.', 'error')
      return
    }

    if (window.Android && window.Android.shareToWhatsApp) {
      window.Android.shareToWhatsApp(confirmation.recipient_mobile, confirmation.generated_message)
    } else {
      const link = buildWhatsappLink(confirmation.recipient_mobile, confirmation.generated_message)
      window.open(link, '_blank', 'noopener,noreferrer')
    }
    
    if (confirmation.status === 'Ready') {
      await updateConfirmationStatus(confirmation.id, 'Sent')
      loadAll()
    }
  }

  const handleMarkSent = async (confirmation) => {
    await updateConfirmationStatus(confirmation.id, 'Sent')
    showToast(`Marked ${confirmation.surname} family's confirmation request as sent.`)
    loadAll()
  }

  return (
    <DashboardLayout navItems={NAV} activePath="/dashboard/send-confirmation" roleLabel={user.role}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold text-emerald-deep">Send Early Confirmation</h1>
          <p className="text-sm text-ink/60 mt-1 max-w-xl">
            Ask your selected invitees if they plan to attend, 1 month before the event. This allows you to replace declined invitees before sending formal invitations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            if (user.can_send_invitations === false) {
              setLockedModal({
                open: true,
                title: 'Action Locked',
                message: 'You cannot send confirmations. Kindly contact your TNC admin for assistance.'
              })
              return
            }
            setWizardOpen(true)
          }} size="lg">+ New Confirmation Request</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : confirmations.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="✓"
            title="No confirmation requests yet"
            description="Start a new confirmation request to ask a family if they are attending."
            action={<Button onClick={() => setWizardOpen(true)}>+ New Confirmation Request</Button>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/45 bg-ivory-soft border-b border-ivory-line">
                  <th className="py-3 px-4 font-semibold">Family</th>
                  <th className="py-3 px-4 font-semibold">Recipient</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {confirmations.map((conf) => (
                  <tr key={conf.id} className="border-b border-ivory-line last:border-0">
                    <td className="py-3 px-4 font-medium text-ink">{conf.surname}</td>
                    <td className="py-3 px-4 text-ink/70">
                      {conf.recipient_name}
                      <div className="text-xs text-ink/40 font-mono">{conf.recipient_mobile}</div>
                    </td>
                    <td className="py-3 px-4"><Badge tone={conf.status}>{conf.status}</Badge></td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Button variant="whatsapp" size="sm" onClick={() => {
                        if (user.can_send_invitations === false) {
                          setLockedModal({
                            open: true,
                            title: 'Action Locked',
                            message: 'You cannot send or update confirmations. Kindly contact your TNC admin for assistance.'
                          })
                          return
                        }
                        handleOpenWhatsapp(conf)
                      }}>
                        {conf.status === 'Sent' ? 'Reopen' : 'Send on WhatsApp'}
                      </Button>
                      {(conf.status !== 'Sent' && conf.status !== 'Responded') && (
                        <Button variant="outline" size="sm" onClick={() => {
                          if (user.can_send_invitations === false) {
                            setLockedModal({
                              open: true,
                              title: 'Action Locked',
                              message: 'You cannot send or update confirmations. Kindly contact your TNC admin for assistance.'
                            })
                            return
                          }
                          handleMarkSent(conf)
                        }}>
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

      <ConfirmationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        families={families}
        confirmations={confirmations}
        userId={user.id}
        userName={user.display_name}
        partnerName={user.partner_name}
        userRole={user.role}
        user={user}
        stats={stats}
        onCreated={loadAll}
      />

      <Modal 
        open={lockedModal.open} 
        onClose={() => setLockedModal({ ...lockedModal, open: false })}
        title={lockedModal.title}
        size="sm"
        footer={
          <Button onClick={() => setLockedModal({ ...lockedModal, open: false })} className="w-full sm:w-auto">
            Got it
          </Button>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-4">🔒</div>
          <p className="text-base text-ink/80">{lockedModal.message}</p>
        </div>
      </Modal>
    </DashboardLayout>
  )
}

function ConfirmationWizard({ open, onClose, families, confirmations, userId, userName, partnerName, userRole, user, stats, onCreated }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(0)
  const [familyId, setFamilyId] = useState('')
  const [search, setSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState(new Set())
  const [representativeId, setRepresentativeId] = useState('')
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const family = families.find((f) => f.family_id === familyId)

  useEffect(() => {
    if (!open) {
      setStep(0); setFamilyId(''); setSearch(''); setSelectedMembers(new Set())
      setRepresentativeId(''); setMessage('')
    }
  }, [open])

  useEffect(() => {
    if (family) {
      const initial = new Set()
      family.members.forEach(m => initial.add(m.id))
      setSelectedMembers(initial)
      setRepresentativeId('')
    }
  }, [familyId]) // eslint-disable-line

  const filteredFamilies = useMemo(() => {
    if (!search.trim()) return families
    return families.filter((f) => f.surname.toLowerCase().includes(search.trim().toLowerCase()))
  }, [families, search])

  const activeMembers = family ? family.members.filter(m => selectedMembers.has(m.id)) : []
  const representative = activeMembers.find((m) => m.id === representativeId)

  const toggleMember = (memberId) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
        if (representativeId === memberId) setRepresentativeId('')
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  const goToPreview = () => {
    const [brideName, groomName] = [
      userRole === 'bride' ? userName : partnerName,
      userRole === 'groom' ? userName : partnerName,
    ]
    
    // Generate Confirmation Message
    const confUrl = `${window.location.origin}/confirm/fake_id` // will be replaced after creation
    const activeNames = activeMembers.map(m => m.full_name).join(', ')
    
    const msg = `Salaam,

As part of the upcoming Majmui Shaadi for ${brideName} & ${groomName}, we are finalizing our guest list early so we can accommodate as many people as possible.

We would love for the following members to attend:
${activeNames}

Could you please click the link below to confirm if you will be able to attend? 
(Your early response will help us invite others if you cannot make it).

[LINK_PLACEHOLDER]

Shukran,
${userName}`

    setMessage(msg)
    setStep(2)
  }

  const canProceed = [
    Boolean(familyId),
    Boolean(representativeId) && activeMembers.length > 0,
    true,
  ][step]

  const handleGenerateAndCreate = async () => {
    setCreating(true)
    try {
      const record = await createConfirmation(userId, {
        family_id: family.family_id,
        surname: family.surname,
        hof_its: family.hof_its,
        recipient: representative,
        invitee_ids: Array.from(selectedMembers),
        message: 'placeholder',
      })
      
      const actualLink = `${window.location.origin}/confirm/${record.id}`
      const finalMessage = message.replace('[LINK_PLACEHOLDER]', actualLink)
      await updateConfirmationMessage(record.id, finalMessage)
      
      buildLinkAndOpen(record.recipient_mobile, finalMessage)
      await updateConfirmationStatus(record.id, 'Sent')
      showToast(`Confirmation request ready for the ${family.surname} family — WhatsApp opened.`)
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
      showToast(`Error creating confirmation: ${err.message || 'Network error'}`, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="New Confirmation Request" size="lg" footer={<WizardFooter />}>
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
              const hasConfirmation = confirmations.some(conf => conf.family_id === f.family_id)
              return (
              <button
                key={f.family_id}
                onClick={() => !hasConfirmation && setFamilyId(f.family_id)}
                disabled={hasConfirmation}
                className={`w-full text-left rounded-lg border px-4 py-3 transition tap-target ${
                  hasConfirmation ? 'opacity-50 cursor-not-allowed bg-ivory-soft' :
                  familyId === f.family_id ? 'border-gold bg-gold-light/30' : 'border-ivory-line hover:border-emerald'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-semibold text-emerald-deep">
                      {f.surname}
                      {f.members.find(m => m.mobile?.trim()) && (
                        <span className="text-sm font-normal text-ink/70 ml-1.5">
                          ({f.members.find(m => m.mobile?.trim()).full_name})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasConfirmation && <Badge tone="default">Sent</Badge>}
                    <span className="text-xs text-ink/45">{f.members.length} member{f.members.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>
      )}

      {step === 1 && family && (
        <div>
          <p className="text-sm text-ink/60 mb-3">
            Select the members of the <strong>{family.surname}</strong> family you want to ask for early confirmation, and pick one WhatsApp representative.
          </p>
          <div className="overflow-x-auto border border-ivory-line rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-ivory-soft border-b border-ivory-line">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold text-ink/70">Member</th>
                  <th className="py-3 px-4 text-center font-semibold text-ink/70">Ask Confirmation</th>
                  <th className="py-3 px-4 text-center font-semibold text-ink/70">WhatsApp Representative</th>
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
                        <Checkbox
                          id={`grid-${m.id}`}
                          checked={selectedMembers.has(m.id)}
                          onChange={() => toggleMember(m.id)}
                          label=""
                        />
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.mobile?.trim() ? (
                        <input
                          type="radio"
                          name="representative"
                          checked={representativeId === m.id}
                          onChange={() => setRepresentativeId(m.id)}
                          disabled={!selectedMembers.has(m.id)}
                          className="accent-emerald-deep cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      ) : (
                        <span className="text-[10px] text-ink/30 uppercase font-semibold" title="Mobile number required to be a representative">No Mobile</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between">
            {activeMembers.length > 0 && !representativeId ? (
              <p className="text-sm font-semibold text-rose-600">Select one representative to receive the WhatsApp message.</p>
            ) : <div/>}
          </div>
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
          <Button disabled={!canProceed} onClick={goToPreview}>Generate Message</Button>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-1">WhatsApp Message Preview</p>
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
