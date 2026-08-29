import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Input } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { getAdminStats, getAllFamilies, getAllInvitees, getAllInvitations } from '../lib/db'

const NAV = [{ path: '/tnc', label: 'Reports & Search', icon: '⌕' }]

export default function TNCDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [families, setFamilies] = useState([])
  const [invitees, setInvitees] = useState([])
  const [invitations, setInvitations] = useState([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      const [s, fam, inv, invt] = await Promise.all([getAdminStats(), getAllFamilies(), getAllInvitees(), getAllInvitations()])
      if (!alive) return
      setStats(s); setFamilies(fam); setInvitees(inv); setInvitations(invt)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [])

  const q = query.trim().toLowerCase()
  const matchedFamilies = q
    ? families.filter((f) => f.surname.toLowerCase().includes(q) || f.hof_its.includes(q) || f.members.some((m) => m.mobile?.includes(q) || m.full_name.toLowerCase().includes(q)))
    : []
  const matchedInvitations = q
    ? invitations.filter((i) => i.surname.toLowerCase().includes(q) || i.recipient_mobile.includes(q))
    : []

  return (
    <DashboardLayout navItems={NAV} activePath="/tnc" roleLabel="TNC">
      <h1 className="font-display text-3xl font-semibold text-emerald-deep mb-1">TNC Dashboard</h1>
      <p className="text-sm text-ink/60 mb-7">Read-only visibility into families, invitees and invitation status.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <Stat label="Total Families" value={stats.totalFamilies} />
            <Stat label="Total Invitees" value={stats.totalInvitees} />
            <Stat label="Invitations Sent" value={stats.sentInvitations} />
            <Stat label="Invitations Pending" value={stats.pendingInvitations} />
          </div>

          <Card className="p-5 sm:p-6 mb-8">
            <h2 className="font-display text-xl font-semibold text-emerald-deep mb-3">Search</h2>
            <Input
              placeholder="Search by ITS number, family/surname, or mobile number…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            {q && (
              <div className="mt-5 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">Families ({matchedFamilies.length})</p>
                  {matchedFamilies.length === 0 ? (
                    <p className="text-sm text-ink/45">No matching families.</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {matchedFamilies.map((f) => (
                        <div key={f.id} className="rounded-lg border border-ivory-line p-4">
                          <div className="flex justify-between">
                            <span className="font-semibold text-emerald-deep">{f.surname}</span>
                            <span className="font-mono text-xs text-ink/40">{f.hof_its}</span>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {f.members.map((m) => (
                              <li key={m.id} className="text-xs text-ink/60 flex justify-between">
                                <span>{m.full_name}</span><span className="font-mono">{m.mobile}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 mb-2">Invitations ({matchedInvitations.length})</p>
                  {matchedInvitations.length === 0 ? (
                    <p className="text-sm text-ink/45">No matching invitations.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[560px]">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                            <th className="py-2 px-2">Family</th><th className="py-2 px-2">Recipient</th><th className="py-2 px-2">Invited By</th><th className="py-2 px-2">Events</th><th className="py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matchedInvitations.map((i) => (
                            <tr key={i.id} className="border-b border-ivory-line last:border-0">
                              <td className="py-2.5 px-2 font-medium">{i.surname}</td>
                              <td className="py-2.5 px-2">{i.recipient_name} <span className="font-mono text-xs text-ink/40">({i.recipient_mobile})</span></td>
                              <td className="py-2.5 px-2 font-medium text-emerald-deep">{i.invited_by}</td>
                              <td className="py-2.5 px-2">{i.event_names}</td>
                              <td className="py-2.5 px-2"><Badge tone={i.status}>{i.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-emerald-deep mb-4">All invitation records</h2>
            {invitations.length === 0 ? <EmptyState icon="✉" title="No invitations recorded yet" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[640px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                      <th className="py-2 px-2">Family</th><th className="py-2 px-2">Members</th><th className="py-2 px-2">Invited By</th><th className="py-2 px-2">Events</th><th className="py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((i) => (
                      <tr key={i.id} className="border-b border-ivory-line last:border-0">
                        <td className="py-2.5 px-2 font-medium">{i.surname}</td>
                        <td className="py-2.5 px-2">{i.invitee_ids.length}</td>
                        <td className="py-2.5 px-2 font-medium text-emerald-deep">{i.invited_by}</td>
                        <td className="py-2.5 px-2">{i.event_names}</td>
                        <td className="py-2.5 px-2"><Badge tone={i.status}>{i.status}</Badge></td>
                      </tr>
                    ))}
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
