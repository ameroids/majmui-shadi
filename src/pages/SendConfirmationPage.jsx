import { useEffect, useState, useMemo } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { Field, Input } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import EmptyState from '../components/ui/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  getInvitationsByUser, getEvents, createManualFamily, saveInvitees, createInvitation
} from '../lib/db'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
  { path: '/dashboard/send-confirmation', label: 'Confirmations', icon: '✓' },
]

export default function SendConfirmationPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [invitations, setInvitations] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEventId, setFilterEventId] = useState('all')

  const loadAll = async () => {
    setLoading(true)
    try {
      const [invData, eventsData] = await Promise.all([
        getInvitationsByUser(user.id),
        getEvents()
      ])
      setInvitations(invData || [])
      setEvents(eventsData || [])
      
      if (eventsData && eventsData.length > 0 && filterEventId === 'all') {
        setFilterEventId(eventsData[0].id)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { loadAll() }, []) // eslint-disable-line

  const phaseVisibility = JSON.parse(sessionStorage.getItem('phase_visibility') || '{"phase_1_visible":true,"phase_2_visible":true,"phase_3_visible":true}')
  const filteredNav = NAV.filter(n => {
    if (n.path === '/dashboard/add-invitee' && !phaseVisibility.phase_1_visible) return false
    if (n.path === '/dashboard/send-invitation' && !phaseVisibility.phase_2_visible) return false
    if (n.path === '/dashboard/send-confirmation' && !phaseVisibility.phase_2_visible) return false
    return true
  })

  // Calculate total declined seats based on selected event filter
  const totalDeclined = useMemo(() => {
    let count = 0
    invitations.forEach(inv => {
      if (filterEventId === 'all') {
        // Declined all events
        const memberStatusMap = {}
        inv.member_events?.forEach(me => {
          const mid = me.invitees?.id
          if (!mid) return
          if (!memberStatusMap[mid]) {
            memberStatusMap[mid] = { total: 0, declined: 0 }
          }
          memberStatusMap[mid].total++
          // ONLY Phase 3 'Declined' creates vacant seats
          if (me.rsvp_status === 'Declined') {
            memberStatusMap[mid].declined++
          }
        })
        
        Object.values(memberStatusMap).forEach(s => {
          if (s.total > 0 && s.total === s.declined) {
            count++
          }
        })
      } else {
        // Declined this specific event
        inv.member_events?.forEach(me => {
          if (me.events?.id === filterEventId) {
            if (me.rsvp_status === 'Declined') {
              count++
            }
          }
        })
      }
    })
    return count
  }, [invitations, filterEventId])

  return (
    <DashboardLayout navItems={filteredNav} activePath="/dashboard/send-confirmation" roleLabel={user.role}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold text-emerald-deep">Confirmations Dashboard</h1>
          <p className="text-sm text-ink/60 mt-1 max-w-xl">
            Track all RSVPs from your sent invitations. If guests decline, their seats become vacant and you can invite someone else.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink/70">Filter by Event:</span>
              <select
                className="px-3 py-1.5 bg-white border border-ivory-line rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all"
                value={filterEventId}
                onChange={(e) => setFilterEventId(e.target.value)}
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.event_name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              {totalDeclined > 0 && (
                <div className="text-sm font-medium text-wine bg-wine/10 px-3 py-1.5 rounded-full">
                  {totalDeclined} Vacant Seat{totalDeclined !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {totalDeclined > 0 && (
            <div className="bg-wine/5 border border-wine/10 rounded-lg py-2 px-3 mt-2 inline-block">
              <p className="text-xs text-wine/80 font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                You can invite {totalDeclined} more {totalDeclined === 1 ? 'person' : 'people'} to replace those who declined.
              </p>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : invitations.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon="📋"
            title="No invitations sent yet"
            description="Send invitations from Phase 2 first to start tracking confirmations."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-ivory-soft border-b border-ivory-line text-left text-ink/60 uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 font-medium">Family</th>
                  <th className="py-3 px-4 font-medium">Invitation Status</th>
                  <th className="py-3 px-4 font-medium">Responses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50/50">
                    <td className="py-4 px-4 align-top">
                      <div className="font-medium text-ink">{inv.surname} Family</div>
                      <div className="text-xs text-ink/50 mt-1">
                        Invited {inv.invitee_names?.split(',').length || 0} members
                      </div>
                    </td>
                    <td className="py-4 px-4 align-top">
                      <Badge variant={inv.status === 'RSVPed' ? 'success' : inv.status === 'Sent' ? 'info' : 'neutral'}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-4">
                        {(() => {
                          const members = new Map()
                          inv.member_events?.forEach(me => {
                            if (!me.invitees) return
                            if (!members.has(me.invitees.id)) {
                              members.set(me.invitees.id, { name: me.invitees.full_name, events: [] })
                            }
                            members.get(me.invitees.id).events.push({
                              id: me.events?.id,
                              eventName: me.events?.event_name || 'Event',
                              status: me.rsvp_status || 'Pending'
                            })
                          })
                          
                          return Array.from(members.values())
                            .map(m => ({
                              ...m,
                              events: m.events.filter(ev => filterEventId === 'all' || ev.id === filterEventId)
                            }))
                            .filter(m => m.events.length > 0)
                            .map((m, idx) => (
                            <div key={idx} className="bg-white rounded border border-ivory-line p-2 shadow-sm">
                              <div className="font-medium text-ink mb-1.5">{m.name}:</div>
                              <div className="space-y-1.5 pl-2">
                                {m.events.map((ev, evIdx) => {
                                  let uiStatus = ev.status
                                  if (ev.status === 'Attending' || ev.status === 'Not Attending') {
                                    uiStatus = 'Confirmed'
                                  }
                                  
                                  return (
                                    <div key={evIdx} className="flex items-center justify-between gap-4 text-xs">
                                      <span className="text-ink/60">{ev.eventName}</span>
                                      <Badge variant={uiStatus === 'Confirmed' ? 'success' : uiStatus === 'Declined' ? 'error' : 'neutral'} size="sm">
                                        {uiStatus}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        })()}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}
