import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { Field, Input } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getAdminStats, getAllInvitations, getAllFamilies, getAllUsersSafe, getEvents, resetUserData, resetUserPhaseData, deleteAllFamilies, updateUserPermissions, getGlobalPhaseVisibility, setGlobalPhaseVisibility } from '../lib/db'
import { getTemplate, setTemplate, DEFAULT_TEMPLATE } from '../lib/messageTemplate'
import Modal from '../components/ui/Modal'

const NAV = [
  { path: '/admin', label: 'Overview', icon: '⌂' },
  { path: '/admin/families', label: 'Families', icon: '👪' },
  { path: '/admin/invitations', label: 'Invitations', icon: '✉' },
  { path: '/admin/users', label: 'Users', icon: '☺' },
  { path: '/admin/phases', label: 'Phase Controls', icon: '⚙' },
  { path: '/admin/template', label: 'Message Template', icon: '✎' },
]

export default function AdminDashboard({ tab = 'overview' }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [families, setFamilies] = useState([])
  const [users, setUsers] = useState([])
  const [events, setEvents] = useState([])
  const [phaseVisibility, setPhaseVisibility] = useState({ phase_1_visible: true, phase_2_visible: true, phase_3_visible: true })

  const load = async () => {
    setLoading(true)
    const [s, inv, fam, u, evt, pv] = await Promise.all([
      getAdminStats(), getAllInvitations(), getAllFamilies(), getAllUsersSafe(), getEvents(), getGlobalPhaseVisibility()
    ])
    setStats(s); setInvitations(inv); setFamilies(fam); setUsers(u); setEvents(evt); setPhaseVisibility(pv)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const activePath = { overview: '/admin', families: '/admin/families', invitations: '/admin/invitations', users: '/admin/users', phases: '/admin/phases', template: '/admin/template' }[tab]

  return (
    <DashboardLayout navItems={NAV} activePath={activePath} roleLabel="Admin">
      <h1 className="font-display text-3xl font-semibold text-emerald-deep mb-1">Admin Dashboard</h1>
      <p className="text-sm text-ink/60 mb-7">Full visibility across every bride, groom, family and invitation.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : (
        <>
          {tab === 'overview' && <Overview stats={stats} events={events} />}
          {tab === 'families' && <FamiliesTable families={families} onRefresh={load} />}
          {tab === 'invitations' && <InvitationsTable invitations={invitations} />}
          {tab === 'users' && <UsersTable users={users} onRefresh={load} />}
          {tab === 'phases' && <PhasesTable users={users} onRefresh={load} phaseVisibility={phaseVisibility} />}
          {tab === 'template' && <TemplateEditor />}
        </>
      )}
    </DashboardLayout>
  )
}

function Overview({ stats, events }) {
  const cards = [
    ['Total Brides', stats.totalBrides],
    ['Total Grooms', stats.totalGrooms],
    ['Total Families', stats.totalFamilies],
    ['Total Invitees', stats.totalInvitees],
    ['Total Invitations', stats.totalInvitations],
    ['Sent Invitations', stats.sentInvitations],
    ['Pending Invitations', stats.pendingInvitations],
    ['Families Engaged', stats.totalFamiliesInvited],
  ]
  const rsvpCards = [
    ['Attending', stats.attending || 0],
    ['Not Attending', stats.notAttending || 0],
    ['Pending RSVPs', stats.pendingRsvps || 0],
  ]
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {cards.map(([label, value]) => (
          <Card key={label} className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
            <p className="font-display text-3xl font-semibold mt-1 text-emerald-deep">{value}</p>
          </Card>
        ))}
      </div>
      
      <h2 className="font-display text-xl font-semibold text-emerald-deep mb-4">RSVP Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {rsvpCards.map(([label, value]) => (
          <Card key={label} className="p-4 sm:p-5 border-t-4 border-t-gold">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">{label}</p>
            <p className="font-display text-3xl font-semibold mt-1 text-emerald-deep">{value}</p>
          </Card>
        ))}
      </div>
      <Card className="p-5 sm:p-6">
        <h2 className="font-display text-xl font-semibold text-emerald-deep mb-4">Wedding events</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {events.map((e) => (
            <div key={e.id} className="rounded-lg border border-ivory-line p-4">
              <p className="font-semibold text-emerald-deep">{e.event_name}</p>
              <p className="text-xs text-ink/50 mt-1">{new Date(e.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {e.event_time}</p>
              <p className="text-xs text-ink/50">{e.venue}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

function FamiliesTable({ families, onRefresh }) {
  const { showToast } = useToast()
  const [q, setQ] = useState('')
  const filtered = families.filter((f) => f.surname.toLowerCase().includes(q.toLowerCase()))
  
  const handleDeleteAll = async () => {
    if (confirm('⚠️ WARNING: Are you absolutely sure you want to delete ALL families? This will also wipe out all invitees and generated invitations across all accounts! This action cannot be undone.')) {
      try {
        await deleteAllFamilies()
        showToast('All families and associated data have been permanently deleted.', 'error')
        onRefresh()
      } catch (err) {
        showToast(`Failed to delete families: ${err.message}`, 'error')
      }
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-display text-xl font-semibold text-emerald-deep">All Families</h2>
        <div className="flex items-center gap-3">
          <Input placeholder="Search surname…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Button variant="ghost" className="text-wine border border-wine/20 hover:bg-wine/5" onClick={handleDeleteAll}>
            Delete All Families
          </Button>
        </div>
      </div>
      {filtered.length === 0 ? <EmptyState icon="👪" title="No families found" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                <th className="py-2 px-2">Surname</th><th className="py-2 px-2">Members</th><th className="py-2 px-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-ivory-line last:border-0">
                  <td className="py-3 px-2 font-medium">{f.surname}</td>
                  <td className="py-3 px-2">{f.members.length}</td>
                  <td className="py-3 px-2">{f.manual ? <Badge tone="default">Manual entry</Badge> : <Badge tone="Sent">Master data</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function InvitationsTable({ invitations }) {
  const [q, setQ] = useState('')
  const filtered = invitations.filter((i) => i.surname.toLowerCase().includes(q.toLowerCase()) || i.recipient_mobile.includes(q))
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-display text-xl font-semibold text-emerald-deep">All Invitations</h2>
        <Input placeholder="Search family or mobile…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      </div>
      {filtered.length === 0 ? <EmptyState icon="✉" title="No invitations yet" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink/45 border-b border-ivory-line">
                <th className="py-2 px-2">Family</th><th className="py-2 px-2">Members</th><th className="py-2 px-2">Events</th><th className="py-2 px-2">Invited By</th><th className="py-2 px-2">Recipient</th><th className="py-2 px-2">Status</th><th className="py-2 px-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-ivory-line last:border-0">
                  <td className="py-3 px-2 font-medium">{i.surname}</td>
                  <td className="py-3 px-2">{i.invitee_ids.length}</td>
                  <td className="py-3 px-2">{i.event_names}</td>
                  <td className="py-3 px-2 font-medium text-emerald-deep">{i.invited_by}</td>
                  <td className="py-3 px-2">{i.recipient_name}</td>
                  <td className="py-3 px-2"><Badge tone={i.status}>{i.status}</Badge></td>
                  <td className="py-3 px-2 text-xs text-ink/50">{new Date(i.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function UsersTable({ users, onRefresh }) {
  const { showToast } = useToast()
  const brides = users.filter((u) => u.role === 'bride')
  const grooms = users.filter((u) => u.role === 'groom')
  
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', action: null, isDanger: false })

  const handleReset = (u) => {
    setConfirmState({
      open: true,
      title: 'Reset All Data',
      message: `Are you sure you want to reset ALL data for ${u.display_name}? This will permanently delete all their invitees and generated invitations.`,
      isDanger: true,
      action: async () => {
        try {
          await resetUserData(u.id)
          showToast(`Successfully reset all data for ${u.display_name}`)
          onRefresh()
        } catch (err) {
          showToast(`Failed to reset data: ${err.message}`, 'error')
        }
      }
    })
  }

  const handlePhaseReset = (u, phase, label, message) => {
    setConfirmState({
      open: true,
      title: `Reset ${label}`,
      message: `Are you sure you want to reset ${label.toLowerCase()} for ${u.display_name}? ${message}`,
      isDanger: true,
      action: async () => {
        try {
          await resetUserPhaseData(u.id, phase)
          showToast(`Successfully reset ${label.toLowerCase()} for ${u.display_name}`)
          onRefresh()
        } catch (err) {
          showToast(`Failed to reset: ${err.message}`, 'error')
        }
      }
    })
  }

  const handleBulkReset = (usersList, roleLabel) => {
    setConfirmState({
      open: true,
      title: `Bulk Reset Data`,
      message: `Are you REALLY sure you want to reset ALL data for ALL ${roleLabel}s? This cannot be undone and will delete all their invitees and generated invitations.`,
      isDanger: true,
      action: async () => {
        try {
          await Promise.all(usersList.map(u => resetUserData(u.id)))
          showToast(`Successfully reset data for all ${roleLabel}s`)
          onRefresh()
        } catch (err) {
          showToast(`Failed bulk reset: ${err.message}`, 'error')
        }
      }
    })
  }

  const handleBulkPhaseReset = (usersList, roleLabel, phase, label, message) => {
    setConfirmState({
      open: true,
      title: `Bulk Reset ${label}`,
      message: `Are you sure you want to reset ${label.toLowerCase()} for ALL ${roleLabel}s? ${message}`,
      isDanger: true,
      action: async () => {
        try {
          await Promise.all(usersList.map(u => resetUserPhaseData(u.id, phase)))
          showToast(`Successfully reset ${label.toLowerCase()} for all ${roleLabel}s`)
          onRefresh()
        } catch (err) {
          showToast(`Failed bulk reset: ${err.message}`, 'error')
        }
      }
    })
  }

  const renderUserItem = (u) => (
    <li key={u.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate max-w-[150px] xl:max-w-xs block" title={u.display_name}>{u.display_name}</span>
        <span className="font-mono text-[10px] text-ink/45 bg-ivory-line/30 px-1.5 py-0.5 rounded shrink-0">{u.username}</span>
      </div>
      <div className="flex items-center shadow-sm rounded-md overflow-hidden border border-wine/20">
        <button className="text-[10px] font-bold text-wine hover:bg-wine/10 px-2 py-1.5 border-r border-wine/20 transition-colors" onClick={() => handlePhaseReset(u, 1, 'Phase 1 (Invitees)', 'This will permanently delete all invitees and invitations.')} title="Reset Phase 1 (Invitees)">P1</button>
        <button className="text-[10px] font-bold text-wine hover:bg-wine/10 px-2 py-1.5 border-r border-wine/20 transition-colors" onClick={() => handlePhaseReset(u, 2, 'Phase 2 (Invitations)', 'This will delete generated invitations, but keep the invitee list intact.')} title="Reset Phase 2 (Invitations)">P2</button>
        <button className="text-[10px] font-bold text-wine hover:bg-wine/10 px-2 py-1.5 border-r border-wine/20 transition-colors" onClick={() => handlePhaseReset(u, 3, 'Phase 3 (RSVPs)', 'This will reset all RSVP statuses to "Pending".')} title="Reset Phase 3 (RSVPs)">P3</button>
        <button className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2 py-1.5 transition-colors" onClick={() => handleReset(u)} title="Reset All Data">ALL</button>
      </div>
    </li>
  )

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ivory-line bg-ivory-soft/50 flex flex-col gap-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-display text-xl font-semibold text-emerald-deep flex items-center gap-2">
              Bride Accounts <Badge tone="neutral">{brides.length}</Badge>
            </h2>
            <button className="flex items-center border border-rose-200/60 rounded bg-white shadow-sm overflow-hidden hover:bg-rose-50 transition-colors px-2.5 py-1 text-rose-600 font-medium text-xs whitespace-nowrap" onClick={() => handleBulkReset(brides, 'Bride')}>
              <span className="mr-1.5">⚠️</span> Reset All Data
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(brides, 'Bride', 1, 'Phase 1 (Invitees)', 'This will permanently delete all invitees and invitations for all brides.')}>
              Reset All P1
            </Button>
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(brides, 'Bride', 2, 'Phase 2 (Invitations)', 'This will delete generated invitations for all brides, but keep their invitee lists intact.')}>
              Reset All P2
            </Button>
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(brides, 'Bride', 3, 'Phase 3 (RSVPs)', 'This will reset all RSVP statuses to "Pending" for all brides.')}>
              Reset All P3
            </Button>
          </div>
        </div>
        <ul className="divide-y divide-ivory-line px-5 sm:px-6">
          {brides.map(renderUserItem)}
        </ul>
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ivory-line bg-ivory-soft/50 flex flex-col gap-3">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="font-display text-xl font-semibold text-emerald-deep flex items-center gap-2">
              Groom Accounts <Badge tone="neutral">{grooms.length}</Badge>
            </h2>
            <button className="flex items-center border border-rose-200/60 rounded bg-white shadow-sm overflow-hidden hover:bg-rose-50 transition-colors px-2.5 py-1 text-rose-600 font-medium text-xs whitespace-nowrap" onClick={() => handleBulkReset(grooms, 'Groom')}>
              <span className="mr-1.5">⚠️</span> Reset All Data
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(grooms, 'Groom', 1, 'Phase 1 (Invitees)', 'This will permanently delete all invitees and invitations for all grooms.')}>
              Reset All P1
            </Button>
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(grooms, 'Groom', 2, 'Phase 2 (Invitations)', 'This will delete generated invitations for all grooms, but keep their invitee lists intact.')}>
              Reset All P2
            </Button>
            <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 whitespace-nowrap text-xs py-1 px-2 h-auto bg-white shadow-sm" onClick={() => handleBulkPhaseReset(grooms, 'Groom', 3, 'Phase 3 (RSVPs)', 'This will reset all RSVP statuses to "Pending" for all grooms.')}>
              Reset All P3
            </Button>
          </div>
        </div>
        <ul className="divide-y divide-ivory-line px-5 sm:px-6">
          {grooms.map(renderUserItem)}
        </ul>
      </Card>

      <Modal 
        open={confirmState.open} 
        onClose={() => setConfirmState({ ...confirmState, open: false })} 
        title={confirmState.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmState({ ...confirmState, open: false })}>Cancel</Button>
            <Button 
              variant={confirmState.isDanger ? 'primary' : 'primary'} 
              className={confirmState.isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
              onClick={() => {
                confirmState.action?.()
                setConfirmState({ ...confirmState, open: false })
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink/70 leading-relaxed">{confirmState.message}</p>
      </Modal>
    </div>
  )
}

function PhasesTable({ users, onRefresh, phaseVisibility }) {
  const { showToast } = useToast()
  const brides = users.filter((u) => u.role === 'bride')
  const grooms = users.filter((u) => u.role === 'groom')
  const admin = users.find((u) => u.role === 'admin')
  
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', action: null, isDanger: false })

  const handleGlobalRsvpToggle = async () => {
    if (!admin) return
    const newValue = !(admin.can_send_rsvps !== false)
    try {
      await updateUserPermissions(admin.id, { can_send_rsvps: newValue })
      showToast(`Public RSVP Form is now ${newValue ? 'OPEN' : 'CLOSED'}`)
      onRefresh()
    } catch (err) {
      showToast(`Failed to update global setting: ${err.message}`, 'error')
    }
  }

  const handleGlobalPhaseVisibilityToggle = async (phase) => {
    const field = `phase_${phase}_visible`
    const newValue = !phaseVisibility[field]
    try {
      await setGlobalPhaseVisibility({ [field]: newValue })
      showToast(`Phase ${phase} is now ${newValue ? 'VISIBLE' : 'HIDDEN'} on Bride/Groom Dashboards`)
      onRefresh()
    } catch (err) {
      showToast(`Failed to update visibility: ${err.message}`, 'error')
    }
  }

  const handleToggle = (u, field) => {
    const newValue = !u[field]
    
    let featureName = 'Feature'
    if (field === 'can_add_invitees') featureName = 'Add Invitees'
    if (field === 'can_send_invitations') featureName = 'Send Invitations'
    if (field === 'can_send_rsvps') featureName = 'Send RSVPs'
    
    if (newValue === false) {
      setConfirmState({
        open: true,
        title: `Lock ${featureName}`,
        message: `Are you sure you want to lock the "${featureName}" feature for ${u.display_name}? They will instantly lose access to this feature.`,
        isDanger: true,
        action: async () => {
          await performToggle(u.id, field, newValue, u.display_name, featureName)
        }
      })
      return
    }

    performToggle(u.id, field, newValue, u.display_name, featureName)
  }

  const performToggle = async (userId, field, newValue, displayName, featureName) => {
    try {
      await updateUserPermissions(userId, { [field]: newValue })
      showToast(`${featureName} for ${displayName} is now ${newValue ? 'Enabled' : 'Disabled'}`)
      onRefresh()
    } catch (err) {
      showToast(`Failed to update permissions: ${err.message}`, 'error')
    }
  }

  const handleBulkToggle = (usersList, roleLabel, field, newValue) => {
    let featureName = 'Feature'
    if (field === 'can_add_invitees') featureName = 'Add Invitees'
    if (field === 'can_send_invitations') featureName = 'Send Invitations'
    if (field === 'can_send_rsvps') featureName = 'Send RSVPs'
    
    setConfirmState({
      open: true,
      title: `Bulk ${newValue ? 'Unlock' : 'Lock'} ${featureName}`,
      message: `Are you sure you want to ${newValue ? 'unlock' : 'lock'} the "${featureName}" feature for ALL ${roleLabel}s?`,
      isDanger: !newValue,
      action: async () => {
        try {
          for (const u of usersList) {
            await updateUserPermissions(u.id, { [field]: newValue })
          }
          showToast(`Successfully updated ${featureName} for all ${roleLabel}s`)
          onRefresh()
        } catch (err) {
          showToast(`Failed bulk update: ${err.message}`, 'error')
        }
      }
    })
  }

  const renderUserItem = (u) => (
    <li key={u.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-medium truncate max-w-[150px] xl:max-w-[200px] block" title={u.display_name}>{u.display_name}</span>
        <span className="font-mono text-[10px] text-ink/45 bg-ivory-line/30 px-1.5 py-0.5 rounded shrink-0">{u.username}</span>
      </div>
      <div className="flex flex-wrap items-center gap-3 xl:gap-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={u.can_add_invitees !== false} 
            onChange={() => handleToggle(u, 'can_add_invitees')}
            className="rounded border-ivory-line text-emerald focus:ring-emerald cursor-pointer shrink-0"
          />
          <span className="text-xs text-ink/70 whitespace-nowrap">Add Invitees</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={u.can_send_invitations !== false} 
            onChange={() => handleToggle(u, 'can_send_invitations')}
            className="rounded border-ivory-line text-emerald focus:ring-emerald cursor-pointer shrink-0"
          />
          <span className="text-xs text-ink/70 whitespace-nowrap">Send Invites</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input 
            type="checkbox" 
            checked={u.can_send_rsvps !== false} 
            onChange={() => handleToggle(u, 'can_send_rsvps')}
            className="rounded border-ivory-line text-emerald focus:ring-emerald cursor-pointer shrink-0"
          />
          <span className="text-xs text-ink/70 whitespace-nowrap">Send RSVPs</span>
        </label>
      </div>
    </li>
  )

  return (
    <>
      <Card className="p-5 sm:p-6 mb-6">
        <h2 className="font-display text-xl font-semibold text-emerald-deep mb-2">Global Settings</h2>
        <p className="text-sm text-ink/60 mb-5">These settings affect the entire platform.</p>
        <div className="flex items-center justify-between p-4 border border-ivory-line rounded-lg bg-ivory-soft/30">
          <div>
            <p className="font-medium text-emerald-deep">Accept Public RSVPs</p>
            <p className="text-xs text-ink/60 mt-1">If closed, guests will not be able to submit their RSVP response via the shared link.</p>
          </div>
          {admin && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={admin.can_send_rsvps !== false} onChange={handleGlobalRsvpToggle} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
            </label>
          )}
        </div>
        <div className="flex items-center justify-between p-4 border border-ivory-line rounded-lg bg-ivory-soft/30 mt-3">
          <div>
            <p className="font-medium text-emerald-deep">Phase 1: Planning Visibility</p>
            <p className="text-xs text-ink/60 mt-1">If hidden, brides/grooms will not see the Address Book and Planning sections.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={phaseVisibility?.phase_1_visible !== false} onChange={() => handleGlobalPhaseVisibilityToggle(1)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 border border-ivory-line rounded-lg bg-ivory-soft/30 mt-3">
          <div>
            <p className="font-medium text-emerald-deep">Phase 2: Invitations Visibility</p>
            <p className="text-xs text-ink/60 mt-1">If hidden, brides/grooms will not see the Send Invitations sections.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={phaseVisibility?.phase_2_visible !== false} onChange={() => handleGlobalPhaseVisibilityToggle(2)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
          </label>
        </div>
        <div className="flex items-center justify-between p-4 border border-ivory-line rounded-lg bg-ivory-soft/30 mt-3">
          <div>
            <p className="font-medium text-emerald-deep">Phase 3: RSVPs Visibility</p>
            <p className="text-xs text-ink/60 mt-1">If hidden, brides/grooms will not see the RSVP status on their dashboard.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={phaseVisibility?.phase_3_visible !== false} onChange={() => handleGlobalPhaseVisibilityToggle(3)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald"></div>
          </label>
        </div>
      </Card>
      
      <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ivory-line bg-ivory-soft/50">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-semibold text-emerald-deep flex items-center gap-2">
              Bride Accounts <Badge tone="neutral">{brides.length}</Badge>
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Add Invitees:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_add_invitees', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_add_invitees', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send Invites:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_invitations', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_invitations', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send RSVPs:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_rsvps', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_rsvps', false)}>Lock</button>
              </div>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-ivory-line px-5 sm:px-6">
          {brides.map(renderUserItem)}
        </ul>
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ivory-line bg-ivory-soft/50">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-semibold text-emerald-deep flex items-center gap-2">
              Groom Accounts <Badge tone="neutral">{grooms.length}</Badge>
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Add Invitees:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_add_invitees', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_add_invitees', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send Invites:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_invitations', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_invitations', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden whitespace-nowrap shrink-0">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send RSVPs:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_rsvps', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_rsvps', false)}>Lock</button>
              </div>
            </div>
          </div>
        </div>
        <ul className="divide-y divide-ivory-line px-5 sm:px-6">
          {grooms.map(renderUserItem)}
        </ul>
      </Card>

      <Modal 
        open={confirmState.open} 
        onClose={() => setConfirmState({ ...confirmState, open: false })} 
        title={confirmState.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmState({ ...confirmState, open: false })}>Cancel</Button>
            <Button 
              variant={confirmState.isDanger ? 'primary' : 'primary'} 
              className={confirmState.isDanger ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}
              onClick={() => {
                confirmState.action?.()
                setConfirmState({ ...confirmState, open: false })
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink/70 leading-relaxed">{confirmState.message}</p>
      </Modal>
    </div>
    </>
  )
}

function TemplateEditor() {
  const { showToast } = useToast()
  const [value, setValue] = useState(getTemplate())

  const save = () => {
    setTemplate(value)
    showToast('Invitation template updated for all bride/groom accounts.')
  }

  const reset = () => {
    setValue(DEFAULT_TEMPLATE)
    setTemplate(DEFAULT_TEMPLATE)
    showToast('Template reset to default.', 'info')
  }

  return (
    <Card className="p-5 sm:p-6 max-w-2xl">
      <h2 className="font-display text-xl font-semibold text-emerald-deep mb-2">WhatsApp Message Template</h2>
      <p className="text-sm text-ink/60 mb-4">
        Available placeholders: <code className="font-mono text-xs bg-ivory-soft px-1.5 py-0.5 rounded">{'{{recipient_name}}'}</code>{' '}
        <code className="font-mono text-xs bg-ivory-soft px-1.5 py-0.5 rounded">{'{{family_members}}'}</code>{' '}
        <code className="font-mono text-xs bg-ivory-soft px-1.5 py-0.5 rounded">{'{{events}}'}</code>{' '}
        <code className="font-mono text-xs bg-ivory-soft px-1.5 py-0.5 rounded">{'{{bride_name}}'}</code>{' '}
        <code className="font-mono text-xs bg-ivory-soft px-1.5 py-0.5 rounded">{'{{groom_name}}'}</code>
      </p>
      <Field label="Template">
        <textarea
          className="w-full min-h-[280px] text-sm rounded-lg border border-ivory-line p-3 focus:border-gold focus:ring-1 focus:ring-gold outline-none font-body"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </Field>
      <div className="flex gap-3 mt-4">
        <Button onClick={save}>Save Template</Button>
        <Button variant="ghost" onClick={reset}>Reset to Default</Button>
      </div>
    </Card>
  )
}
