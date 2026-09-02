import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import EmptyState from '../components/ui/EmptyState'
import { Field, Input, Select, Checkbox } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { searchFamilyByHofIts, createManualFamily, updateManualFamily, saveInvitees, getFamiliesWithInviteesForUser, removeInvitee } from '../lib/db'
import Modal from '../components/ui/Modal'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { path: '/dashboard/add-invitee', label: 'Add Invitee', icon: '＋' },
  { path: '/dashboard/send-invitation', label: 'Send Invitation', icon: '✎' },
]

const emptyManualMember = () => ({
  key: Math.random().toString(36).slice(2),
  full_name: '',
  mobile: '',
})

export default function AddInviteePage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [its, setIts] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [family, setFamily] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [saving, setSaving] = useState(false)

  const [showManualForm, setShowManualForm] = useState(false)
  const [lockedModal, setLockedModal] = useState({ open: false, title: '', message: '' })
  const [editingFamilyId, setEditingFamilyId] = useState(null)
  const [manualSurname, setManualSurname] = useState('')
  const [manualHofIts, setManualHofIts] = useState('')
  const [manualMembers, setManualMembers] = useState([emptyManualMember()])
  const [manualError, setManualError] = useState('')

  const [myFamilies, setMyFamilies] = useState([])
  const [loadingList, setLoadingList] = useState(true)

  const refreshList = async () => {
    setLoadingList(true)
    const list = await getFamiliesWithInviteesForUser(user.id)
    setMyFamilies(list)
    setLoadingList(false)
  }

  useEffect(() => { refreshList() }, []) // eslint-disable-line

  const resetSearch = () => {
    setFamily(null)
    setSearched(false)
    setSelectedIds(new Set())
    setShowManualForm(false)
    setEditingFamilyId(null)
    setManualHofIts(its)
  }

  const handleSearch = async (eOrIts) => {
    let searchIts = its
    if (typeof eOrIts === 'string') {
      searchIts = eOrIts
      setIts(eOrIts)
    } else {
      eOrIts?.preventDefault()
    }

    if (user.can_add_invitees === false) {
      setLockedModal({
        open: true,
        title: 'Action Locked',
        message: 'You cannot add new invitees. Kindly contact your TNC admin for assistance.'
      })
      return
    }

    if (!searchIts.trim()) return
    setSearching(true)
    setSearched(false)
    const result = await searchFamilyByHofIts(searchIts.trim())
    setSearching(false)
    setSearched(true)
    setFamily(result)
    setManualHofIts(searchIts.trim())
    setShowManualForm(false)
    setEditingFamilyId(null)
    if (result) {
      // pre-check members already invited by this user
      const already = myFamilies.find((f) => f.family_id === result.id)
      const preselected = new Set((already?.members || []).map((m) => m.member_id))
      setSelectedIds(preselected)
    }
  }

  const toggleMember = (memberId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(memberId) ? next.delete(memberId) : next.add(memberId)
      return next
    })
  }

  const handleSaveSelected = async () => {
    setSaving(true)
    try {
      const selectedMembers = family.members.filter((m) => selectedIds.has(m.id))
      await saveInvitees(user.id, family, selectedMembers)
      showToast(`${selectedMembers.length} member(s) added from the ${family.surname} family.`)
      await refreshList()
      resetSearch()
      setIts('')
    } catch (err) {
      showToast(err.message || 'Error saving invitees', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addManualRow = () => setManualMembers((rows) => [...rows, emptyManualMember()])
  const removeManualRow = (key) => setManualMembers((rows) => rows.filter((r) => r.key !== key))
  const updateManualRow = (key, field, value) =>
    setManualMembers((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)))

  const handleEditFamily = () => {
    setEditingFamilyId(family.id)
    setManualHofIts(family.hof_its)
    setManualSurname(family.surname)
    setManualMembers(family.members.map(m => ({
      ...m,
      key: m.id || Math.random().toString(36).slice(2)
    })))
    setShowManualForm(true)
  }

  const handleManualSave = async () => {
    setManualError('')
    if (!manualHofIts.trim() || !manualSurname.trim()) {
      setManualError('HOF ITS and Family/Surname are required.')
      return
    }
    const invalid = manualMembers.some((m) => !m.full_name.trim() || !m.mobile.trim())
    if (invalid) {
      setManualError('Every member needs a full name and mobile number.')
      return
    }
    setSaving(true)
    try {
      if (editingFamilyId) {
        const updatedFamily = await updateManualFamily(editingFamilyId, {
          hof_its: manualHofIts.trim(),
          surname: manualSurname.trim(),
          members: manualMembers.map(({ key, ...m }) => m),
        })
        // Save all members of the updated family to the invitee list so new additions are included.
        await saveInvitees(user.id, updatedFamily, updatedFamily.members)
        
        setFamily(updatedFamily)
        setShowManualForm(false)
        setEditingFamilyId(null)
        showToast('Family details updated successfully.')
        await refreshList()
      } else {
        const newFamily = await createManualFamily({
          hof_its: manualHofIts.trim(),
          surname: manualSurname.trim(),
          members: manualMembers.map(({ key, ...m }) => m), // eslint-disable-line no-unused-vars
        })
        await saveInvitees(user.id, newFamily, newFamily.members)
        showToast(`${newFamily.members.length} manually added invitee(s) saved for the ${newFamily.surname} family.`)
        await refreshList()
        resetSearch()
        setIts('')
        setManualSurname('')
        setManualHofIts('')
        setManualMembers([emptyManualMember()])
      }
    } catch (err) {
      if (err.message?.includes('families_hof_its_key')) {
        setManualError(`A family with HOF ITS "${manualHofIts}" already exists! Please search for it using the search bar above instead of creating it manually.`)
      } else {
        setManualError(err.message || 'Error creating manual family')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (inviteeId) => {
    await removeInvitee(user.id, inviteeId)
    showToast('Invitee removed.', 'info')
    refreshList()
  }

  return (
    <DashboardLayout navItems={NAV} activePath="/dashboard/add-invitee" roleLabel={user.role}>
      <h1 className="font-display text-3xl font-semibold text-emerald-deep">Add Invitee</h1>
      <p className="text-sm text-ink/60 mt-1 mb-6 max-w-xl">
        Search a family by their Head-of-Family ITS number, then choose exactly which members
        to invite. Selecting members here never changes the original family record.
      </p>

      <Card className="p-5 sm:p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={its}
              onChange={(e) => setIts(e.target.value)}
              placeholder="Enter HOF ITS Number"
              inputMode="numeric"
              className="font-mono"
            />
          </div>
          <Button type="submit" loading={searching} className="sm:w-40">
            Search
          </Button>
        </form>

        {searching && (
          <div className="flex items-center gap-2 text-sm text-ink/50 mt-4">
            <Spinner className="h-4 w-4" /> Looking up ITS {its}…
          </div>
        )}

        {!searching && searched && family && !showManualForm && (
          <FamilyResult
            family={family}
            selectedIds={selectedIds}
            onToggle={toggleMember}
            onSave={handleSaveSelected}
            saving={saving}
            alreadyInvited={new Set((myFamilies.find((f) => f.family_id === family.id)?.members || []).map((m) => m.member_id))}
            onEditFamily={family.is_manual ? handleEditFamily : null}
          />
        )}

        {!searching && searched && !family && !showManualForm && (
          <div className="mt-5 rounded-xl border border-dashed border-ivory-line bg-ivory-soft p-5 text-center">
            <p className="text-sm font-medium text-ink/70">No family found for ITS "{its}".</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => {
              if (user.can_add_invitees === false) {
                setLockedModal({
                  open: true,
                  title: 'Action Locked',
                  message: 'You cannot add new invitees. Kindly contact your TNC admin for assistance.'
                })
                return
              }
              setShowManualForm(true)
            }}>
              Create Invitee Manually
            </Button>
          </div>
        )}

        {showManualForm && (
          <ManualEntryForm
            isEdit={!!editingFamilyId}
            manualHofIts={manualHofIts}
            setManualHofIts={setManualHofIts}
            manualSurname={manualSurname}
            setManualSurname={setManualSurname}
            manualMembers={manualMembers}
            addManualRow={addManualRow}
            removeManualRow={removeManualRow}
            updateManualRow={updateManualRow}
            manualError={manualError}
            onCancel={() => {
              setShowManualForm(false)
              setEditingFamilyId(null)
            }}
            onSave={handleManualSave}
            saving={saving}
          />
        )}
      </Card>

      <h2 className="font-display text-xl font-semibold text-emerald-deep mb-3">Your invitees so far</h2>
      {loadingList ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-8"><Spinner className="h-4 w-4" /> Loading…</div>
      ) : myFamilies.length === 0 ? (
        <Card className="p-6">
          <EmptyState icon="👪" title="No invitees added yet" description="Search a family by ITS number above to get started." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {myFamilies.map((f) => (
            <Card key={f.family_id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-semibold text-emerald-deep">{f.surname}</h3>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-ink/40">HOF ITS {f.hof_its}</span>
                  <button 
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      handleSearch(f.hof_its)
                    }}
                    className="text-xs font-semibold text-emerald-deep hover:text-emerald tap-target"
                  >
                    Edit
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {f.members.map((m) => (
                  <li key={m.id} className="flex justify-between items-center py-2 border-b border-ivory-line last:border-0 group">
                    <div>
                      <div className="font-medium text-ink">{m.full_name}</div>
                      <div className="text-sm text-ink/50 font-mono flex gap-2">
                        {m.mobile && <span>· {m.mobile}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge tone={m.invitation_status}>{m.invitation_status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      <Modal 
        open={lockedModal.open} 
        onClose={() => setLockedModal({ ...lockedModal, open: false })}
        title={lockedModal.title}
        size="sm"
        footer={
          <Button onClick={() => setLockedModal({ ...lockedModal, open: false })} className="w-full sm:w-auto">
            Got it
          </Button>
        }
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-3xl mb-4">🔒</div>
          <p className="text-base text-ink/80">{lockedModal.message}</p>
        </div>
      </Modal>

    </DashboardLayout>
  )
}

function FamilyResult({ family, selectedIds, onToggle, onSave, saving, alreadyInvited, onEditFamily }) {
  return (
    <div className="mt-5 rounded-xl border border-ivory-line overflow-hidden">
      <div className="bg-emerald-soft px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-deep/70 font-semibold">HOF: {family.members.find(m => m.relationship === 'HOF')?.full_name || family.members[0].full_name}</p>
          <p className="font-mono text-xs text-emerald-deep/60">ITS: {family.hof_its}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-deep bg-white/60 rounded-full px-3 py-1">
            {family.surname} family · {family.members.length} member{family.members.length !== 1 ? 's' : ''}
          </span>
          {onEditFamily && (
            <Button variant="outline" size="sm" onClick={onEditFamily} className="!py-1 !px-3 text-xs shadow-sm">
              Edit
            </Button>
          )}
        </div>
      </div>
      <ul className="divide-y divide-ivory-line">
        {family.members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
            <Checkbox
              id={`mem-${m.id}`}
              checked={selectedIds.has(m.id)}
              onChange={() => onToggle(m.id)}
              label={
                <span>
                  <span className="font-medium">{m.full_name}</span>
                  <span className="text-ink/45 text-xs"> · {m.relationship} · {m.mobile}</span>
                </span>
              }
            />
            {alreadyInvited.has(m.id) && <Badge tone="Ready">Added</Badge>}
          </li>
        ))}
      </ul>
      <div className="px-4 sm:px-5 py-4 bg-ivory-soft flex justify-end">
        <Button onClick={onSave} loading={saving}>
          Save Selected Invitees ({selectedIds.size})
        </Button>
      </div>
    </div>
  )
}

function ManualEntryForm({
  isEdit,
  manualHofIts, setManualHofIts, manualSurname, setManualSurname,
  manualMembers, addManualRow, removeManualRow, updateManualRow,
  manualError, onCancel, onSave, saving,
}) {
  return (
    <div className="mt-5 rounded-xl border border-ivory-line p-4 sm:p-5">
      <h3 className="font-display text-lg font-semibold text-emerald-deep mb-4">{isEdit ? 'Edit Invitee Manually' : 'Create Invitee Manually'}</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <Field label="HOF ITS" required>
          <Input value={manualHofIts} onChange={(e) => setManualHofIts(e.target.value)} placeholder="e.g. 30987654" className="font-mono" />
        </Field>
        <Field label="Family / Surname" required>
          <Input value={manualSurname} onChange={(e) => setManualSurname(e.target.value)} placeholder="e.g. Saifuddin" />
        </Field>
      </div>

      <div className="space-y-4">
        {manualMembers.map((m, idx) => (
          <div key={m.key} className="rounded-lg bg-ivory-soft border border-ivory-line p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">Member {idx + 1}</span>
              {manualMembers.length > 1 && (
                <button onClick={() => removeManualRow(m.key)} className="text-xs text-wine font-medium tap-target">Remove</button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <Input value={m.full_name} onChange={(e) => updateManualRow(m.key, 'full_name', e.target.value)} />
              </Field>
              <Field label="Mobile Number" required>
                <Input value={m.mobile} onChange={(e) => updateManualRow(m.key, 'mobile', e.target.value)} inputMode="numeric" placeholder="98XXXXXXXX" />
              </Field>
            </div>
          </div>
        ))}
      </div>

      {manualError && <p className="text-sm text-wine font-medium mt-4">{manualError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
        <Button variant="ghost" size="sm" onClick={addManualRow}>+ Add another member</Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSave} loading={saving}>{isEdit ? 'Update Invitees' : 'Save Invitees'}</Button>
        </div>
      </div>
    </div>
  )
}
