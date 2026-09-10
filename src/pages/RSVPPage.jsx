import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicInvitationDetails, submitRsvp, getGlobalRsvpStatus } from '../lib/db'
import Button from '../components/ui/Button'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Logo from '../components/Logo'

export default function RSVPPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [globalRsvpOpen, setGlobalRsvpOpen] = useState(true)
  
  const [invitation, setInvitation] = useState(null)
  const [invitees, setInvitees] = useState([])
  
  // State to track responses: { [inviteeId]: 'Attending' | 'Not Attending' }
  const [responses, setResponses] = useState({})
  const [lockedResponses, setLockedResponses] = useState({})

  useEffect(() => {
    async function loadData() {
      try {
        const [{ invitation: invData, invitees: inviteesData, error: dbErr }, rsvpOpen] = await Promise.all([
          getPublicInvitationDetails(id),
          getGlobalRsvpStatus()
        ])
        
        setGlobalRsvpOpen(rsvpOpen)
        if (dbErr) {
          setError(dbErr)
        } else {
          setInvitation(invData)
          setInvitees(inviteesData)
          
          // Initialize responses state based on current rsvp_status
          const initialResponses = {}
          const initialLocked = {}
          inviteesData.forEach(inv => {
            inv.events.forEach(ev => {
              initialResponses[ev.junction_id] = ev.rsvp_status
              if (ev.rsvp_status === 'Attending' || ev.rsvp_status === 'Not Attending') {
                initialLocked[ev.junction_id] = true
              }
            })
          })
          setResponses(initialResponses)
          setLockedResponses(initialLocked)
        }
      } catch (err) {
        setError('Failed to load invitation.')
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
    
    const hasPending = Object.entries(responses).some(([jid, status]) => !lockedResponses[jid] && status === 'Pending')
    if (hasPending) {
      setFormError("Please select 'Attending' or 'Not Attending' for all events before submitting.")
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
    
    const { success, error: submitErr } = await submitRsvp(id, rsvpData)
    
    if (success) {
      setSuccess(true)
    } else {
      setFormError(submitErr || 'Failed to submit RSVP. Please try again.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-deep" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-red-100">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            !
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-green-100">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Received</h2>
          <p className="text-gray-600 mb-6">
            Jazakallah! Your response has been recorded.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-emerald-soft/30 p-8 text-center border-b border-ivory-line">
          <div className="flex justify-center mb-6">
            <Logo className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-display text-emerald-deep mb-2">You're Invited!</h1>
          {invitation?.invited_by && (
            <p className="text-ink/70 text-lg">
              Invited by <span className="font-medium text-ink">{invitation.invited_by}</span>
            </p>
          )}
          {invitation?.surname && (
            <div className="mt-4 text-sm text-gray-500 uppercase tracking-widest font-semibold">
              {invitation.surname} Family
            </div>
          )}
        </div>

        {/* Form Section */}
        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Please confirm your attendance</h2>
            <p className="text-gray-500 text-sm">Select who will be attending from your family.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {invitees.map(invitee => (
                <div key={invitee.id} className="p-4 rounded-lg border border-gray-100 bg-gray-50 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg border-b pb-2">{invitee.full_name}</h3>
                  <div className="space-y-3">
                    {invitee.events.map(ev => (
                      <div key={ev.junction_id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-gray-700 font-medium">{ev.event_name}</span>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {!globalRsvpOpen || lockedResponses[ev.junction_id] ? (
                          <span className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-1.5 ${
                            responses[ev.junction_id] === 'Attending' 
                              ? 'bg-emerald/10 text-emerald-deep' 
                              : responses[ev.junction_id] === 'Not Attending'
                                ? 'bg-wine/10 text-wine'
                                : 'bg-ivory-soft text-ink/60'
                          }`}>
                            {lockedResponses[ev.junction_id] && <CheckCircle2 className="w-4 h-4" />}
                            {lockedResponses[ev.junction_id] ? `Already Responded: ${responses[ev.junction_id]}` : responses[ev.junction_id]}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(ev.junction_id, 'Attending')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                                responses[ev.junction_id] === 'Attending' 
                                  ? 'bg-emerald text-white shadow-sm' 
                                  : 'text-ink/60 hover:text-ink hover:bg-ivory-soft/50'
                              }`}
                            >
                              Attending
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(ev.junction_id, 'Not Attending')}
                              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none ${
                                responses[ev.junction_id] === 'Not Attending' 
                                  ? 'bg-wine text-white shadow-sm' 
                                  : 'text-ink/60 hover:text-ink hover:bg-ivory-soft/50'
                              }`}
                            >
                              Not Attending
                            </button>
                          </>
                        )}
                      </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-6 border-t border-gray-100">
              {!globalRsvpOpen ? (
                <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-center">
                  <p className="text-rose-700 font-medium">RSVPs are now closed.</p>
                  <p className="text-sm text-rose-600/80 mt-1">Thank you for your overwhelming response.</p>
                </div>
              ) : Object.keys(responses).length > 0 && Object.keys(responses).every(jid => lockedResponses[jid]) ? (
                <div className="mb-4 p-4 rounded-xl bg-emerald-soft/30 border border-emerald-soft text-center">
                  <p className="text-emerald-deep font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    All responses submitted successfully
                  </p>
                  <p className="text-sm text-ink/60 mt-1">You have already responded for all invited members.</p>
                </div>
              ) : (
                <>
                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {formError}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full text-lg py-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit RSVP'
                    )}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
        
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>Majmui Shaadi Management System</p>
      </div>
    </div>
  )
}
