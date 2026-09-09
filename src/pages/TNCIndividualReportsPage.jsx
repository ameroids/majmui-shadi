import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Select } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { getBridesAndGrooms, getUserInviteesWithEvents, getEvents } from '../lib/db'

const TNC_NAV = [
  { path: '/tnc', label: 'Reports & Search', icon: '⌕' },
  { path: '/tnc/reports', label: 'Event Reports', icon: '📊' },
  { path: '/tnc/individual', label: 'Individual Reports', icon: '👤' },
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' },
  { path: '/tnc/thaals', label: 'Extra Thaals', icon: '🍲' }
]

export default function TNCIndividualReportsPage() {
  const [loading, setLoading] = useState(true)
  const [loadingInvitees, setLoadingInvitees] = useState(false)
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  
  const [selectedUserId, setSelectedUserId] = useState('')
  const [filterEventId, setFilterEventId] = useState('')
  const [filterStatus, setFilterStatus] = useState('Sent') // Default to showing only Sent
  const [invitees, setInvitees] = useState([])
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [eventDropdownOpen, setEventDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [viewFamilyModal, setViewFamilyModal] = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      const [fetchedUsers, fetchedEvents] = await Promise.all([
        getBridesAndGrooms(),
        getEvents()
      ])
      if (!alive) return
      setUsers(fetchedUsers)
      setEvents(fetchedEvents)
      // Do not auto-select the first user
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setInvitees([])
      return
    }
    let alive = true
    async function loadInvitees() {
      setLoadingInvitees(true)
      const data = await getUserInviteesWithEvents(selectedUserId)
      if (!alive) return
      setInvitees(data)
      setLoadingInvitees(false)
    }
    loadInvitees()
    return () => { alive = false }
  }, [selectedUserId])

  const selectedUser = users.find(u => u.id === selectedUserId)

  // Filter invitees by event if filterEventId is set
  let displayInvitees = invitees
  if (filterEventId) {
    displayInvitees = displayInvitees.filter(inv => inv.invitation_member_events?.some(e => e.event_id === filterEventId))
  }
  if (filterStatus === 'Sent') {
    displayInvitees = displayInvitees.filter(inv => ['Sent', 'WhatsApp Opened', 'RSVP Sent', 'RSVPed'].includes(inv.invitation_status))
  } else if (filterStatus === 'Ready') {
    displayInvitees = displayInvitees.filter(inv => inv.invitation_status === 'Ready')
  } else if (filterStatus === 'Added') {
    displayInvitees = displayInvitees.filter(inv => inv.invitation_status === 'Draft' || inv.invitation_status === 'Not Invited')
  }

  const familiesMap = new Map()
  displayInvitees.forEach(inv => {
    if (!familiesMap.has(inv.family_id)) {
      familiesMap.set(inv.family_id, {
        id: inv.family_id,
        surname: inv.surname,
        hof_its: inv.hof_its,
        members: []
      })
    }
    familiesMap.get(inv.family_id).members.push(inv)
  })
  const displayFamilies = Array.from(familiesMap.values()).sort((a, b) => a.surname.localeCompare(b.surname))

  return (
    <DashboardLayout navItems={TNC_NAV} activePath="/tnc/individual" roleLabel="TNC">
      <div className="mb-8 animate-fade-in relative z-50">
        <div className="relative rounded-2xl bg-gradient-to-r from-emerald-deep to-teal-800 p-8 text-white shadow-xl">
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {selectedUser ? (
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-display font-bold shadow-inner border border-white/30">
                  {selectedUser.display_name.charAt(0).toUpperCase()}
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
              )}
              
              <div>
                <h1 className="font-display text-3xl font-semibold mb-1">
                  {selectedUser ? selectedUser.display_name : 'Individual Reports'}
                </h1>
                <p className="text-emerald-100/80 text-sm">
                  {selectedUser ? `@${selectedUser.username} • Auditing guest list` : 'Select a Bride or Groom to audit their list'}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              {selectedUserId && (
                <div className="w-full sm:w-40 relative animate-fade-in">
                  <div 
                    className="glass-card p-3 rounded-xl cursor-pointer flex justify-between items-center text-ink shadow-sm hover:shadow transition-shadow"
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  >
                    <span className="font-medium truncate mr-2">
                      {filterStatus === 'Sent' ? '📬 Sent' : 
                       filterStatus === 'Ready' ? '⏳ Ready' : 
                       '📝 Added'}
                    </span>
                    <svg className={`w-4 h-4 text-ink/60 transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {statusDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-ivory-line z-50 max-h-64 overflow-y-auto animate-fade-in">
                      {[
                        { value: 'Sent', label: '📬 Sent' },
                        { value: 'Ready', label: '⏳ Ready' },
                        { value: 'Added', label: '📝 Added' }
                      ].map(opt => (
                        <div 
                          key={opt.value}
                          className={`px-4 py-3 cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 last:border-0 ${filterStatus === opt.value ? 'bg-emerald/10 text-emerald-deep font-semibold' : 'text-ink'}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFilterStatus(opt.value);
                            setStatusDropdownOpen(false);
                          }}
                        >
                          {opt.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event Filter - Only visible when filterStatus is Sent or Pending */}
              {selectedUserId && (filterStatus === 'Sent' || filterStatus === 'Pending') && (
                <div className="w-full sm:w-48 relative animate-fade-in">
                  <div 
                    className="glass-card p-3 rounded-xl cursor-pointer flex justify-between items-center text-ink shadow-sm hover:shadow transition-shadow"
                    onClick={() => setEventDropdownOpen(!eventDropdownOpen)}
                  >
                    <span className="font-medium truncate mr-2">
                      {filterEventId 
                        ? `✨ ${events.find(e => e.id === filterEventId)?.event_name}` 
                        : '✨ All Events'}
                    </span>
                    <svg className={`w-4 h-4 text-ink/60 transition-transform ${eventDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {eventDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-ivory-line z-50 max-h-64 overflow-y-auto animate-fade-in">
                      <div 
                        className={`px-4 py-3 cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 text-ink ${!filterEventId ? 'bg-emerald/10 text-emerald-deep font-semibold' : ''}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setFilterEventId('');
                          setEventDropdownOpen(false);
                        }}
                      >
                        ✨ All Events
                      </div>
                      {events.map(e => (
                        <div 
                          key={e.id}
                          className={`px-4 py-3 cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 last:border-0 ${e.id === filterEventId ? 'bg-emerald/10 text-emerald-deep font-semibold' : 'text-ink'}`}
                          onMouseDown={(ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            setFilterEventId(e.id);
                            setEventDropdownOpen(false);
                          }}
                        >
                          {e.event_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Custom User Dropdown */}
              <div className="w-full sm:w-72 relative">
                <div 
                  className="glass-card p-3 rounded-xl cursor-pointer flex justify-between items-center text-ink shadow-sm hover:shadow transition-shadow"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span className="font-medium truncate mr-2">
                    {selectedUser ? `${selectedUser.display_name} (@${selectedUser.username})` : 'Select a Bride/Groom...'}
                  </span>
                  <svg className={`w-4 h-4 text-ink/60 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {dropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-ivory-line z-50 max-h-64 overflow-y-auto animate-fade-in">
                    <div 
                      className={`px-4 py-3 cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 text-ink/60 italic ${!selectedUserId ? 'bg-emerald/5' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedUserId('');
                        setDropdownOpen(false);
                      }}
                    >
                      Select a Bride/Groom...
                    </div>
                    {users.map(u => (
                      <div 
                        key={u.id}
                        className={`px-4 py-3 cursor-pointer hover:bg-emerald/5 transition-colors border-b border-ivory-line/50 last:border-0 ${u.id === selectedUserId ? 'bg-emerald/10 text-emerald-deep font-semibold' : 'text-ink'}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedUserId(u.id);
                          setDropdownOpen(false);
                        }}
                      >
                        {u.display_name} <span className="text-xs text-ink/50 ml-1">(@{u.username})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : users.length === 0 ? (
        <Card className="p-5 sm:p-6 mb-8">
           <EmptyState icon="⚠" title="No users found" description="There are no registered Brides or Grooms yet." />
        </Card>
      ) : (
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {selectedUserId && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-ivory-line/50 relative overflow-hidden">
              {/* Left accented border */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold to-amber-500"></div>
              
              <div className="flex items-center gap-4 pl-2">
                <div className="w-12 h-12 rounded-xl bg-ivory-soft flex items-center justify-center text-emerald-deep shadow-inner border border-ivory-line/30">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-ink leading-tight">
                    Guest Roster
                  </h2>
                  <p className="text-xs text-ink/60 font-medium mt-0.5">
                    Managing the active guest list for this selection
                  </p>
                </div>
              </div>

              <div className="flex items-center bg-emerald-deep/5 px-5 py-2.5 rounded-xl border border-emerald-deep/10 shadow-sm">
                 <span className="text-2xl font-bold text-emerald-deep leading-none">{displayFamilies.length}</span>
                 <span className="text-xs font-bold text-emerald-deep/70 uppercase tracking-widest ml-2.5 pt-0.5">Total</span>
              </div>
            </div>
          )}

          {!selectedUserId ? (
            <Card className="p-8 sm:p-12 border-dashed shadow-none bg-ivory-soft/50 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                🔎
              </div>
              <h3 className="text-lg font-medium text-ink mb-1">Select a User</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto">
                Please select a Bride or Groom from the dropdown above to view their individual guest roster.
              </p>
            </Card>
          ) : loadingInvitees ? (
             <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink/50 bg-ivory-soft rounded-2xl border border-ivory-line border-dashed">
               <Spinner className="h-6 w-6 text-emerald" />
               <span className="text-sm font-medium">Loading roster...</span>
             </div>
          ) : displayFamilies.length === 0 ? (
            <Card className="p-8 sm:p-12 border-dashed shadow-none bg-ivory-soft/50 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-2xl">
                📭
              </div>
              <h3 className="text-lg font-medium text-ink mb-1">No Guests Found</h3>
              <p className="text-sm text-ink/60 max-w-sm mx-auto">
                {filterEventId 
                  ? "This user hasn't invited anyone to the selected event yet." 
                  : "This user hasn't added any invitees to their roster."}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayFamilies.map((fam, idx) => {
                const status = fam.members[0]?.invitation_status || 'Unknown'
                const isSentStatus = status === 'Sent' || status === 'WhatsApp Opened' || status === 'RSVP Sent' || status === 'RSVPed'
                const isReadyStatus = status === 'Ready'
                
                return (
                  <div 
                    key={fam.id} 
                    className="group bg-white rounded-2xl p-5 border border-ivory-line shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-slide-up flex flex-col justify-between"
                    style={{ animationDelay: `${0.1 + (idx % 10) * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-ink leading-tight">{fam.surname} Family</h3>
                        <p className="text-xs text-ink/50 mt-0.5">{fam.members.length} member{fam.members.length !== 1 ? 's' : ''}</p>
                      </div>
                      <Badge tone={isSentStatus ? 'Sent' : isReadyStatus ? 'Ready' : 'Draft'} className="shrink-0 shadow-sm">
                        {status}
                      </Badge>
                    </div>
                    
                    <div className="pt-4 border-t border-ivory-line/60 flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => setViewFamilyModal(fam)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {viewFamilyModal && (
        <Modal open={!!viewFamilyModal} onClose={() => setViewFamilyModal(null)} title={`${viewFamilyModal.surname} Family Details`}>
          <div className="space-y-4">
            <div className="text-sm text-ink/60 mb-2 font-mono">HOF ITS: {viewFamilyModal.hof_its}</div>
            <div className="border border-ivory-line rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ivory-soft border-b border-ivory-line">
                  <tr>
                    <th className="py-3 px-4 text-left font-semibold text-ink/70">Member Name</th>
                    <th className="py-3 px-4 text-left font-semibold text-ink/70">Contact</th>
                    <th className="py-3 px-4 text-left font-semibold text-ink/70">Invited Events</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-line">
                  {viewFamilyModal.members.map(m => (
                    <tr key={m.id} className="hover:bg-ivory-soft/30 transition">
                      <td className="py-3 px-4 font-medium text-ink">{m.full_name}</td>
                      <td className="py-3 px-4 text-ink/70 font-mono text-xs">{m.mobile || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {m.invitation_member_events?.map(e => {
                            const evt = events.find(ev => ev.id === e.event_id)
                            return evt ? (
                              <span key={e.event_id} className="text-[10px] px-2 py-0.5 bg-emerald/10 text-emerald-deep rounded font-medium border border-emerald/20">
                                {evt.event_name}
                              </span>
                            ) : null
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  )
}
