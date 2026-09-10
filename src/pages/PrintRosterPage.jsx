import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getUserInviteesWithEvents, getEvents } from '../lib/db'

export default function PrintRosterPage() {
  const { user } = useAuth()
  const [families, setFamilies] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [invs, evts] = await Promise.all([
          getUserInviteesWithEvents(user.id),
          getEvents()
        ])
        if (!alive) return
        
        // Group by family
        const familiesMap = new Map()
        invs.forEach(inv => {
          if (!familiesMap.has(inv.family_id)) {
            familiesMap.set(inv.family_id, {
              id: inv.family_id,
              surname: inv.surname,
              hof_its: inv.hof_its,
              members: []
            })
          }
          familiesMap.get(inv.family_id).members.push(inv)
        })
        
        setEvents(evts)
        setFamilies(Array.from(familiesMap.values()).sort((a, b) => a.surname.localeCompare(b.surname)))
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [user.id])

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        const element = document.getElementById('print-content')
        const opt = {
          margin: 10,
          filename: `Guest_Roster_${user.display_name.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        
        const script = document.createElement('script')
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        script.onload = () => {
          window.html2pdf().set(opt).from(element).save().then(() => {
            setTimeout(() => window.close(), 2000)
          })
        }
        document.head.appendChild(script)
      }, 500)
    }
  }, [loading, user.display_name])

  if (loading) {
    return <div className="p-10 text-center font-mono text-sm text-ink/50">Preparing roster for PDF download...</div>
  }

  const totalMembers = families.reduce((acc, f) => acc + f.members.length, 0)

  return (
    <div id="print-content" className="p-8 max-w-5xl mx-auto bg-white min-h-screen print:p-0 print:text-black">
      <div className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold uppercase tracking-widest">{user.display_name} - Guest Roster</h1>
        <div className="mt-2 text-sm font-mono flex justify-between">
          <span>Total Families: {families.length}</span>
          <span>Total Guests: {totalMembers}</span>
          <span>Printed on: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {families.map((fam, index) => (
        <div key={fam.id} className="mb-6 break-inside-avoid">
          <div className="bg-gray-100 font-bold px-3 py-1.5 flex justify-between items-center print:bg-gray-200">
            <span className="text-lg">{index + 1}. {fam.surname} Family</span>
          </div>
          <table className="w-full text-left text-sm mt-2 border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50 print:bg-gray-100">
                <th className="border border-gray-300 px-3 py-1 w-1/3">Name</th>
                <th className="border border-gray-300 px-3 py-1 w-1/4">Contact</th>
                <th className="border border-gray-300 px-3 py-1">Invited Events</th>
              </tr>
            </thead>
            <tbody>
              {fam.members.map(m => (
                <tr key={m.id}>
                  <td className="border border-gray-300 px-3 py-1.5">{m.full_name}</td>
                  <td className="border border-gray-300 px-3 py-1.5 font-mono text-xs">{m.mobile || '-'}</td>
                  <td className="border border-gray-300 px-3 py-1.5">
                    {m.invitation_member_events?.length > 0 
                      ? m.invitation_member_events.map(e => events.find(ev => ev.id === e.event_id)?.event_name).filter(Boolean).join(', ')
                      : <span className="italic text-gray-500">None yet</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {families.length === 0 && (
        <div className="text-center py-12 italic text-gray-500">No guests have been added to the roster yet.</div>
      )}
    </div>
  )
}
