import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { Spinner } from '../components/ui/Spinner'
import { getBridesAndGrooms, updateUserPermissions } from '../lib/db'
import { useToast } from '../context/ToastContext'

const ACCOUNTS_NAV = [
  { path: '/accounts', label: 'Amount Collection', icon: '💰' }
]

export default function AccountsDashboard() {
  const [loading, setLoading] = useState(true)
  const [bridesGrooms, setBridesGrooms] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  const load = async () => {
    const bg = await getBridesAndGrooms()
    // Parse installments if it's a string from DB (sometimes happens with JSONB), or use default
    bg.forEach(u => {
      if (typeof u.installments === 'string') {
        try { u.installments = JSON.parse(u.installments) } catch { u.installments = [] }
      }
      u.installments = u.installments || []
    })
    setBridesGrooms(bg)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const calculateCollected = (installments) => {
    return (installments || []).filter(i => i.paid).reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  }

  const openManager = (user) => {
    // Clone user data so we can edit it safely in the modal
    setSelectedUser({
      ...user,
      total_amount_due: user.total_amount_due || 0,
      installments: JSON.parse(JSON.stringify(user.installments || []))
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const collected = calculateCollected(selectedUser.installments)
      await updateUserPermissions(selectedUser.id, { 
        total_amount_due: Number(selectedUser.total_amount_due) || 0,
        amount_collected: collected,
        installments: selectedUser.installments
      })
      showToast('Account updated successfully!', 'success')
      setSelectedUser(null)
      await load()
    } catch (err) {
      showToast('Error saving account details', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // --- Modal Helper Functions ---
  const addInstallment = () => {
    setSelectedUser(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        { id: crypto.randomUUID(), amount: 0, deadline: '', paid: false, payment_date: '', method: '' }
      ]
    }))
  }

  const updateInstallment = (id, field, value) => {
    setSelectedUser(prev => ({
      ...prev,
      installments: prev.installments.map(i => i.id === id ? { ...i, [field]: value } : i)
    }))
  }

  const removeInstallment = (id) => {
    setSelectedUser(prev => ({
      ...prev,
      installments: prev.installments.filter(i => i.id !== id)
    }))
  }

  // --- Summary Stats ---
  const totalDue = bridesGrooms.reduce((sum, u) => sum + (u.total_amount_due || 0), 0)
  const totalCollected = bridesGrooms.reduce((sum, u) => sum + calculateCollected(u.installments), 0)
  const totalBalance = totalDue - totalCollected

  return (
    <DashboardLayout navItems={ACCOUNTS_NAV} activePath="/accounts" roleLabel="Accounts">
      <div className="flex flex-col sm:flex-row justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-semibold text-emerald-deep mb-2">Accounts</h1>
          <p className="text-base text-ink/70">Manage wedding packages, track installments, and record payments.</p>
        </div>
        {!loading && (
          <div className="mt-6 sm:mt-0 flex gap-4">
            <div className="bg-white px-5 py-4 rounded-xl border-2 border-emerald-deep/10 shadow-sm text-center flex flex-col justify-center min-w-[140px]">
              <div className="text-xs font-bold uppercase tracking-wider text-ink/50 mb-1.5">Total Collected</div>
              <div className="font-display text-2xl font-semibold text-emerald-deep leading-none">₹{totalCollected.toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-gold-light/20 px-5 py-4 rounded-xl border-2 border-gold/40 shadow-sm text-center flex flex-col justify-center min-w-[140px]">
              <div className="text-xs font-bold uppercase tracking-wider text-gold-deep mb-1.5">Pending Balance</div>
              <div className="font-display text-2xl font-semibold text-gold-deep leading-none">₹{totalBalance.toLocaleString('en-IN')}</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-base text-ink/50 py-12"><Spinner className="h-5 w-5" /> Loading accounts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {bridesGrooms.map(u => {
            const due = u.total_amount_due || 0
            const collected = calculateCollected(u.installments)
            const balance = due - collected
            const nextPending = (u.installments || []).filter(i => !i.paid).sort((a,b) => new Date(a.deadline) - new Date(b.deadline))[0]

            return (
              <Card key={u.id} className="p-6 border-2 hover:border-emerald-deep/20 transition-colors shadow-sm bg-white cursor-pointer" onClick={() => openManager(u)}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-emerald-deep">{u.display_name}</h3>
                    <span className="inline-block mt-1 bg-ivory-line/50 text-ink/60 text-xs px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                  </div>
                  <Button variant="secondary" size="sm">Manage</Button>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-ink/60">Total Package</span>
                    <span className="font-semibold text-ink">₹{due.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="w-full bg-ivory-line rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-emerald-deep h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: due > 0 ? `${Math.min(100, (collected / due) * 100)}%` : '0%' }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-deep font-semibold">Collected: ₹{collected.toLocaleString('en-IN')}</span>
                    <span className="text-gold-deep font-semibold">Pending: ₹{balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {nextPending && (
                  <div className="mt-5 bg-gold-light/20 border border-gold/30 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gold-deep uppercase tracking-wide mb-1">Next Installment Due</p>
                    <p className="text-sm font-medium text-ink">
                      ₹{Number(nextPending.amount).toLocaleString('en-IN')} by {nextPending.deadline ? new Date(nextPending.deadline).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'}) : 'No date set'}
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* --- Simple Modal --- */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-emerald-deep/40 backdrop-blur-sm">
          <Card className="w-full max-w-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-full">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-emerald-deep text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-display font-semibold">{selectedUser.display_name}</h2>
                <p className="text-emerald-deep/40 text-sm mt-0.5 opacity-80">Manage Payments & Installments</p>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-white/60 hover:text-white transition text-2xl p-2"
              >×</button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto bg-ivory/30">
              
              {/* Total Package Cost */}
              <div className="bg-white p-5 rounded-xl border border-ivory-line shadow-sm mb-6">
                <label className="block text-sm font-bold text-ink/70 mb-2 uppercase tracking-wide">Total Wedding Package Amount (₹)</label>
                <Input 
                  type="number" 
                  className="text-xl py-3 max-w-xs font-semibold"
                  value={selectedUser.total_amount_due}
                  onChange={(e) => setSelectedUser({...selectedUser, total_amount_due: e.target.value})}
                />
              </div>

              {/* Installments Section */}
              <div className="mb-4 flex justify-between items-end">
                <h3 className="text-lg font-display font-semibold text-emerald-deep">Payment Schedule (Installments)</h3>
                <Button variant="secondary" size="sm" onClick={addInstallment}>+ Add Installment</Button>
              </div>

              {selectedUser.installments.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-ivory-line">
                  <p className="text-ink/50 mb-3">No installments created yet.</p>
                  <Button variant="primary" onClick={addInstallment}>Create First Installment</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedUser.installments.map((inst, index) => (
                    <div key={inst.id} className={`bg-white p-5 rounded-xl border shadow-sm transition-all ${inst.paid ? 'border-emerald-deep/40 bg-emerald-soft/10' : 'border-ivory-line'}`}>
                      
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-ivory-line">
                        <h4 className="font-semibold text-ink">Installment #{index + 1}</h4>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none bg-ivory-soft px-3 py-1.5 rounded-lg border border-ivory-line hover:bg-ivory-line/50 transition">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-emerald-deep focus:ring-emerald-deep"
                              checked={inst.paid}
                              onChange={(e) => {
                                updateInstallment(inst.id, 'paid', e.target.checked)
                                if (e.target.checked && !inst.payment_date) {
                                  updateInstallment(inst.id, 'payment_date', new Date().toISOString().split('T')[0])
                                }
                              }}
                            />
                            <span className={`text-sm font-bold ${inst.paid ? 'text-emerald-deep' : 'text-ink/60'}`}>
                              {inst.paid ? 'Payment Received' : 'Mark as Paid'}
                            </span>
                          </label>
                          <button onClick={() => removeInstallment(inst.id)} className="text-red-500/70 hover:text-red-600 text-sm font-semibold p-2">Remove</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Amount to Pay (₹)</label>
                          <Input 
                            type="number"
                            value={inst.amount}
                            onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                            disabled={inst.paid}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-ink/60 mb-1.5">Deadline Date</label>
                          <Input 
                            type="date"
                            value={inst.deadline}
                            onChange={(e) => updateInstallment(inst.id, 'deadline', e.target.value)}
                            disabled={inst.paid}
                          />
                        </div>

                        {/* Additional fields if paid */}
                        {inst.paid && (
                          <>
                            <div>
                              <label className="block text-xs font-semibold text-emerald-deep mb-1.5">Date Received</label>
                              <Input 
                                type="date"
                                value={inst.payment_date}
                                onChange={(e) => updateInstallment(inst.id, 'payment_date', e.target.value)}
                                className="border-emerald-deep/30 bg-emerald-soft/20"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-emerald-deep mb-1.5">Payment Method</label>
                              <Select 
                                value={inst.method}
                                onChange={(e) => updateInstallment(inst.id, 'method', e.target.value)}
                                className="border-emerald-deep/30 bg-emerald-soft/20"
                              >
                                <option value="">Select method...</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cheque">Cheque</option>
                                <option value="UPI">UPI</option>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                      
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-ivory-line flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSelectedUser(null)}>Cancel</Button>
              <Button variant="primary" loading={isSaving} onClick={handleSave} className="px-8">Save Changes</Button>
            </div>
            
          </Card>
        </div>
      )}
      
    </DashboardLayout>
  )
}
