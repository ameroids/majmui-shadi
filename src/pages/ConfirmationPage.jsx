import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicInvitationDetails, submitRsvp } from '../lib/db'
import Button from '../components/ui/Button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'

export default function ConfirmationPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const [invitation, setInvitation] = useState(null)
  const [invitees, setInvitees] = useState([])
  
  // State to track responses: { [junction_id]: 'Attending' | 'Not Attending' }
  const [responses, setResponses] = useState({})
  const [lockedResponses, setLockedResponses] = useState({})

  useEffect(() => {
    async function loadData() {
      try {
        const { invitation: invData, invitees: inviteesData, error: dbErr } = await getPublicInvitationDetails(id)
        
        if (dbErr) {
          setError(dbErr)
        } else {
          setInvitation(invData)
          setInvitees(inviteesData)
          
          // Initialize responses state based on current rsvp_status of their events
          const initialResponses = {}
          const initialLocked = {}
          
          inviteesData.forEach(inv => {
            if (!inv.events || inv.events.length === 0) return
            
            inv.events.forEach(ev => {
              initialResponses[ev.junction_id] = ev.rsvp_status
              if (ev.rsvp_status === 'Attending' || ev.rsvp_status === 'Not Attending' || ev.rsvp_status === 'Declined' || ev.rsvp_status === 'Confirmed') {
                initialLocked[ev.junction_id] = true
              }
            })
          })
          
          setResponses(initialResponses)
          setLockedResponses(initialLocked)
        }
      } catch (err) {
        setError('Failed to load confirmation request.')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      loadData()
    }
  }, [id])

  const [formError, setFormError] = useState(null)

  const handleStatusChange = (junctionId, status) => {
    setFormError(null)
    setResponses(prev => ({
      ...prev,
      [junctionId]: status
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const missingInvitees = []
    invitees.forEach(inv => {
      const hasMissingEvent = inv.events?.some(ev => !lockedResponses[ev.junction_id] && (responses[ev.junction_id] === 'Pending' || !responses[ev.junction_id] || responses[ev.junction_id] === 'Sent'))
      if (hasMissingEvent) {
        missingInvitees.push(inv.full_name)
      }
    })

    if (missingInvitees.length > 0) {
      const names = missingInvitees.join(', ')
      setFormError(`Please select 'Plan to Attend' or 'Cannot Attend' for all events of ${names} before submitting.`)
      return
    }

    setSubmitting(true)
    setFormError(null)
    
    const rsvpData = Object.entries(responses)
      .filter(([junctionId]) => !lockedResponses[junctionId])
      .map(([junctionId, status]) => ({
        junctionId,
        status
      }))
      
    if (rsvpData.length === 0) {
      setSuccess(true)
      setSubmitting(false)
      return
    }
    
    const { error: submitErr } = await submitRsvp(id, rsvpData, true) // isConfirmation = true
    
    if (submitErr) {
      setFormError(submitErr)
      setSubmitting(false)
    } else {
      setSuccess(true)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-emerald">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-medium">Loading invitation details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-ivory-line">
          <AlertCircle className="h-12 w-12 text-wine mx-auto mb-4" />
          <h2 className="text-xl font-bold text-wine mb-2">Access Error</h2>
          <p className="text-ink/70">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-emerald/20">
          <CheckCircle2 className="h-16 w-16 text-emerald mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-emerald-deep mb-2">Thank You!</h2>
          <p className="text-ink/70">
            Your attendance confirmation has been successfully submitted. We look forward to celebrating with you!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-ivory-line overflow-hidden">
          <div className="bg-emerald-deep px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')] mix-blend-overlay"></div>
            <h1 className="text-3xl font-display font-bold text-gold relative z-10">Attendance Confirmation</h1>
            <p className="text-ivory/80 mt-2 text-lg relative z-10">
              The {invitation.surname} Family
            </p>
            {invitation.invited_by && (
              <p className="text-ivory/60 text-sm mt-4 relative z-10">
                Invited by: {invitation.invited_by}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <p className="text-ink/70 mb-8 text-center max-w-lg mx-auto">
              Please let us know if you and your family members will be able to attend the wedding events.
            </p>

            <div className="space-y-6">
              {invitees.map((invitee) => {
                return (
                  <div key={invitee.id} className="bg-ivory-soft rounded-xl p-5 border border-ivory-line transition-all hover:border-emerald/30">
                    <h3 className="font-semibold text-lg text-ink mb-4 border-b border-ivory-line pb-3">{invitee.full_name}</h3>
                    
                    <div className="space-y-4">
                      {invitee.events?.map(ev => {
                        const status = responses[ev.junction_id] || 'Pending'
                        const isLocked = lockedResponses[ev.junction_id]
                        
                        return (
                          <div key={ev.junction_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="font-medium text-ink/80">{ev.event_name}</span>
                              {isLocked && (
                                <div className="text-xs font-medium text-ink/50 mt-1">
                                  Already responded: {status === 'Attending' || status === 'Confirmed' ? 'Plan to Attend' : 'Cannot Attend'}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={isLocked || submitting}
                                onClick={() => handleStatusChange(ev.junction_id, 'Confirmed')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  status === 'Attending' || status === 'Confirmed'
                                    ? 'bg-emerald text-white shadow-md shadow-emerald/20 scale-105'
                                    : isLocked
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'bg-white text-ink/70 border border-ivory-line hover:border-emerald hover:text-emerald'
                                }`}
                              >
                                Plan to Attend
                              </button>
                              <button
                                type="button"
                                disabled={isLocked || submitting}
                                onClick={() => handleStatusChange(ev.junction_id, 'Declined')}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                  status === 'Declined' || status === 'Not Attending'
                                    ? 'bg-wine text-white shadow-md shadow-wine/20 scale-105'
                                    : isLocked
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                      : 'bg-white text-ink/70 border border-ivory-line hover:border-wine hover:text-wine'
                                }`}
                              >
                                Cannot Attend
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            {formError && (
              <div className="mt-8 p-4 bg-wine/10 border border-wine/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-wine shrink-0 mt-0.5" />
                <p className="text-wine text-sm font-medium">{formError}</p>
              </div>
            )}

            <div className="mt-10">
              <Button
                type="submit"
                size="lg"
                className="w-full text-lg h-14 shadow-xl shadow-emerald/20"
                disabled={submitting || Object.values(lockedResponses).length === invitees.reduce((acc, inv) => acc + (inv.events?.length || 0), 0)}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </span>
                ) : Object.values(lockedResponses).length > 0 && Object.values(lockedResponses).length === invitees.reduce((acc, inv) => acc + (inv.events?.length || 0), 0) ? (
                  'All Responses Submitted'
                ) : (
                  'Submit Confirmations'
                )}
              </Button>
            </div>
            
            <p className="text-center text-ink/40 text-xs mt-6">
              Powered by Majmui Shaadi
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
