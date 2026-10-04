import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getFamiliesWithInviteesForUser, getEvents,
  getInvitationsByUser, updateInvitationStatus, getUserStats
} from '../lib/db'
import { buildWhatsappLink, generateRsvpMessage } from '../lib/messageTemplate'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '+' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✉' },
  { path: '/dashboard/send-confirmation', label: 'Confirmations', icon: '✓' },
  { path: '/dashboard/send-rsvp', label: 'Send RSVPs', icon: '✉' }
]

export default function SendRsvpPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [families, setFamilies] = useState([])
  const [events, setEvents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lockedModal, setLockedModal] = useState({ open: false, title: '', message: '' })

  const [openedRsvpLinks, setOpenedRsvpLinks] = useState(new Set())

  const loadAll = async () => {
    setLoading(true)
    const [fam, evt, inv, s] = await Promise.all([
      getFamiliesWithInviteesForUser(user.id),
      getEvents(),
      getInvitationsByUser(user.id),
      getUserStats(user.id),
    ])
    
    // Only show invitations that have at least one Confirmed (or Attending/Not Attending) member
    const validRsvpInvitations = inv.filter(i => {
      // Must be sent in Phase 2
      if (!['Sent', 'WhatsApp Opened', 'RSVP Sent', 'RSVPed'].includes(i.status)) return false
      // Must have at least one member who reached Phase 3 Confirmations or Phase 4 RSVPs
      return i.member_events?.some(me => me.rsvp_status === 'Confirmed' || me.rsvp_status === 'Attending' || me.rsvp_status === 'Not Attending')
    })

    setFamilies(fam)
    setEvents(evt)
    setInvitations(validRsvpInvitations)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const handleMarkRsvpSent = async (invitation) => {
    if (!openedRsvpLinks.has(invitation.id)) {
      showToast('Please click "Send RSVP Link" to open WhatsApp before marking it as sent.', 'error')
      return
    }
    await updateInvitationStatus(invitation.id, 'RSVP Sent')
    showToast(`Marked ${invitation.surname} family's RSVP as sent.`)
    loadAll()
  }

  const handleSendRsvp = async (invitation) => {
    if (!invitation.recipient_mobile) {
      showToast('This family does not have a mobile number saved! Please edit the family to add a mobile number first.', 'error')
      return
    }

    const rsvpUrl = `${window.location.origin}/rsvp/${invitation.id}`
    const message = generateRsvpMessage(invitation.recipient_name, rsvpUrl)
    
    setOpenedRsvpLinks(prev => new Set([...prev, invitation.id]))
    
    if (window.Android && window.Android.shareToWhatsApp) {
      window.Android.shareToWhatsApp(invitation.recipient_mobile, message)
    } else {
      const link = buildWhatsappLink(invitation.recipient_mobile, message)
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  const phaseVisibility = JSON.parse(sessionStorage.getItem('phase_visibility') || '{"phase_1_visible":true,"phase_2_visible":true,"phase_3_visible":true}')
  const filteredNav = NAV.filter(n => {
    if (n.path === '/dashboard/add-invitee' && !phaseVisibility.phase_1_visible) return false
    if (n.path === '/dashboard/send-invitation' && !phaseVisibility.phase_2_visible) return false
    if (n.path === '/dashboard/send-confirmation' && !phaseVisibility.phase_2_visible) return false
    return true
  })

  return (
    <DashboardLayout navItems={filteredNav} activePath="/dashboard/send-rsvp" roleLabel={user.role}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold text-emerald-deep">Phase 4: Send RSVPs</h1>
          <p className="text-sm text-ink/60 mt-1 max-w-xl">
            Send the final RSVP link to families who confirmed their initial invitation. The link will only show events they confirmed for.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading...</div>
      ) : invitations.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="✉"
            title="No confirmed families yet"
            description="When your guests start confirming their Phase 3 invitations, they will appear here so you can send them their final RSVP link."
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
                      <Button variant="outline" size="sm" onClick={() => {
                        if (user.can_send_rsvps === false) {
                          setLockedModal({
                            open: true,
                            title: 'RSVP Phase Locked',
                            message: 'The RSVP phase has not been unlocked yet. Kindly contact your admin for assistance.'
                          })
                          return
                        }
                        handleSendRsvp(inv)
                      }}>
                        Send RSVP Link
                      </Button>
                      
                      {inv.status !== 'RSVP Sent' && (
                        <Button variant="outline" size="sm" onClick={() => {
                          if (user.can_send_rsvps === false) {
                            setLockedModal({
                              open: true,
                              title: 'RSVP Phase Locked',
                              message: 'The RSVP phase has not been unlocked yet. Kindly contact your admin for assistance.'
                            })
                            return
                          }
                          handleMarkRsvpSent(inv)
                        }}>
                          Mark RSVP Sent
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

      <Modal open={lockedModal.open} onClose={() => setLockedModal({ ...lockedModal, open: false })} title={lockedModal.title}>
        <div className="p-4 sm:p-6 text-sm text-ink/80 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <p>{lockedModal.message}</p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => setLockedModal({ ...lockedModal, open: false })}>Okay</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
