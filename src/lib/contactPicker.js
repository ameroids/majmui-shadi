/**
 * Utility to pick a contact number using the native Contact Picker API or Android bridge.
 * Formats to 10 digits clean.
 */
export async function pickContactNumber() {
  // 1. Android WebView bridge if implemented
  if (window.Android && typeof window.Android.pickContact === 'function') {
    try {
      const res = await window.Android.pickContact()
      if (res) {
        return cleanPhone(res)
      }
    } catch (e) {
      console.warn('Android.pickContact error:', e)
    }
  }

  // 2. Standard Web Contact Picker API (Chrome / Edge / Samsung Internet on Android)
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['tel']
      const opts = { multiple: false }
      const contacts = await navigator.contacts.select(props, opts)
      if (contacts && contacts.length > 0 && contacts[0].tel && contacts[0].tel.length > 0) {
        const raw = contacts[0].tel[0]
        return cleanPhone(raw)
      }
    } catch (e) {
      // User cancelled or permission denied
      if (e.name !== 'AbortError') {
        console.warn('Contact picker error:', e)
      }
    }
  }

  return null
}

export function isContactPickerSupported() {
  return (
    (typeof window !== 'undefined' && window.Android && typeof window.Android.pickContact === 'function') ||
    (typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window)
  )
}

function cleanPhone(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  // Return last 10 digits (removes country code 91 or leading 0)
  return digits.length > 10 ? digits.slice(-10) : digits
}

