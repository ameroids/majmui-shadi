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
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' }
]

export default function TNCRsvpReportsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [invitees, setInvitees] = useState([])

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
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-8">
            <Stat label="Total Attending (People)" value={stats.attending} />
            <Stat label="Total Not Attending" value={stats.notAttending} />
            <Stat label="Total Pending" value={stats.pendingRsvps} />
          </div>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-emerald-deep mb-4">All RSVPs</h2>

            {invitees.length === 0 ? (
              <EmptyState icon="✉" title="No RSVPs found" description="RSVPs will appear here once invitations are Sent out." /> 
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                      <th className="py-2 px-2">Family</th>
                      <th className="py-2 px-2">Name</th>
                      <th className="py-2 px-2">Relationship</th>
                      <th className="py-2 px-2">Event RSVPs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitees.map((i) => (
                        <tr key={i.invitee_id} className="border-b border-ivory-line last:border-0">
                          <td className="py-2.5 px-2 font-medium">{i.surname}</td>
                          <td className="py-2.5 px-2">{i.full_name} <span className="font-mono text-xs text-ink/40">({i.mobile || 'No Mobile'})</span></td>
                          <td className="py-2.5 px-2">{i.relationship || '-'}</td>
                          <td className="py-2.5 px-2">
                            <div className="flex flex-col gap-1">
                              {i.events.map((ev, idx) => {
                                let tone = 'default'
                                if (ev.status === 'Attending') tone = 'success'
                                if (ev.status === 'Not Attending') tone = 'critical'
                                return (
                                  <div key={idx} className="flex items-center justify-between text-xs w-48 border border-gray-100 rounded px-2 py-1">
                                    <span className="font-medium text-gray-700 truncate">{ev.name}</span>
                                    <Badge tone={tone}>{ev.status}</Badge>
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
