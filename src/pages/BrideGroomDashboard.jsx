import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import ArchMotif from '../components/ArchMotif'
import { useAuth } from '../context/AuthContext'
import { getUserStats, getInvitationsByUser, getEvents, getGlobalPhaseVisibility } from '../lib/db'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
]

export default function BrideGroomDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [events, setEvents] = useState([])
  const [phaseVisibility, setPhaseVisibility] = useState(() => {
    const cached = sessionStorage.getItem('phase_visibility')
    return cached ? JSON.parse(cached) : { phase_1_visible: true, phase_2_visible: true, phase_3_visible: true }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      const [s, inv, evts, pv] = await Promise.all([getUserStats(user.id), getInvitationsByUser(user.id), getEvents(), getGlobalPhaseVisibility()])
      if (!alive) return
      setStats(s)
      setInvitations(inv)
      setEvents(evts)
      setPhaseVisibility(pv)
      sessionStorage.setItem('phase_visibility', JSON.stringify(pv))
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [user.id])

  const filteredNav = NAV.filter(n => {
    if (n.path === '/dashboard/add-invitee' && !phaseVisibility.phase_1_visible) return false
    if (n.path === '/dashboard/send-invitation' && !phaseVisibility.phase_2_visible) return false
    return true
  })

  return (
    <DashboardLayout navItems={filteredNav} activePath="/dashboard" roleLabel={user.role}>
      <div className="mb-7">
        <p className="text-xs uppercase tracking-widest text-gold-deep font-semibold">
          {user.role === 'bride' ? 'Bride account' : 'Groom account'}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-emerald-deep mt-1">
          Welcome, {user.display_name.split(' ')[0]}
        </h1>
        <div className="mt-4 max-w-xs"><ArchMotif height={10} /></div>
      </div>

      {loading ? (
        <PageLoader label="Loading your dashboard…" />
      ) : (
        <>
          <div className="space-y-10">
            
            {/* Phase 1: Planning */}
            {phaseVisibility.phase_1_visible && (
              <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-semibold text-emerald-deep">Phase 1: Planning</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/add-invitee')}>
                  Go to Address Book →
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Total People Added" value={stats.totalInvitees} />
              </div>
            </section>
            )}

            {phaseVisibility.phase_1_visible && phaseVisibility.phase_2_visible && (
              <div className="h-px bg-ivory-line w-full" />
            )}

            {/* Phase 2: Invitations */}
            {phaseVisibility.phase_2_visible && (
              <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-semibold text-emerald-deep">Phase 2: Invitations</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/send-invitation')}>
                  Send Invitations →
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                <StatCard 
                  label="Seats Consumed" 
                  value={
                    <>
                      {stats.totalSeatsConsumed || 0} 
                      <span className="text-xl sm:text-2xl opacity-60"> / {280 + ((stats.extra_thaals || 0) * 8)}</span>
                    </>
                  } 
                  accent 
                />
                <StatCard label="Invitations Ready" value={stats.ready} accent />
                <StatCard label="Invitations Sent" value={stats.sent} accent />
                {(stats.totalSeatsConsumed || 0) > (280 + ((stats.extra_thaals || 0) * 8)) && (
                  <StatCard 
                    label="Extra Seats Consumed" 
                    value={(stats.totalSeatsConsumed || 0) - (280 + ((stats.extra_thaals || 0) * 8))} 
                    warning 
                  />
                )}
              </div>

              {events.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/45 mb-3">Seats Breakdown by Event</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {events.map((e) => (
                      <div key={e.id} className="bg-ivory-soft border border-ivory-line rounded-lg p-3 text-center">
                        <div className="text-[10px] font-bold uppercase text-ink/50 mb-1">{e.event_name}</div>
                        <div className="font-display text-xl text-emerald-deep font-semibold">{stats.seatsPerEvent?.[e.id] || 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Card className="p-5 sm:p-6">
                <h3 className="font-display text-lg font-semibold text-emerald-deep mb-4">Invitation Progress</h3>
                {invitations.length === 0 ? (
                  <EmptyState
                    icon="✉"
                    title="No invitations yet"
                    description="Once you add invitees and generate a WhatsApp invitation, it will appear here."
                  />
                ) : (
                  <div className="overflow-x-auto -mx-2">
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                          <th className="py-2 px-2 font-semibold">Family</th>
                          <th className="py-2 px-2 font-semibold">Members</th>
                          <th className="py-2 px-2 font-semibold">Events</th>
                          <th className="py-2 px-2 font-semibold">Recipient</th>
                          <th className="py-2 px-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invitations.slice(0, 5).map((inv) => (
                          <tr key={inv.id} className="border-b border-ivory-line last:border-0">
                            <td className="py-3 px-2 font-medium text-ink">{inv.surname}</td>
                            <td className="py-3 px-2 text-ink/70">{inv.invitee_ids.length}</td>
                            <td className="py-3 px-2 text-ink/70 max-w-[120px] truncate" title={inv.event_names}>{inv.event_names}</td>
                            <td className="py-3 px-2 text-ink/70">{inv.recipient_name}</td>
                            <td className="py-3 px-2"><Badge tone={inv.status}>{inv.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </section>
            )}

            {phaseVisibility.phase_2_visible && phaseVisibility.phase_3_visible && (
              <div className="h-px bg-ivory-line w-full" />
            )}

            {/* Phase 3: RSVPs */}
            {phaseVisibility.phase_3_visible && (
              <section>
              <h2 className="font-display text-2xl font-semibold text-emerald-deep mb-4">Phase 3: RSVPs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <StatCard label="Attending" value={stats.attending || 0} />
                <StatCard label="Not Attending" value={stats.notAttending || 0} />
                <StatCard label="Pending RSVPs" value={stats.pendingRsvps || 0} />
              </div>
            </section>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}

function StatCard({ label, value, accent, warning }) {
  return (
    <Card className={`p-4 sm:p-5 ${accent ? 'bg-emerald-deep' : ''} ${warning ? 'border-rose-500 bg-rose-50' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-gold-light' : warning ? 'text-rose-600' : 'text-ink/45'}`}>
        {label}
      </p>
      <p className={`font-display text-3xl sm:text-4xl font-semibold mt-1 ${accent ? 'text-ivory' : warning ? 'text-rose-600' : 'text-emerald-deep'}`}>
        {value}
      </p>
    </Card>
  )
}

function ActionCard({ icon, title, description, cta, onClick, variant = 'primary' }) {
  return (
    <Card className="p-6 flex flex-col justify-between">
      <div>
        <div className="h-11 w-11 rounded-full bg-emerald-soft text-emerald-deep flex items-center justify-center text-xl mb-4">
          {icon}
        </div>
        <h3 className="font-display text-xl font-semibold text-emerald-deep">{title}</h3>
        <p className="text-sm text-ink/60 mt-1.5">{description}</p>
      </div>
      <Button className="mt-5 w-fit" variant={variant} onClick={onClick}>
        {cta}
      </Button>
    </Card>
  )
}
