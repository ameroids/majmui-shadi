import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { getAdminStats, getTncRsvpData } from '../lib/db'

const TNC_NAV = [
  { path: '/tnc', label: 'Reports & Search', icon: '⌕' },
  { path: '/tnc/reports', label: 'Event Reports', icon: '📊' },
  { path: '/tnc/individual', label: 'Individual Reports', icon: '👤' },
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' },
  { path: '/tnc/thaals', label: 'Extra Thaals', icon: '🍲' }
]

export default function TNCRsvpReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [invitees, setInvitees] = useState([])
  const [filterEvent, setFilterEvent] = useState('')
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      const [s, rsvpData] = await Promise.all([
        getAdminStats(), 
        getTncRsvpData()
      ])
      if (!alive) return
      setStats(s)
      
      const byPerson = {}
      rsvpData.forEach(r => {
        if (!byPerson[r.invitee_id]) {
          byPerson[r.invitee_id] = { ...r, events: [] }
        }
        byPerson[r.invitee_id].events.push({ name: r.event_name, status: r.rsvp_status })
      })
      
      setInvitees(Object.values(byPerson))
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <DashboardLayout navItems={TNC_NAV} activePath="/tnc/rsvp" roleLabel="TNC">
      <h1 className="font-display text-3xl font-semibold text-emerald-deep mb-1">RSVP Reports</h1>
      <p className="text-sm text-ink/60 mb-7">Track RSVP statuses across all invited guests who have been sent an RSVP link.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : (
          (() => {
            const allEventNames = Array.from(new Set(invitees.flatMap(i => i.events.map(e => e.name)))).sort()
            
            let displayInvitees = invitees
            if (filterEvent) {
              displayInvitees = invitees.map(i => {
                const filtered = i.events.filter(e => e.name === filterEvent)
                if (filtered.length === 0) return null
                return { ...i, events: filtered }
              }).filter(Boolean)
            }

            let displayStats = stats
            if (filterEvent) {
              let attending = 0, notAttending = 0, pending = 0
              displayInvitees.forEach(i => {
                let isAttending = false, isPending = false, isNotAttending = false
                i.events.forEach(ev => {
                  if (ev.status === 'Attending') isAttending = true
                  else if (ev.status === 'Not Attending') isNotAttending = true
                  else isPending = true
                })
                if (isAttending) attending++
                else if (isPending) pending++
                else if (isNotAttending) notAttending++
              })
              displayStats = { attending, notAttending, pendingRsvps: pending }
            }

            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
                  <Stat label="Total Attending (People)" value={displayStats.attending} />
                  <Stat label="Total Not Attending" value={displayStats.notAttending} />
                  <Stat label="Total Pending" value={displayStats.pendingRsvps} />
                </div>

                <Card className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <h2 className="font-display text-xl font-semibold text-emerald-deep">All RSVPs</h2>
                    
                    <div className="w-full sm:w-48 relative">
                      <div 
                        className="glass-card p-2 rounded-xl cursor-pointer flex justify-between items-center text-sm text-ink border border-ivory-line bg-white shadow-sm hover:shadow transition-shadow"
                        onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                      >
                        <span className="font-medium truncate mr-2">
                          {filterEvent ? `✨ ${filterEvent}` : '✨ All Events'}
                        </span>
                        <svg className={`w-4 h-4 text-ink/60 transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      
                      {eventDropdownOpen && (
                        <div className="absolute top-full mt-2 right-0 w-full bg-white rounded-xl shadow-xl border border-ivory-line z-50 overflow-hidden animate-fade-in">
                          <div 
                            className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 text-ink ${!filterEvent ? 'bg-emerald/10 text-emerald-deep font-semibold' : ''}`}
                            onClick={() => {
                              setFilterEvent('');
                              setEventDropdownOpen(false);
                            }}
                          >
                            ✨ All Events
                          </div>
                          {allEventNames.map(name => (
                            <div 
                              key={name}
                              className={`px-4 py-2 text-sm cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 last:border-0 ${name === filterEvent ? 'bg-emerald/10 text-emerald-deep font-semibold' : 'text-ink'}`}
                              onClick={() => {
                                setFilterEvent(name);
                                setEventDropdownOpen(false);
                              }}
                            >
                              {name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {displayInvitees.length === 0 ? (
              <EmptyState icon="✉" title="No RSVPs found" description="RSVPs will appear here once invitations are Sent out." /> 
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                      <th className="py-2 px-2">Family</th>
                      <th className="py-2 px-2">Name</th>
                      <th className="py-2 px-2">Invited By</th>
                      <th className="py-2 px-2">Event RSVPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayInvitees.map((i) => (
                        <tr key={i.invitee_id} className="border-b border-ivory-line last:border-0 hover:bg-ivory-soft/30 transition-colors">
                          <td className="py-2.5 px-2 font-medium text-ink">{i.surname}</td>
                          <td className="py-2.5 px-2 text-ink">{i.full_name} <span className="font-mono text-xs text-ink/40 ml-1">({i.mobile || 'No Mobile'})</span></td>
                          <td className="py-2.5 px-2 font-medium text-emerald-deep/80">{i.invited_by || '-'}</td>
                          <td className="py-2.5 px-2">
                            <div className="flex flex-col gap-1.5">
                              {i.events.map((ev, idx) => {
                                let tone = 'default'
                                if (ev.status === 'Attending') tone = 'success'
                                if (ev.status === 'Not Attending') tone = 'critical'
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs w-48 border border-ivory-line bg-white rounded px-2.5 py-1.5 shadow-sm">
                                    <span className="font-medium text-ink/70 truncate">{ev.name}</span>
                                    <Badge tone={tone} className="!py-0.5 !px-1.5 text-[10px]">{ev.status}</Badge>
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      );
    })()
  )}
</DashboardLayout>
  )
}

function Stat({ label, value }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
      <p className="font-display text-3xl font-semibold mt-1 text-emerald-deep">{value}</p>
    </Card>
  )
}
