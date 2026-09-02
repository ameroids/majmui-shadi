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
import { getAdminStats, getAllInvitations, getAllFamilies, getAllUsersSafe, getEvents, resetUserData, deleteAllFamilies, updateUserPermissions } from '../lib/db'
import { getTemplate, setTemplate, DEFAULT_TEMPLATE } from '../lib/messageTemplate'
import Modal from '../components/ui/Modal'

const NAV = [
  { path: '/admin', label: 'Overview', icon: '⌂' },
  { path: '/admin/families', label: 'Families', icon: '👪' },
  { path: '/admin/invitations', label: 'Invitations', icon: '✉' },
  { path: '/admin/users', label: 'Users', icon: '☺' },
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

  const load = async () => {
    setLoading(true)
    const [s, inv, fam, u, evt] = await Promise.all([
      getAdminStats(), getAllInvitations(), getAllFamilies(), getAllUsersSafe(), getEvents(),
    ])
    setStats(s); setInvitations(inv); setFamilies(fam); setUsers(u); setEvents(evt)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const activePath = { overview: '/admin', families: '/admin/families', invitations: '/admin/invitations', users: '/admin/users', template: '/admin/template' }[tab]

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
  const filtered = families.filter((f) => f.surname.toLowerCase().includes(q.toLowerCase()) || f.hof_its.includes(q))
  
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
          <Input placeholder="Search surname or ITS…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
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
                <th className="py-2 px-2">Surname</th><th className="py-2 px-2">HOF ITS</th><th className="py-2 px-2">Members</th><th className="py-2 px-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-ivory-line last:border-0">
                  <td className="py-3 px-2 font-medium">{f.surname}</td>
                  <td className="py-3 px-2 font-mono text-xs">{f.hof_its}</td>
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
      title: 'Reset Data',
      message: `Are you sure you want to reset all data for ${u.display_name}? This will permanently delete all their invitees and generated invitations.`,
      isDanger: true,
      action: async () => {
        try {
          await resetUserData(u.id)
          showToast(`Successfully reset data for ${u.display_name}`)
          onRefresh()
        } catch (err) {
          showToast(`Failed to reset data: ${err.message}`, 'error')
        }
      }
    })
  }

  const handleToggle = (u, field) => {
    const newValue = !u[field]
    
    // If we are disabling the feature, ask for confirmation via modal
    if (newValue === false) {
      const featureName = field === 'can_add_invitees' ? 'Add Invitees' : 'Send Invitations'
      setConfirmState({
        open: true,
        title: `Lock ${featureName}`,
        message: `Are you sure you want to lock the "${featureName}" feature for ${u.display_name}? They will instantly lose access to this feature.`,
        isDanger: true,
        action: async () => {
          await performToggle(u.id, field, newValue, u.display_name)
        }
      })
      return
    }

    // If enabling, just do it directly
    performToggle(u.id, field, newValue, u.display_name)
  }

  const performToggle = async (userId, field, newValue, displayName) => {
    try {
      await updateUserPermissions(userId, { [field]: newValue })
      showToast(`${field === 'can_add_invitees' ? 'Add Invitees' : 'Send Invitations'} for ${displayName} is now ${newValue ? 'Enabled' : 'Disabled'}`)
      onRefresh()
    } catch (err) {
      showToast(`Failed to update permissions: ${err.message}`, 'error')
    }
  }

  const handleBulkToggle = (usersList, roleLabel, field, newValue) => {
    const featureName = field === 'can_add_invitees' ? 'Add Invitees' : 'Send Invitations'
    setConfirmState({
      open: true,
      title: `Bulk ${newValue ? 'Unlock' : 'Lock'} ${featureName}`,
      message: `Are you sure you want to ${newValue ? 'unlock' : 'lock'} the "${featureName}" feature for ALL ${roleLabel}s?`,
      isDanger: !newValue,
      action: async () => {
        try {
          // Update all users in parallel
          await Promise.all(usersList.map(u => updateUserPermissions(u.id, { [field]: newValue })))
          showToast(`Successfully updated ${featureName} for all ${roleLabel}s`)
          onRefresh()
        } catch (err) {
          showToast(`Failed bulk update: ${err.message}`, 'error')
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

  const renderUserItem = (u) => (
    <li key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
      <div>
        <div className="flex items-center">
          <span className="font-medium mr-2">{u.display_name}</span>
          <span className="font-mono text-xs text-ink/45">{u.username}</span>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={u.can_add_invitees !== false} 
              onChange={() => handleToggle(u, 'can_add_invitees')}
              className="rounded border-ivory-line text-emerald focus:ring-emerald cursor-pointer"
            />
            <span className="text-xs text-ink/70">Add Invitees</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input 
              type="checkbox" 
              checked={u.can_send_invitations !== false} 
              onChange={() => handleToggle(u, 'can_send_invitations')}
              className="rounded border-ivory-line text-emerald focus:ring-emerald cursor-pointer"
            />
            <span className="text-xs text-ink/70">Send Invites</span>
          </label>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="text-wine border border-wine/20 hover:bg-wine/5 self-start sm:self-center" onClick={() => handleReset(u)}>
        Reset Data
      </Button>
    </li>
  )

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card className="p-0 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-ivory-line bg-ivory-soft/50">
          <div className="flex flex-col gap-3">
            <h2 className="font-display text-xl font-semibold text-emerald-deep flex items-center gap-2">
              Bride Accounts <Badge tone="neutral">{brides.length}</Badge>
            </h2>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Add Invitees:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_add_invitees', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_add_invitees', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send Invites:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_invitations', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(brides, 'Bride', 'can_send_invitations', false)}>Lock</button>
              </div>
              <button className="flex items-center border border-rose-200/60 rounded bg-white shadow-sm overflow-hidden hover:bg-rose-50 transition-colors px-2.5 py-1 text-rose-600 font-medium ml-auto" onClick={() => handleBulkReset(brides, 'Bride')}>
                <span className="mr-1.5">⚠️</span> Reset All
              </button>
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
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Add Invitees:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_add_invitees', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_add_invitees', false)}>Lock</button>
              </div>
              <div className="flex items-center border border-ivory-line rounded bg-white shadow-sm overflow-hidden">
                <span className="px-2 py-1 text-ink/70 font-medium border-r border-ivory-line bg-ivory-soft">Send Invites:</span>
                <button className="px-2 py-1 hover:bg-emerald-soft text-emerald-deep font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_invitations', true)}>Unlock</button>
                <div className="w-px h-4 bg-ivory-line"></div>
                <button className="px-2 py-1 hover:bg-rose-50 text-rose-600 font-medium transition-colors" onClick={() => handleBulkToggle(grooms, 'Groom', 'can_send_invitations', false)}>Lock</button>
              </div>
              <button className="flex items-center border border-rose-200/60 rounded bg-white shadow-sm overflow-hidden hover:bg-rose-50 transition-colors px-2.5 py-1 text-rose-600 font-medium ml-auto" onClick={() => handleBulkReset(grooms, 'Groom')}>
                <span className="mr-1.5">⚠️</span> Reset All
              </button>
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
