import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/Spinner'
import ArchMotif from '../components/ArchMotif'
import { useAuth } from '../context/AuthContext'
import { getUserStats, getInvitationsByUser, getEvents, getGlobalPhaseVisibility } from '../lib/db'
import { isVevaanEvent, hasVevaanEvent } from '../lib/vevaan'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
  { path: '/dashboard/send-confirmation', label: 'Confirmations', icon: '✓' },
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
  const [visibleCount, setVisibleCount] = useState(10)


  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [inv, evts, pv] = await Promise.all([
          getInvitationsByUser(user.id),
          getEvents(),
          getGlobalPhaseVisibility()
        ])
        const s = await getUserStats(user.id, inv)
        if (!alive) return
        setStats(s || {})
        setInvitations(inv || [])
        setEvents(evts || [])
        setPhaseVisibility(pv || { phase_1_visible: true, phase_2_visible: true, phase_3_visible: true })
        if (pv) sessionStorage.setItem('phase_visibility', JSON.stringify(pv))
      } catch (err) {
        console.error('Failed to load dashboard:', err)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [user.id])

  const filteredNav = NAV.filter(n => {
    if (n.path === '/dashboard/add-invitee' && !phaseVisibility.phase_1_visible) return false
    if (n.path === '/dashboard/send-invitation' && !phaseVisibility.phase_2_visible) return false
    if (n.path === '/dashboard/send-confirmation' && !phaseVisibility.phase_2_visible) return false
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

      {loading || !stats ? (
        <PageLoader label="Loading your dashboard…" />
      ) : (
        <>
          <div className="space-y-10">
            
            {/* Phase 1: Planning */}
            {phaseVisibility.phase_1_visible && (
              <section>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-2xl font-semibold text-emerald-deep">Phase 1: Guest List</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.open('/dashboard/print-roster', '_blank')} className="border-emerald/20 text-emerald-deep hover:bg-emerald-soft text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5">
                      🖨️ Download PDF / Print
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/add-invitee')}>
                      Manage Roster →
                    </Button>
                  </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
                {(() => {
                  const vevaanEvent = events.find(e => isVevaanEvent(user.role, e.event_name))
                  const vevaanCount = vevaanEvent ? (stats.seatsPerEvent?.[vevaanEvent.id] || 0) : 0
                  return (
                    <StatCard 
                      label={`Vevaan Guests (${vevaanEvent ? vevaanEvent.event_name : (user.role === 'groom' ? 'Paan Gulab' : 'Walima')})`}
                      value={vevaanCount}
                      accent
                    />
                  )
                })()}
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
                    {events.map((e) => {
                      const isVevaan = isVevaanEvent(user.role, e.event_name)
                      return (
                        <div 
                          key={e.id} 
                          className={`rounded-lg p-3 text-center transition ${
                            isVevaan 
                              ? 'bg-purple-50 border-2 border-purple-300 shadow-sm' 
                              : 'bg-ivory-soft border border-ivory-line'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase text-ink/50 mb-1">
                            <span>{e.event_name}</span>
                            {isVevaan && (
                              <span className="bg-purple-200 text-purple-900 px-1 py-0.2 rounded text-[9px]">
                                Vevaan
                              </span>
                            )}
                          </div>
                          <div className={`font-display text-xl font-semibold ${isVevaan ? 'text-purple-900' : 'text-emerald-deep'}`}>
                            {stats.seatsPerEvent?.[e.id] || 0}
                          </div>
                        </div>
                      )
                    })}
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
                  <>
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
                        {invitations.slice(0, visibleCount).map((inv) => (
                          <tr key={inv.id} className="border-b border-ivory-line last:border-0">
                            <td className="py-3 px-2 font-medium text-ink">
                              <span>{inv.surname}</span>
                            </td>
                            <td className="py-3 px-2 text-ink/70">{inv.invitee_ids.length}</td>
                            <td className="py-3 px-2 text-ink/70 max-w-[120px] truncate" title={inv.event_names}>{inv.event_names}</td>
                            <td className="py-3 px-2 text-ink/70">{inv.recipient_name}</td>
                            <td className="py-3 px-2"><Badge tone={inv.status}>{inv.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {invitations.length > 10 && (
                    <div className="mt-4 pt-3 border-t border-ivory-line flex items-center justify-between text-xs text-ink/60 flex-wrap gap-2">
                      <span>
                        Showing {Math.min(visibleCount, invitations.length)} of {invitations.length} invitations
                      </span>
                      <div className="flex items-center gap-2">
                        {visibleCount > 10 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisibleCount(10)}
                            className="text-xs py-1 px-3"
                          >
                            Show Less
                          </Button>
                        )}
                        {visibleCount < invitations.length && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setVisibleCount((prev) => prev + 20)}
                            className="text-xs py-1 px-3"
                          >
                            See More (+20)
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  </>
                )}
              </Card>
            </section>
            )}

            {/* Phase 3: Confirmations */}
            {phaseVisibility.phase_2_visible && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-2xl font-semibold text-emerald-deep">Phase 3: Initial Confirmations</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/send-confirmation')}>
                    Manage Confirmations →
                  </Button>
                </div>

                {/* Breakdown by Event */}
                {events.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((e) => {
                      const isVevaan = isVevaanEvent(user.role, e.event_name)
                      const evStat = stats.eventStats?.[e.id] || { confirmed: 0, declined: 0, pendingConfirmations: 0 }
                      return (
                        <Card 
                          key={e.id} 
                          className={`p-4 border transition ${
                            isVevaan 
                              ? 'bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border-purple-200' 
                              : 'bg-white border-ivory-line'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-ivory-line pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm ${isVevaan ? 'text-purple-950' : 'text-ink'}`}>
                                {e.event_name}
                              </span>
                              {isVevaan && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-700 text-white">
                                  Vevaan
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-ink/50">
                              {stats.seatsPerEvent?.[e.id] || 0} Invited
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                              <div className="text-[10px] font-semibold text-emerald-800 uppercase">Confirmed</div>
                              <div className="font-display text-lg font-bold text-emerald-700">{evStat.confirmed}</div>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                              <div className="text-[10px] font-semibold text-rose-800 uppercase">Declined</div>
                              <div className="font-display text-lg font-bold text-rose-700">{evStat.declined}</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                              <div className="text-[10px] font-semibold text-amber-800 uppercase">Pending</div>
                              <div className="font-display text-lg font-bold text-amber-700">{evStat.pendingConfirmations}</div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}

                {stats.declined > 0 && (
                  <div className="mt-4 p-4 bg-emerald-soft/30 rounded-xl border border-emerald-soft flex items-center justify-between">
                    <p className="text-emerald-deep font-medium">
                      🎉 You have {stats.declined} declined seats! You can now invite more people to fill these seats.
                    </p>
                    <Link to="/dashboard/add-invitee">
                      <Button size="sm">Invite More</Button>
                    </Link>
                  </div>
                )}
              </section>
            )}

            {phaseVisibility.phase_2_visible && phaseVisibility.phase_3_visible && (
              <div className="h-px bg-ivory-line w-full mb-8" />
            )}

            {/* Phase 4: RSVPs */}
            {phaseVisibility.phase_3_visible && (
              <section>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h2 className="font-display text-2xl font-semibold text-emerald-deep">Phase 4: RSVPs</h2>
                </div>

                {/* Breakdown by Event */}
                {events.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((e) => {
                      const isVevaan = isVevaanEvent(user.role, e.event_name)
                      const evStat = stats.eventStats?.[e.id] || { attending: 0, notAttending: 0, pendingRsvps: 0 }
                      return (
                        <Card 
                          key={e.id} 
                          className={`p-4 border transition ${
                            isVevaan 
                              ? 'bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border-purple-200' 
                              : 'bg-white border-ivory-line'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3 border-b border-ivory-line pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-semibold text-sm ${isVevaan ? 'text-purple-950' : 'text-ink'}`}>
                                {e.event_name}
                              </span>
                              {isVevaan && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-700 text-white">
                                  Vevaan
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-medium text-ink/50">
                              {stats.seatsPerEvent?.[e.id] || 0} Invited
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                              <div className="text-[10px] font-semibold text-emerald-800 uppercase">Attending</div>
                              <div className="font-display text-lg font-bold text-emerald-700">{evStat.attending}</div>
                            </div>
                            <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
                              <div className="text-[10px] font-semibold text-rose-800 uppercase">Not Attending</div>
                              <div className="font-display text-lg font-bold text-rose-700">{evStat.notAttending}</div>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-2 border border-amber-100">
                              <div className="text-[10px] font-semibold text-amber-800 uppercase">Pending</div>
                              <div className="font-display text-lg font-bold text-amber-700">{evStat.pendingRsvps}</div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
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
