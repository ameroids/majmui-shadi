// Mapping of user ITS usernames to their Joda number (1 to 13)
// and helper to resolve pair/card paths and partner names

export const JODA_MAPPING = {
  // Joda 1
  '60434889': { joda: 1, jodaStr: '01', role: 'groom', partnerUsername: '30340762' },
  '30340762': { joda: 1, jodaStr: '01', role: 'bride', partnerUsername: '60434889' },

  // Joda 2
  '30348528': { joda: 2, jodaStr: '02', role: 'groom', partnerUsername: '30355483' },
  '30355483': { joda: 2, jodaStr: '02', role: 'bride', partnerUsername: '30348528' },

  // Joda 3
  '40419844': { joda: 3, jodaStr: '03', role: 'groom', partnerUsername: '30900229' },
  '30900229': { joda: 3, jodaStr: '03', role: 'bride', partnerUsername: '40419844' },

  // Joda 4
  '30341406': { joda: 4, jodaStr: '04', role: 'groom', partnerUsername: '30344555' },
  '30344555': { joda: 4, jodaStr: '04', role: 'bride', partnerUsername: '30341406' },

  // Joda 5
  '60461686': { joda: 5, jodaStr: '05', role: 'groom', partnerUsername: '604731720' },
  '604731720': { joda: 5, jodaStr: '05', role: 'bride', partnerUsername: '60461686' },

  // Joda 6
  '30347583': { joda: 6, jodaStr: '06', role: 'groom', partnerUsername: '30804830' },
  '30804830': { joda: 6, jodaStr: '06', role: 'bride', partnerUsername: '30347583' },

  // Joda 7
  '30421697': { joda: 7, jodaStr: '07', role: 'groom', partnerUsername: '30341524' },
  '30341524': { joda: 7, jodaStr: '07', role: 'bride', partnerUsername: '30421697' },

  // Joda 8
  '30343405': { joda: 8, jodaStr: '08', role: 'groom', partnerUsername: '40420527' },
  '40420527': { joda: 8, jodaStr: '08', role: 'bride', partnerUsername: '30343405' },

  // Joda 9
  '30346017': { joda: 9, jodaStr: '09', role: 'groom', partnerUsername: '60432680' },
  '60432680': { joda: 9, jodaStr: '09', role: 'bride', partnerUsername: '30346017' },

  // Joda 10 (fallback if 10Alaqmar / 10Zahabiyah are used)
  '10Alaqmar': { joda: 10, jodaStr: '10', role: 'groom', partnerUsername: '10Zahabiyah' },
  '10Zahabiyah': { joda: 10, jodaStr: '10', role: 'bride', partnerUsername: '10Alaqmar' },

  // Joda 11
  '30433157': { joda: 11, jodaStr: '11', role: 'groom', partnerUsername: '30900503' },
  '30900503': { joda: 11, jodaStr: '11', role: 'bride', partnerUsername: '30433157' },

  // Joda 12
  '30433152': { joda: 12, jodaStr: '12', role: 'groom', partnerUsername: '30340676' },
  '30340676': { joda: 12, jodaStr: '12', role: 'bride', partnerUsername: '30433152' },

  // Joda 13
  '30340188': { joda: 13, jodaStr: '13', role: 'groom', partnerUsername: '30349091' },
  '30349091': { joda: 13, jodaStr: '13', role: 'bride', partnerUsername: '30340188' },
}

export function getCardImagePath(invitation) {
  if (!invitation?.invited_by_username) return null
  const username = invitation.invited_by_username.trim()
  const mapping = JODA_MAPPING[username]

  const prefix = invitation.invited_by_role === 'bride' ? 'B' : 'G'
  
  if (mapping) {
    return `/cards/${prefix}${mapping.jodaStr}.jpg`
  }

  // Fallback for legacy numeric-prefixed usernames like "01Taha"
  const match = username.match(/^(\d+)/)
  if (match) {
    const padded = match[1].padStart(2, '0')
    return `/cards/${prefix}${padded}.jpg`
  }

  return null
}

