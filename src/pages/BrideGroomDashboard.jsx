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
import { getUserStats, getInvitationsByUser } from '../lib/db'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      const [s, inv] = await Promise.all([getUserStats(user.id), getInvitationsByUser(user.id)])
      if (!alive) return
      setStats(s)
      setInvitations(inv)
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [user.id])

  return (
    <DashboardLayout navItems={NAV} activePath="/dashboard" roleLabel={user.role}>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard label="Total Invitees" value={stats.totalInvitees} accent />
            <StatCard label="Total Families" value={stats.totalFamilies} accent />
            <StatCard label="Invitations Ready" value={stats.ready} accent />
            <StatCard label="Invitations Sent" value={stats.sent} accent />
          </div>



          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-emerald-deep">Invitation progress</h2>
              {invitations.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/send-invitation')}>
                  View all →
                </Button>
              )}
            </div>

            {invitations.length === 0 ? (
              <EmptyState
                icon="✉"
                title="No invitations yet"
                description="Once you add invitees and generate a WhatsApp invitation, it will appear here with its status."
                action={
                  <Button size="sm" onClick={() => navigate('/dashboard/add-invitee')}>
                    Add your first invitee
                  </Button>
                }
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
                    {invitations.slice(0, 6).map((inv) => (
                      <tr key={inv.id} className="border-b border-ivory-line last:border-0">
                        <td className="py-3 px-2 font-medium text-ink">{inv.surname}</td>
                        <td className="py-3 px-2 text-ink/70">{inv.invitee_ids.length}</td>
                        <td className="py-3 px-2 text-ink/70">{inv.event_names}</td>
                        <td className="py-3 px-2 text-ink/70">{inv.recipient_name}</td>
                        <td className="py-3 px-2"><Badge tone={inv.status}>{inv.status}</Badge></td>
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

function StatCard({ label, value, accent }) {
  return (
    <Card className={`p-4 sm:p-5 ${accent ? 'bg-emerald-deep' : ''}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? 'text-gold-light' : 'text-ink/45'}`}>
        {label}
      </p>
      <p className={`font-display text-3xl sm:text-4xl font-semibold mt-1 ${accent ? 'text-ivory' : 'text-emerald-deep'}`}>
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
