// Default Majmui Shaadi invitation template. Admin/TNC can edit this
// (stored in localStorage) without touching code.

export const DEFAULT_TEMPLATE = `Dear {{recipient_name}},

You are warmly invited to the following wedding events:

{{events_with_members}}

We look forward to celebrating these special occasions with you.

With warm regards,
{{groom_name}} & {{bride_name}}
Majmui Shaadi`

const TEMPLATE_KEY = 'majmui_shaadi_template_v4'

export function getTemplate() {
  return localStorage.getItem(TEMPLATE_KEY) || DEFAULT_TEMPLATE
}

export function setTemplate(template) {
  localStorage.setItem(TEMPLATE_KEY, template)
}

export function generateMessage({ recipientName, activeMembers, events, memberEvents, brideName, groomName }) {
  const template = getTemplate()
  
  const memberMap = Object.fromEntries(activeMembers.map(m => [m.id, m.full_name]))
  
  const eventsBlock = events.map(e => {
    const attendees = memberEvents
      .filter(me => me.event_id === e.id)
      .map(me => memberMap[me.member_id])
      .filter(Boolean)
      
    if (attendees.length === 0) return null
    
    const eventHeader = `✨ *${e.event_name}*${e.event_date ? ` (${formatDate(e.event_date)}${e.event_time ? `, ${e.event_time}` : ''})` : ''}${e.venue ? ` @ ${e.venue}` : ''}`
    const membersList = attendees.map(name => `  • ${name}`).join('\n')
    return `${eventHeader}\n${membersList}`
  }).filter(Boolean).join('\n\n')

  return template
    .replaceAll('{{recipient_name}}', recipientName)
    .replaceAll('{{events_with_members}}', eventsBlock)
    .replaceAll('{{bride_name}}', brideName || 'the Bride')
    .replaceAll('{{groom_name}}', groomName || 'the Groom')
}

export function generateRsvpMessage(recipientName, rsvpUrl) {
  return `Dear ${recipientName},

The Majmui Shaadi is fast approaching! 

Please click the link below to confirm your family's attendance for the wedding events:
${rsvpUrl}

Jazakallah,
Majmui Shaadi Management`
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

export function buildWhatsappLink(mobile, message) {
  const digits = mobile.replace(/\D/g, '')
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}
