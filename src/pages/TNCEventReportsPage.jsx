import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Select } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { getEventGuestData, getEvents } from '../lib/db'

const TNC_NAV = [
  { path: '/tnc', label: 'Reports & Search', icon: '⌕' },
  { path: '/tnc/reports', label: 'Event Reports', icon: '📊' },
  { path: '/tnc/individual', label: 'Individual Reports', icon: '👤' },
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' },
  { path: '/tnc/thaals', label: 'Extra Thaals', icon: '🍲' }
]

export default function TNCEventReportsPage() {
  const [loading, setLoading] = useState(true)
  const [guestData, setGuestData] = useState({})
  const [events, setEvents] = useState([])
  const [activeEventId, setActiveEventId] = useState('')
  const [activeTab, setActiveTab] = useState('actual') // 'actual' | 'unique' | 'duplicate'

  useEffect(() => {
    let alive = true
    async function load() {
      const [data, evts] = await Promise.all([getEventGuestData(), getEvents()])
      if (!alive) return
      setGuestData(data)
      setEvents(evts)
      if (evts.length > 0) setActiveEventId(evts[0].id)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const currentEventData = guestData[activeEventId] || {
    totalActual: 0,
    totalUnique: 0,
    totalDuplicates: 0,
    actualGuests: [],
    uniqueGuests: [],
    duplicateGuests: []
  }

  const listToRender = 
    activeTab === 'actual' ? currentEventData.actualGuests :
    activeTab === 'total' ? currentEventData.totalGuests : 
    currentEventData.duplicateGuests

  return (
    <DashboardLayout navItems={TNC_NAV} activePath="/tnc/reports" roleLabel="TNC">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl font-semibold text-emerald-deep mb-1">Event Reports</h1>
          <p className="text-sm text-ink/60">
            View actual headcounts and duplicate clashes for specific events.
          </p>
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={activeEventId} onChange={e => setActiveEventId(e.target.value)}>
            {events.map(e => <option key={e.id} value={e.id}>{e.event_name}</option>)}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : events.length === 0 ? (
        <Card className="p-5 sm:p-6 mb-8">
           <EmptyState icon="⚠" title="No events found" description="Please add events in the Admin panel." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-5 text-center sm:text-left">
              <div className="text-sm text-ink/50 uppercase tracking-wider mb-1">Total Actual Guests</div>
              <div className="text-3xl font-display font-semibold text-emerald-deep">{currentEventData.totalActual}</div>
              <div className="text-xs text-ink/40 mt-1">Deduplicated headcount</div>
            </Card>
            <Card className="p-5 text-center sm:text-left">
              <div className="text-sm text-ink/50 uppercase tracking-wider mb-1">Total Invitations</div>
              <div className="text-3xl font-display font-semibold text-blue-600">{currentEventData.totalTotal}</div>
              <div className="text-xs text-ink/40 mt-1">Includes all duplicates</div>
            </Card>
            <Card className="p-5 text-center sm:text-left">
              <div className="text-sm text-ink/50 uppercase tracking-wider mb-1">Duplicate Clashes</div>
              <div className="text-3xl font-display font-semibold text-rose-600">{currentEventData.totalDuplicates}</div>
              <div className="text-xs text-ink/40 mt-1">Invited by multiple</div>
            </Card>
          </div>

          <div className="bg-gradient-to-r from-emerald-deep to-teal-900 p-6 rounded-2xl text-white shadow-lg mb-10 flex flex-col sm:flex-row items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 text-center sm:text-left mb-4 sm:mb-0">
              <h3 className="text-xl font-display font-bold text-gold mb-1 flex items-center justify-center sm:justify-start gap-2">
                <svg className="w-5 h-5 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Benefit of TNC
              </h3>
              <p className="text-white/70 text-sm">Total duplicate invitations successfully deduplicated.</p>
            </div>
            <div className="relative z-10 bg-white/10 px-6 py-3 rounded-xl border border-white/20">
              <div className="text-4xl font-display font-bold text-white text-center">
                {currentEventData.totalTotal - currentEventData.totalActual}
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/50 text-center mt-1">Saved Entries</div>
            </div>
          </div>

          <div className="flex gap-4 border-b border-ivory-line mb-6">
            <button
              onClick={() => setActiveTab('actual')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${activeTab === 'actual' ? 'border-emerald text-emerald-deep' : 'border-transparent text-ink/50 hover:text-ink'}`}
            >
              Actual Guest List
            </button>
            <button
              onClick={() => setActiveTab('total')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${activeTab === 'total' ? 'border-emerald text-emerald-deep' : 'border-transparent text-ink/50 hover:text-ink'}`}
            >
              Total Guest Invitations
            </button>
            <button
              onClick={() => setActiveTab('duplicate')}
              className={`pb-3 text-sm font-medium border-b-2 transition ${activeTab === 'duplicate' ? 'border-emerald text-emerald-deep' : 'border-transparent text-ink/50 hover:text-ink'}`}
            >
              Duplicate Clashes
            </button>
          </div>

          {listToRender.length === 0 ? (
            <Card className="p-5 sm:p-6">
              <EmptyState 
                icon="✓" 
                title="No guests found" 
                description="No members found for this specific filter in the selected event." 
              />
            </Card>
          ) : (
            <Card className="overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead className="bg-ivory-soft border-b border-ivory-line">
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/45">
                      <th className="py-3 px-4">Member</th>
                      <th className="py-3 px-4">Invited By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-line">
                    {listToRender.map((guest, idx) => (
                      <tr key={guest.member_id + idx} className="hover:bg-ivory-soft/50 transition">
                        <td className="py-3 px-4 font-medium text-ink align-top">
                          <div className="font-medium text-ink">{guest.full_name}</div>
                          <div className="text-xs text-ink/50">{guest.surname} Family</div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="flex flex-col gap-2">
                            {guest.invitedByList.map((by, i) => (
                              <div key={i} className="flex items-center">
                                <Badge tone="Ready">{by.name}</Badge>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
