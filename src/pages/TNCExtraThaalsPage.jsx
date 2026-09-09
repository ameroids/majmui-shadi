import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { getBridesAndGrooms, updateUserPermissions } from '../lib/db'
import { useToast } from '../context/ToastContext'

const TNC_NAV = [
  { path: '/tnc', label: 'Reports & Search', icon: '⌕' },
  { path: '/tnc/reports', label: 'Event Reports', icon: '📊' },
  { path: '/tnc/individual', label: 'Individual Reports', icon: '👤' },
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' },
  { path: '/tnc/thaals', label: 'Extra Thaals', icon: '🍲' }
]

export default function TNCExtraThaalsPage() {
  const [loading, setLoading] = useState(true)
  const [bridesGrooms, setBridesGrooms] = useState([])
  const [updatingId, setUpdatingId] = useState(null)
  const { showToast } = useToast()

  const load = async () => {
    setLoading(true)
    const bg = await getBridesAndGrooms()
    setBridesGrooms(bg)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleUpdateThaals = async (userId, newThaals) => {
    if (newThaals < 0) return
    setUpdatingId(userId)
    try {
      await updateUserPermissions(userId, { extra_thaals: newThaals })
      showToast('Successfully updated extra thaals', 'success')
      await load()
    } catch (err) {
      showToast('Error updating extra thaals', 'error')
    } finally {
      setUpdatingId(null)
    }
  }

  const totalExtraThaals = bridesGrooms.reduce((sum, u) => sum + (u.extra_thaals || 0), 0)
  const totalExtraPeople = totalExtraThaals * 8

  return (
    <DashboardLayout navItems={TNC_NAV} activePath="/tnc/thaals" roleLabel="TNC">
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-emerald-deep mb-1">Extra Thaals Report</h1>
          <p className="text-sm text-ink/60">View and update the extra capacity for brides and grooms.</p>
        </div>
        {!loading && totalExtraThaals > 0 && (
          <div className="mt-4 sm:mt-0 bg-gold-light/20 px-4 py-3 rounded-lg border border-gold/40 text-center min-w-[140px] flex flex-col justify-center">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gold-deep mb-1">Total Extra Capacity</div>
            <div className="font-display text-lg font-semibold text-gold-deep leading-none">
              {totalExtraThaals} Thaals <span className="text-sm opacity-80 font-normal">({totalExtraPeople} people)</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : (
        <Card className="p-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                  <th className="py-3 px-2">Bride/Groom</th>
                  <th className="py-3 px-2 text-center">Extra Thaals</th>
                  <th className="py-3 px-2 text-center">Extra People Allowed</th>
                </tr>
              </thead>
              <tbody>
                {bridesGrooms.map(u => {
                  const extra = u.extra_thaals || 0
                  return (
                    <tr key={u.id} className="border-b border-ivory-line last:border-0 hover:bg-ivory-soft/30 transition">
                      <td className="py-3 px-2 font-medium">{u.display_name} <span className="text-xs text-ink/40 ml-1">({u.role})</span></td>
                      <td className="py-3 px-2 text-center font-semibold text-emerald-deep">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-ivory-line/50 hover:bg-emerald-soft text-emerald-deep disabled:opacity-50"
                            onClick={() => handleUpdateThaals(u.id, extra - 1)}
                            disabled={extra <= 0 || updatingId === u.id}
                          >
                            -
                          </button>
                          <span className="w-4 text-center">{updatingId === u.id ? <Spinner className="w-3 h-3 mx-auto" /> : extra}</span>
                          <button 
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-ivory-line/50 hover:bg-emerald-soft text-emerald-deep disabled:opacity-50"
                            onClick={() => handleUpdateThaals(u.id, extra + 1)}
                            disabled={updatingId === u.id}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {extra > 0 ? extra * 8 : <span className="text-ink/40 font-normal">-</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardLayout>
  )
}
