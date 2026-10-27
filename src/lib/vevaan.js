/**
 * Helper to determine if an event name is a "Vevaan" event for a specific user role.
 * - Groom side: Paan Gulab is Vevaan
 * - Bride side: Walima is Vevaan
 */
export function isVevaanEvent(role, eventName) {
  if (!role || !eventName) return false
  const r = role.toLowerCase().trim()
  const name = eventName.toLowerCase()

  if (r === 'groom') {
    // Paan Gulab or variations
    return name.includes('paan') || name.includes('gulab')
  }

  if (r === 'bride') {
    // Walima or variations
    return name.includes('walima') || name.includes('valima')
  }

  return false
}

export function hasVevaanEvent(role, eventNames = '') {
  if (!role || !eventNames) return false
  const r = role.toLowerCase().trim()
  const str = (typeof eventNames === 'string' ? eventNames : JSON.stringify(eventNames)).toLowerCase()

  if (r === 'groom') {
    return str.includes('paan') || str.includes('gulab')
  }
  if (r === 'bride') {
    return str.includes('walima') || str.includes('valima')
  }
  return false
}
