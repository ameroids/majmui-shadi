import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import { Field, Input, Checkbox } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import {
  searchFamiliesByName, createManualFamily, updateManualFamily, checkExistingMembersByIts,
  saveInvitees, getFamiliesWithInviteesForUser, removeInvitee,
  getEvents, createInvitation, getInvitationsByUser,
  updateInvitationStatus, updateInvitationMessage
} from '../lib/db'
import { generateMessage, buildWhatsappLink } from '../lib/messageTemplate'

const TNC_NAV = [
  { path: '/tnc', label: 'Reports & Search', icon: '⌕' },
  { path: '/tnc/invitations', label: 'TNC Invites', icon: '💌' },
  { path: '/tnc/reports', label: 'Event Reports', icon: '📊' },
  { path: '/tnc/individual', label: 'Individual Reports', icon: '👤' },
  { path: '/tnc/rsvp', label: 'RSVP Reports', icon: '✉️' },
  { path: '/tnc/thaals', label: 'Extra Thaals', icon: '🍲' }
]

const emptyManualMember = () => ({
  key: Math.random().toString(36).slice(2),
  full_name: '',
  mobile: '',
  member_its: '',
  relationship: 'Self',
  gender: 'Male'
})

export default function TNCInvitationsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState('invitations') // 'invitations' | 'guests'
  const [loading, setLoading] = useState(true)

  // Data
  const [myFamilies, setMyFamilies] = useState([])
  const [invitations, setInvitations] = useState([])
  const [events, setEvents] = useState([])

  // Search & Add Guests
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [memberMobiles, setMemberMobiles] = useState({})
  const [savingGuest, setSavingGuest] = useState(false)

  // Manual family modal/form
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualSurname, setManualSurname] = useState('')
  const [manualHofIts, setManualHofIts] = useState('')
  const [manualMembers, setManualMembers] = useState([emptyManualMember()])
  const [manualError, setManualError] = useState('')

  // Invitation Wizard Modal
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [fam, inv, evts] = await Promise.all([
        getFamiliesWithInviteesForUser(user.id),
        getInvitationsByUser(user.id),
        getEvents()
      ])
      setMyFamilies(fam)
      setInvitations(inv)
      setEvents(evts)
    } catch (err) {
      console.error('Error loading TNC invites data:', err)
      showToast('Error loading TNC invite data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id]) // eslint-disable-line

  // Search families
  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearched(false)
    try {
      const result = await searchFamiliesByName(searchQuery.trim())
      setSearchResults(result)
      setSelectedFamily(null)
    } catch (err) {
      showToast('Error searching: ' + err.message, 'error')
    } finally {
      setSearching(false)
      setSearched(true)
    }
  }

  const handleSelectFamily = (fam) => {
    setSelectedFamily(fam)
    const already = myFamilies.find((f) => f.family_id === fam.id)
    const preselected = new Set((already?.members || []).map((m) => m.member_id))
    setSelectedIds(preselected)

    const mobiles = {}
    fam.members.forEach((m) => {
      const alreadyInvited = already?.members?.find((am) => am.member_id === m.id)
      mobiles[m.id] = alreadyInvited?.mobile || m.mobile || ''
    })
    setMemberMobiles(mobiles)
  }

  const toggleMember = (memberId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const handleSaveSelected = async () => {
    if (!selectedFamily) return
    const selectedMembers = selectedFamily.members
      .filter((m) => selectedIds.has(m.id))
      .map((m) => ({ ...m, mobile: memberMobiles[m.id] || '' }))

    if (selectedMembers.length > 0 && !selectedMembers.some((m) => m.mobile.trim())) {
      showToast('Please provide a mobile number for at least one member.', 'error')
      return
    }

    for (const m of selectedMembers) {
      if (m.mobile && m.mobile.trim()) {
        const cleanMobile = m.mobile.trim().replace(/\D/g, '')
        if (cleanMobile.length !== 10) {
          showToast('Please enter 10 digit mobile no.', 'error')
          return
        }
      }
    }

    setSavingGuest(true)
    try {
      await saveInvitees(user.id, selectedFamily, selectedMembers)
      showToast(`${selectedMembers.length} guest(s) saved for ${selectedFamily.surname} family.`)
      await loadData()
      setSelectedFamily(null)
      setSearchResults([])
      setSearchQuery('')
      setSearched(false)
    } catch (err) {
      showToast(err.message || 'Error saving invitees', 'error')
    } finally {
      setSavingGuest(false)
    }
  }

  const handleRemoveGuest = async (inviteeId) => {
    try {
      await removeInvitee(user.id, inviteeId)
      showToast('Guest removed.', 'info')
      loadData()
    } catch (err) {
      showToast(err.message || 'Error removing guest', 'error')
    }
  }

  // Manual family addition
  const handleManualSave = async () => {
    setManualError('')
    if (!manualHofIts.trim() || !manualSurname.trim()) {
      setManualError('HOF ITS and Family/Surname are required.')
      return
    }
    const cleanHofIts = manualHofIts.trim().replace(/\D/g, '')
    if (cleanHofIts.length !== 8) {
      setManualError('Please enter 8 digit its no.')
      return
    }
    const missingName = manualMembers.some((m) => !m.full_name.trim())
    if (missingName) {
      setManualError('Every member needs a full name.')
      return
    }
    const missingIts = manualMembers.some((m) => !(m.member_its || '').trim())
    if (missingIts) {
      setManualError('Please enter 8 digit its no.')
      return
    }
    for (const m of manualMembers) {
      const cleanMemberIts = (m.member_its || '').trim().replace(/\D/g, '')
      if (cleanMemberIts.length !== 8) {
        setManualError('Please enter 8 digit its no.')
        return
      }
    }
    const hasMobile = manualMembers.some((m) => m.mobile && m.mobile.trim())
    if (!hasMobile) {
      setManualError('Please enter 10 digit mobile no.')
      return
    }
    for (const m of manualMembers) {
      if (m.mobile && m.mobile.trim()) {
        const cleanMob = m.mobile.trim().replace(/\D/g, '')
        if (cleanMob.length !== 10) {
          setManualError('Please enter 10 digit mobile no.')
          return
        }
      }
    }

    const memberItsList = manualMembers.map((m) => (m.member_its || '').trim()).filter(Boolean)
    const seenIts = new Set()
    for (const its of memberItsList) {
      if (seenIts.has(its)) {
        setManualError(`Member ITS "${its}" is entered more than once in this form.`)
        return
      }
      seenIts.add(its)
    }

    setSavingGuest(true)
    try {
      // Check if any member ITS already exists in the database
      const existingMembers = await checkExistingMembersByIts(memberItsList)
      if (existingMembers && existingMembers.length > 0) {
        const dup = existingMembers[0]
        const famName = dup.families?.surname ? ` (${dup.families.surname} family)` : ''
        setManualError(`Member with ITS "${dup.member_its}" already exists in the database${famName}! Please search for the family using the search bar above instead.`)
        setSavingGuest(false)
        return
      }

      const newFamily = await createManualFamily({
        hof_its: manualHofIts.trim(),
        surname: manualSurname.trim(),
        members: manualMembers.map(({ key, ...m }) => m)
      })
      await saveInvitees(user.id, newFamily, newFamily.members)
      showToast(`Added ${newFamily.members.length} guest(s) for ${newFamily.surname} family.`)
      await loadData()
      setShowManualForm(false)
      setManualSurname('')
      setManualHofIts('')
      setManualMembers([emptyManualMember()])
    } catch (err) {
      if (err.message?.includes('families_hof_its_key')) {
        setManualError(`A family with HOF ITS "${manualHofIts}" already exists! Please search for it using the search bar above instead of creating it manually.`)
      } else {
        setManualError(err.message || 'Error creating family')
      }
    } finally {
      setSavingGuest(false)
    }
  }

  // WhatsApp Sending
  const handleOpenWhatsapp = async (invitation) => {
    if (!invitation.recipient_mobile) {
      showToast('This family has no mobile number recorded!', 'error')
      return
    }
    if (window.Android && window.Android.shareToWhatsApp) {
      window.Android.shareToWhatsApp(invitation.recipient_mobile, invitation.generated_message)
    } else {
      const link = buildWhatsappLink(invitation.recipient_mobile, invitation.generated_message)
      window.open(link, '_blank', 'noopener,noreferrer')
    }

    if (invitation.status === 'Ready') {
      await updateInvitationStatus(invitation.id, 'WhatsApp Opened')
      loadData()
    }
  }

  const handleMarkSent = async (invitation) => {
    await updateInvitationStatus(invitation.id, 'Sent')
    showToast(`Marked invitation for ${invitation.surname} as sent.`)
    loadData()
  }

  const totalInvitedPeople = myFamilies.reduce((sum, f) => sum + (f.members?.length || 0), 0)

  return (
    <DashboardLayout navItems={TNC_NAV} activePath="/tnc/invitations" roleLabel="TNC">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-emerald-deep">TNC Invitations & Guests</h1>
          <p className="text-sm text-ink/60 mt-0.5">
            Manage and send official invitations directly from the TNC Committee.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'invitations' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('invitations')}
          >
            Invitations ({invitations.length})
          </Button>
          <Button
            variant={activeTab === 'guests' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('guests')}
          >
            Guest Roster ({totalInvitedPeople})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink/50 py-10">
          <Spinner className="h-4 w-4" /> Loading TNC invite panel…
        </div>
      ) : activeTab === 'invitations' ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-xl font-semibold text-emerald-deep">
              TNC Invitations Sent & Pending
            </h2>
            <Button onClick={() => setWizardOpen(true)}>+ New Invitation</Button>
          </div>

          {invitations.length === 0 ? (
            <Card className="p-8">
              <EmptyState
                icon="✉"
                title="No TNC Invitations created yet"
                description="Click '+ New Invitation' to select a family and send their wedding invitation on WhatsApp."
                action={<Button onClick={() => setWizardOpen(true)}>+ New Invitation</Button>}
              />
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink/45 bg-ivory-soft border-b border-ivory-line">
                      <th className="py-3 px-4 font-semibold">Family</th>
                      <th className="py-3 px-4 font-semibold">Guests</th>
                      <th className="py-3 px-4 font-semibold">Events</th>
                      <th className="py-3 px-4 font-semibold">Recipient</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-b border-ivory-line last:border-0 hover:bg-ivory-soft/30 transition-colors">
                        <td className="py-3 px-4 font-semibold text-ink">{inv.surname}</td>
                        <td className="py-3 px-4">{inv.invitee_ids.length}</td>
                        <td className="py-3 px-4 text-ink/75">{inv.event_names}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-ink">{inv.recipient_name}</span>
                          <span className="text-xs text-ink/50 block font-mono">{inv.recipient_mobile || 'No mobile'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge tone={inv.status}>{inv.status}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <Button
                            variant="whatsapp"
                            size="sm"
                            onClick={() => handleOpenWhatsapp(inv)}
                          >
                            {inv.status === 'Sent' ? 'Reopen WhatsApp' : 'Send WhatsApp'}
                          </Button>
                          {inv.status !== 'Sent' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkSent(inv)}
                            >
                              Mark Sent
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* Guest List Tab */
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-emerald-deep mb-2">
              Add Guests to TNC Roster
            </h2>
            <p className="text-sm text-ink/60 mb-4">
              Search by surname or full name from Jamaat master data to select guests, or create a guest manually.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search surname, name, or ITS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={searching}>Search</Button>
              <Button variant="outline" type="button" onClick={() => setShowManualForm(true)}>
                + Manual Entry
              </Button>
            </form>

            {searched && (
              <div className="mt-4 border-t border-ivory-line pt-4">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-ink/50 italic">No matching families found.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {searchResults.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectFamily(f)}
                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                          selectedFamily?.id === f.id
                            ? 'border-emerald-deep bg-emerald/5 shadow-sm'
                            : 'border-ivory-line bg-white hover:border-emerald-deep/40'
                        }`}
                      >
                        <p className="font-semibold text-emerald-deep">{f.surname}</p>
                        <p className="text-xs text-ink/60 font-mono">HOF ITS: {f.hof_its}</p>
                        <p className="text-xs text-ink/50 mt-1">{f.members?.length || 0} family members</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedFamily && (
              <div className="mt-6 border-t border-ivory-line pt-4 bg-ivory-soft/30 p-4 rounded-xl border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-emerald-deep text-lg">
                    Select Members from {selectedFamily.surname} Family
                  </h3>
                  <Button size="sm" onClick={handleSaveSelected} loading={savingGuest}>
                    Save Selected Guests ({selectedIds.size})
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedFamily.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-ivory-line gap-2"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={selectedIds.has(m.id)}
                          onChange={() => toggleMember(m.id)}
                        />
                        <div>
                          <span className="font-medium text-ink">{m.full_name}</span>
                          <span className="text-xs text-ink/50 block">ITS: {m.member_its || m.id}</span>
                        </div>
                      </label>

                      <div className="w-full sm:w-48">
                        <Input
                          placeholder="10-digit mobile"
                          value={memberMobiles[m.id] || ''}
                          maxLength={10}
                          inputMode="numeric"
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setMemberMobiles({ ...memberMobiles, [m.id]: val })
                          }}
                          className="text-xs py-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Roster of Already Added TNC Guests */}
          <Card className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-emerald-deep mb-4">
              Current TNC Guest Roster ({myFamilies.length} Families · {totalInvitedPeople} People)
            </h2>

            {myFamilies.length === 0 ? (
              <p className="text-sm text-ink/50 italic">No guests added to TNC roster yet.</p>
            ) : (
              <div className="divide-y divide-ivory-line">
                {myFamilies.map((fam) => (
                  <div key={fam.family_id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-semibold text-emerald-deep text-base">{fam.surname} Family</h4>
                        <p className="text-xs text-ink/40 font-mono">HOF ITS: {fam.hof_its}</p>
                      </div>
                      <Badge tone="neutral">{fam.members.length} members</Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {fam.members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between p-2.5 bg-ivory-soft/40 border border-ivory-line rounded-lg text-xs"
                        >
                          <div>
                            <p className="font-medium text-ink">{m.full_name}</p>
                            <p className="text-ink/50 font-mono">{m.mobile || 'No Mobile'}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveGuest(m.id)}
                            className="text-wine hover:text-wine/80 px-1 py-0.5"
                            title="Remove guest"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Manual Entry Modal */}
      <Modal
        open={showManualForm}
        onClose={() => setShowManualForm(false)}
        title="Create Manual Family for TNC"
        size="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setShowManualForm(false)}>Cancel</Button>
            <Button onClick={handleManualSave} loading={savingGuest}>Save Family & Guests</Button>
          </div>
        }
      >
        <div className="space-y-4">
          {manualError && (
            <p className="text-xs text-wine bg-wine/10 p-2.5 rounded-lg border border-wine/20">
              {manualError}
            </p>
          )}
          <Field label="Family / Surname *">
            <Input
              value={manualSurname}
              onChange={(e) => setManualSurname(e.target.value)}
              placeholder="e.g. Ezzi, Raipuriawala"
            />
          </Field>
          <Field label="Head of Family (HOF) ITS (8 digits) *">
            <Input
              value={manualHofIts}
              maxLength={8}
              inputMode="numeric"
              onChange={(e) => setManualHofIts(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="e.g. 50401234"
            />
          </Field>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink/60">
                Family Members
              </label>
              <button
                type="button"
                onClick={() => setManualMembers([...manualMembers, emptyManualMember()])}
                className="text-xs text-emerald-deep font-semibold hover:underline"
              >
                + Add Member
              </button>
            </div>

            <div className="space-y-2">
              {manualMembers.map((m, idx) => (
                <div key={m.key} className="p-2.5 border border-ivory-line rounded-lg space-y-2 bg-ivory-soft/20">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Full Name *"
                      value={m.full_name}
                      onChange={(e) => {
                        const copy = [...manualMembers]
                        copy[idx].full_name = e.target.value
                        setManualMembers(copy)
                      }}
                      className="flex-1 text-xs"
                    />
                    <Input
                      placeholder="ITS (8 digits) *"
                      value={m.member_its}
                      maxLength={8}
                      inputMode="numeric"
                      onChange={(e) => {
                        const copy = [...manualMembers]
                        copy[idx].member_its = e.target.value.replace(/\D/g, '').slice(0, 8)
                        setManualMembers(copy)
                      }}
                      className="w-32 text-xs font-mono"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="Mobile (10 digits)"
                      value={m.mobile}
                      maxLength={10}
                      inputMode="numeric"
                      onChange={(e) => {
                        const copy = [...manualMembers]
                        copy[idx].mobile = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setManualMembers(copy)
                      }}
                      className="flex-1 text-xs"
                    />
                    <select
                      value={m.gender}
                      onChange={(e) => {
                        const copy = [...manualMembers]
                        copy[idx].gender = e.target.value
                        setManualMembers(copy)
                      }}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {manualMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setManualMembers(manualMembers.filter((_, i) => i !== idx))}
                        className="text-wine text-xs px-2"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Invitation Creation Wizard */}
      {wizardOpen && (
        <TNCInvitationWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onCreated={loadData}
          families={myFamilies}
          events={events}
          invitations={invitations}
          userId={user.id}
          userName={user.display_name || 'TNC Committee'}
        />
      )}
    </DashboardLayout>
  )
}

function TNCInvitationWizard({ open, onClose, onCreated, families, events, invitations, userId, userName }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(0) // 0: Select Family, 1: Configure Events, 2: Preview & Send
  const [search, setSearch] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [representativeId, setRepresentativeId] = useState('')
  const [selectedMemberEvents, setSelectedMemberEvents] = useState(new Set())
  const [message, setMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const filteredFamilies = families.filter((f) =>
    (f.surname || '').toLowerCase().includes(search.toLowerCase())
  )
  const family = families.find((f) => f.family_id === familyId)

  // Auto-select first member when family is chosen
  useEffect(() => {
    if (family && family.members.length > 0) {
      const withMobile = family.members.find((m) => m.mobile?.trim())
      setRepresentativeId(withMobile ? withMobile.member_id : family.members[0].member_id)

      // Pre-select all members for all events by default
      const initialPairs = new Set()
      family.members.forEach((m) => {
        events.forEach((e) => {
          initialPairs.add(`${m.member_id}_${e.id}`)
        })
      })
      setSelectedMemberEvents(initialPairs)
    }
  }, [familyId]) // eslint-disable-line

  const representative = family?.members.find((m) => m.member_id === representativeId)

  const togglePair = (memberId, eventId) => {
    const key = `${memberId}_${eventId}`
    setSelectedMemberEvents((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleNextToPreview = () => {
    if (!representative) {
      showToast('Please pick a representative recipient.', 'error')
      return
    }
    if (selectedMemberEvents.size === 0) {
      showToast('Please select at least one guest for an event.', 'error')
      return
    }

    const activeMemberIds = new Set(Array.from(selectedMemberEvents).map((s) => s.split('_')[0]))
    const activeMembers = family.members.filter((m) => activeMemberIds.has(m.member_id))
    const activeEventIds = new Set(Array.from(selectedMemberEvents).map((s) => s.split('_')[1]))
    const activeEvents = events.filter((e) => activeEventIds.has(e.id))

    const parsedMemberEvents = Array.from(selectedMemberEvents).map((str) => ({
      member_id: str.split('_')[0],
      event_id: str.split('_')[1]
    }))

    const msg = generateMessage({
      recipientName: representative.full_name,
      activeMembers,
      events: activeEvents,
      memberEvents: parsedMemberEvents,
      brideName: 'Majmui Shaadi',
      groomName: 'Majmui Shaadi',
      senderName: userName
    })
    setMessage(msg)
    setStep(2)
  }

  const handleCreateInvitation = async () => {
    setCreating(true)
    try {
      const parsedMemberEvents = Array.from(selectedMemberEvents).map((str) => ({
        member_id: str.split('_')[0],
        event_id: str.split('_')[1]
      }))

      const record = await createInvitation(userId, {
        family_id: family.family_id,
        surname: family.surname,
        hof_its: family.hof_its,
        recipient: representative,
        member_events: parsedMemberEvents,
        message
      })

      const confirmUrl = `${window.location.origin}/confirm/${record.id}`
      const finalMessage = message.replace('[CONFIRMATION_LINK_PLACEHOLDER]', confirmUrl)
      await updateInvitationMessage(record.id, finalMessage)

      // Open WhatsApp
      if (record.recipient_mobile) {
        if (window.Android && window.Android.shareToWhatsApp) {
          window.Android.shareToWhatsApp(record.recipient_mobile, finalMessage)
        } else {
          const link = buildWhatsappLink(record.recipient_mobile, finalMessage)
          window.open(link, '_blank', 'noopener,noreferrer')
        }
        await updateInvitationStatus(record.id, 'WhatsApp Opened')
      }

      showToast(`Invitation created for ${family.surname} family.`)
      onCreated()
      onClose()
    } catch (err) {
      showToast('Error creating invitation: ' + err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create TNC Invitation"
      size="lg"
      footer={
        <div className="flex justify-between w-full">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : <span />}

          {step === 0 && (
            <Button
              disabled={!familyId}
              onClick={() => setStep(1)}
            >
              Continue
            </Button>
          )}
          {step === 1 && (
            <Button onClick={handleNextToPreview}>
              Preview Invitation
            </Button>
          )}
          {step === 2 && (
            <Button onClick={handleCreateInvitation} loading={creating}>
              Send on WhatsApp
            </Button>
          )}
        </div>
      }
    >
      {step === 0 && (
        <div className="space-y-4">
          <Field label="Select Family from TNC Roster">
            <Input
              placeholder="Filter by surname..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>

          {filteredFamilies.length === 0 ? (
            <p className="text-sm text-ink/50 italic py-4">
              No families match. Add them first in the "Guest Roster" tab.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredFamilies.map((f) => {
                const hasInv = invitations.some((i) => i.family_id === f.family_id)
                return (
                  <div
                    key={f.family_id}
                    onClick={() => !hasInv && setFamilyId(f.family_id)}
                    className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${
                      hasInv
                        ? 'opacity-50 cursor-not-allowed bg-ivory-soft'
                        : familyId === f.family_id
                        ? 'border-emerald-deep bg-emerald/10'
                        : 'border-ivory-line hover:border-emerald-deep/40'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-emerald-deep">{f.surname}</p>
                      <p className="text-xs text-ink/50">{f.members.length} member(s)</p>
                    </div>
                    {hasInv && <Badge tone="default">Already Invited</Badge>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {step === 1 && family && (
        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/60 block mb-2">
              Select WhatsApp Recipient *
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {family.members.map((m) => (
                <div
                  key={m.member_id}
                  onClick={() => setRepresentativeId(m.member_id)}
                  className={`p-3 rounded-lg border cursor-pointer text-xs ${
                    representativeId === m.member_id
                      ? 'border-emerald-deep bg-emerald/10 font-semibold'
                      : 'border-ivory-line bg-white'
                  }`}
                >
                  <p className="text-ink">{m.full_name}</p>
                  <p className="text-ink/50 font-mono">{m.mobile || 'No Mobile'}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink/60 block mb-2">
              Select Events per Member
            </label>
            <div className="overflow-x-auto border border-ivory-line rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-ivory-soft text-left border-b border-ivory-line">
                    <th className="p-2 font-semibold">Guest Name</th>
                    {events.map((e) => (
                      <th key={e.id} className="p-2 text-center font-semibold">
                        {e.event_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-line">
                  {family.members.map((m) => (
                    <tr key={m.member_id}>
                      <td className="p-2 font-medium">{m.full_name}</td>
                      {events.map((e) => {
                        const checked = selectedMemberEvents.has(`${m.member_id}_${e.id}`)
                        return (
                          <td key={e.id} className="p-2 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePair(m.member_id, e.id)}
                              className="rounded text-emerald-deep focus:ring-emerald-deep"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-ink/60">
            Preview the message before sending on WhatsApp. You can edit the text below if needed.
          </p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
            className="w-full font-mono text-xs border border-ivory-line rounded-lg p-3 bg-white focus:outline-none focus:border-emerald-deep leading-relaxed"
          />
        </div>
      )}
    </Modal>
  )
}
