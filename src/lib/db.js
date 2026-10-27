import { supabase } from './supabaseClient'

// --------------------------- Auth -----------------------------------------

export async function authenticate(username, password, expectedRoles) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username.trim())
      .eq('password_hash', password)
      .maybeSingle()

    if (error) {
      return { user: null, error: `DB Error: ${error.message || JSON.stringify(error)}` }
    }
    if (!user) {
      return { user: null, error: 'Incorrect username or password.' }
    }

    if (expectedRoles && !expectedRoles.includes(user.role)) {
      return { user: null, error: 'This login panel does not match this account type.' }
    }
    
    const { password_hash: _pw, ...safeUser } = user
    
    // Fetch partner name for WhatsApp template if bride/groom
    if (safeUser.role === 'bride' || safeUser.role === 'groom') {
      const match = safeUser.username.match(/^(\d+)(.*)$/i)
      if (match) {
        const pairNumber = match[1]
        const partnerRole = safeUser.role === 'groom' ? 'bride' : 'groom'
        
        const { data: partner } = await supabase
          .from('users')
          .select('display_name')
          .eq('role', partnerRole)
          .like('username', `${pairNumber}%`)
          .maybeSingle()
          
        if (partner) {
          safeUser.partner_name = partner.display_name
        }
      }
    }
    
    return { user: safeUser, error: null }
  } catch (err) {
    return { user: null, error: `App Error: ${err.message}` }
  }
}

// --------------------------- Users (Admin) ----------------------------------

export async function updateUserPermissions(userId, updates) {
  const { error } = await supabase
    .from('users')
    .update(updates) // { can_add_invitees: bool, can_send_invitations: bool }
    .eq('id', userId)

  if (error) throw error
  return true
}

// --------------------------- Events -----------------------------------------

export async function getEvents() {
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('active', true)
  if (error) {
    console.error('Error fetching events:', error)
    return []
  }
  return events
}

// --------------------------- Families (master data, read-mostly) -----------

export async function searchFamiliesByName(nameQuery) {
  if (!nameQuery || !nameQuery.trim()) return []

  const trimmed = nameQuery.trim()
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  const familyIds = new Set()

  try {
    if (tokens.length === 1) {
      const searchStr = `%${tokens[0]}%`

      const [famRes, memRes] = await Promise.all([
        supabase
          .from('families')
          .select('id')
          .or(`surname.ilike.${searchStr},hof_its.ilike.${searchStr}`)
          .limit(30),
        supabase
          .from('family_members')
          .select('family_id')
          .or(`full_name.ilike.${searchStr},member_its.ilike.${searchStr}`)
          .limit(40),
      ])

      if (famRes.data) famRes.data.forEach((f) => familyIds.add(f.id))
      if (memRes.data) memRes.data.forEach((m) => familyIds.add(m.family_id))
    } else {
      // Multi-keyword search

      // 1. Check if any member's full_name contains ALL tokens (in any order)
      // We try .or(`and(...)`) and .ilikeAllOf to ensure compatibility across PostgREST versions
      const andFilter = tokens.map((t) => `full_name.ilike.%${t}%`).join(',')
      const patterns = tokens.map((t) => `%${t}%`)

      const [memAndRes, famAndRes] = await Promise.all([
        supabase
          .from('family_members')
          .select('family_id')
          .or(`and(${andFilter})`)
          .limit(30),
        supabase
          .from('families')
          .select('id')
          .or(`and(${tokens.map((t) => `surname.ilike.%${t}%`).join(',')})`)
          .limit(30),
      ])

      if (memAndRes.data && memAndRes.data.length > 0) {
        memAndRes.data.forEach((m) => familyIds.add(m.family_id))
      } else {
        // Fallback using ilikeAllOf
        const { data: memAllOf } = await supabase
          .from('family_members')
          .select('family_id')
          .ilikeAllOf('full_name', patterns)
          .limit(30)
        if (memAllOf) memAllOf.forEach((m) => familyIds.add(m.family_id))
      }

      if (famAndRes.data && famAndRes.data.length > 0) {
        famAndRes.data.forEach((f) => familyIds.add(f.id))
      }

      // 2. Cross-field search: one token matches the family (surname or hof_its),
      // and the other tokens match members of that family
      for (const t of tokens) {
        const otherTokens = tokens.filter((tok) => tok !== t)
        if (otherTokens.length === 0) continue

        const { data: famsWithToken } = await supabase
          .from('families')
          .select('id')
          .or(`surname.ilike.%${t}%,hof_its.ilike.%${t}%`)
          .limit(20)

        if (famsWithToken && famsWithToken.length > 0) {
          const famIds = famsWithToken.map((f) => f.id)

          let memQuery = supabase
            .from('family_members')
            .select('family_id')
            .in('family_id', famIds)
            .limit(20)

          if (otherTokens.length === 1) {
            memQuery = memQuery.or(`full_name.ilike.%${otherTokens[0]}%,member_its.ilike.%${otherTokens[0]}%`)
          } else {
            const otherAnd = otherTokens.map((ot) => `full_name.ilike.%${ot}%`).join(',')
            memQuery = memQuery.or(`and(${otherAnd})`)
          }

          const { data: crossMembers } = await memQuery
          if (crossMembers && crossMembers.length > 0) {
            crossMembers.forEach((m) => familyIds.add(m.family_id))
          }
        }
      }
    }

    if (familyIds.size === 0) return []

    const targetIds = Array.from(familyIds).slice(0, 30)

    // Fetch full families with their members
    const { data: families, error } = await supabase
      .from('families')
      .select('id, hof_its, surname, is_manual, family_members(*)')
      .in('id', targetIds)

    if (error || !families) {
      console.error('Error fetching family details:', error)
      return []
    }

    return families.map((f) => ({
      id: f.id,
      hof_its: f.hof_its,
      surname: f.surname,
      is_manual: f.is_manual,
      members: f.family_members || [],
    }))
  } catch (err) {
    console.error('searchFamiliesByName error:', err)
    return []
  }
}

export async function getFamilyWithMembersById(familyId) {
  if (!familyId) return null
  const { data, error } = await supabase
    .from('families')
    .select('id, hof_its, surname, is_manual, family_members(*)')
    .eq('id', familyId)
    .single()

  if (error || !data) {
    console.error('Error fetching family by id:', error)
    return null
  }

  return {
    id: data.id,
    hof_its: data.hof_its,
    surname: data.surname,
    is_manual: data.is_manual,
    members: data.family_members || []
  }
}


export async function checkExistingMembersByIts(itsList, excludeFamilyId = null) {
  if (!itsList || itsList.length === 0) return []
  const cleanList = itsList.map((its) => String(its || '').trim()).filter(Boolean)
  if (cleanList.length === 0) return []

  let query = supabase
    .from('family_members')
    .select('id, member_its, full_name, family_id, families(id, surname, hof_its)')
    .in('member_its', cleanList)

  if (excludeFamilyId) {
    query = query.neq('family_id', excludeFamilyId)
  }

  const { data, error } = await query
  if (error) {
    console.error('checkExistingMembersByIts error:', error)
    return []
  }
  return data || []
}

export async function createManualFamily({ hof_its, surname, members }) {
  const { data: family, error: famError } = await supabase
    .from('families')
    .insert([{ hof_its, surname, is_manual: true }])
    .select()
    .single()
    
  if (famError) throw famError
  
  const memberRows = members.map(m => ({
    family_id: family.id,
    member_its: m.member_its || crypto.randomUUID(),
    full_name: m.full_name,
    mobile: m.mobile || null,
    relationship: m.relationship || null,
    gender: m.gender || null
  }))
  
  const { data: insertedMembers, error: memError } = await supabase
    .from('family_members')
    .insert(memberRows)
    .select()
    
  if (memError) throw memError
  
  return {
    ...family,
    members: insertedMembers
  }
}

export async function updateManualFamily(familyId, { hof_its, surname, members }) {
  // Update family
  const { data: family, error: famError } = await supabase
    .from('families')
    .update({ hof_its, surname })
    .eq('id', familyId)
    .select()
    .single()
    
  if (famError) throw famError

  // Fetch existing members to figure out what to delete/update
  const { data: existingMembers } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', familyId)

  const existingIds = new Set(existingMembers.map(m => m.id))
  
  // Upsert members manually
  for (const m of members) {
    const memberData = {
      family_id: familyId,
      member_its: m.member_its || m.id || crypto.randomUUID(),
      full_name: m.full_name,
      mobile: m.mobile || null,
      relationship: m.relationship || null,
      gender: m.gender || null
    }
    
    // If the member came with an ID and it exists, update it
    if (m.id && existingIds.has(m.id)) {
      await supabase.from('family_members').update(memberData).eq('id', m.id)
      existingIds.delete(m.id)
    } else {
      // New member added during edit
      await supabase.from('family_members').insert([memberData])
    }
  }
  
  // Delete members that were removed during edit
  if (existingIds.size > 0) {
    await supabase.from('family_members').delete().in('id', Array.from(existingIds))
  }
  
  // Return updated family with its members
  return searchFamilyByHofIts(hof_its)
}

export async function getAllFamilies() {
  const { data: families, error } = await supabase
    .from('families')
    .select('*, family_members(id)')
  if (error) return []
  return families.map(f => ({
    ...f,
    members: f.family_members || []
  }))
}

// --------------------------- Invitees ---------------------------------------

export async function getInviteesByUser(userId) {
  const { data: invitees, error } = await supabase
    .from('invitees')
    .select('*')
    .eq('bride_groom_user_id', userId)
  
  if (error) return []
  return invitees
}

export async function getUserInviteesWithEvents(userId) {
  const { data: invitees, error } = await supabase
    .from('invitees')
    .select('*, invitation_member_events(event_id)')
    .eq('bride_groom_user_id', userId)
  
  if (error) return []
  return invitees
}

export async function saveInvitees(userId, family, selectedMembers) {
  // Find members of this family that were NOT selected and remove them from invitees
  const selectedMemberIds = new Set(selectedMembers.map(m => m.id))
  const unselectedMemberIds = (family.members || [])
    .filter(m => !selectedMemberIds.has(m.id))
    .map(m => m.id)

  if (unselectedMemberIds.length > 0) {
    await supabase
      .from('invitees')
      .delete()
      .eq('bride_groom_user_id', userId)
      .eq('family_id', family.id)
      .in('member_id', unselectedMemberIds)
  }

  if (selectedMembers.length === 0) {
    return getInviteesByUser(userId)
  }

  const inviteeRows = selectedMembers.map(member => ({
    bride_groom_user_id: userId,
    family_id: family.id,
    member_id: member.id,
    hof_its: family.hof_its,
    member_its: member.member_its || member.id,
    full_name: member.full_name,
    surname: family.surname,
    mobile: member.mobile || null,
    relationship: member.relationship || null,
    gender: member.gender || 'Unknown',
    selected: true,
    invitation_status: 'Not Invited'
  }))
  
  const { error } = await supabase
    .from('invitees')
    .upsert(inviteeRows, { onConflict: 'bride_groom_user_id, member_id' })

  if (error) throw error

  // Also update the global family_members table with the new mobile numbers if they exist
  for (const member of selectedMembers) {
    if (member.mobile && member.mobile.trim() !== '') {
      await supabase.from('family_members').update({ mobile: member.mobile.trim() }).eq('id', member.id)
    }
  }

  return getInviteesByUser(userId)
}

export async function removeInvitee(userId, inviteeId) {
  await supabase
    .from('invitees')
    .delete()
    .eq('id', inviteeId)
    .eq('bride_groom_user_id', userId)
}

export async function getFamiliesWithInviteesForUser(userId) {
  const invitees = await getInviteesByUser(userId)
  
  const byFamily = new Map()
  invitees.forEach((invitee) => {
    if (!byFamily.has(invitee.family_id)) {
      byFamily.set(invitee.family_id, {
        family_id: invitee.family_id,
        hof_its: invitee.hof_its,
        surname: invitee.surname,
        members: [],
      })
    }
    byFamily.get(invitee.family_id).members.push(invitee)
  })
  return Array.from(byFamily.values()).sort((a, b) => (a.surname || '').localeCompare(b.surname || ''))
}

// --------------------------- Invitations -------------------------------------

export async function createInvitation(userId, payload) {
  const { data: record, error } = await supabase
    .from('invitations')
    .insert([{
      bride_groom_user_id: userId,
      family_id: payload.family_id,
      whatsapp_recipient_member_id: payload.recipient.member_id,
      status: 'Ready',
      generated_message: payload.message,
    }])
    .select()
    .single()
    
  if (error) throw error
  
  const memberEventJunctions = payload.member_events.map(me => ({
    invitation_id: record.id,
    invitee_id: me.member_id,
    event_id: me.event_id
  }))
  await supabase.from('invitation_member_events').insert(memberEventJunctions)
  
  const inviteeIds = [...new Set(payload.member_events.map(me => me.member_id))]
  
  await supabase
    .from('invitees')
    .update({ invitation_status: 'Ready' })
    .in('id', inviteeIds)

  return {
    ...record,
    surname: payload.surname,
    hof_its: payload.hof_its,
    recipient_name: payload.recipient.full_name,
    recipient_mobile: payload.recipient.mobile,
  }
}

export async function updateInvitationStatus(invitationId, status) {
  const updateData = { status }
  if (status === 'Sent') updateData.sent_at = new Date().toISOString()
  
  const { data: invitation, error } = await supabase
    .from('invitations')
    .update(updateData)
    .eq('id', invitationId)
    .select()
    .single()
    
  if (error) throw error
  
  const { data: junctions } = await supabase
    .from('invitation_member_events')
    .select('invitee_id')
    .eq('invitation_id', invitationId)
    
  if (junctions && junctions.length > 0) {
    const inviteeIds = [...new Set(junctions.map(j => j.invitee_id))]
    await supabase
      .from('invitees')
      .update({ invitation_status: status })
      .in('id', inviteeIds)
  }
  
  return invitation
}

export async function updateInvitationMessage(invitationId, message) {
  const { data: invitation, error } = await supabase
    .from('invitations')
    .update({ generated_message: message })
    .eq('id', invitationId)
    .select()
    .single()
    
  if (error) throw error
  return invitation
}

export async function getInvitationsByUser(userId) {
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      *,
      families (surname, hof_its),
      family_members (full_name, mobile),
      invitation_member_events ( rsvp_status, invitees (id, member_id, full_name, mobile), events (id, event_name) )
    `)
    .eq('bride_groom_user_id', userId)
    .order('created_at', { ascending: false })
    
  if (error) return []

  // Collect member_ids to check for any global responses across all invitations
  const memberIds = new Set()
  invitations.forEach(inv => {
    (inv.invitation_member_events || []).forEach(ime => {
      if (ime.invitees?.member_id) {
        memberIds.add(ime.invitees.member_id)
      }
    })
  })

  // Global Sync: if an invitee already responded under another invitation link for this event, resolve it
  const globalStatusMap = {}
  if (memberIds.size > 0) {
    const { data: globalResponses } = await supabase
      .from('invitation_member_events')
      .select('event_id, rsvp_status, invitees!inner(member_id)')
      .in('invitees.member_id', Array.from(memberIds))
      .neq('rsvp_status', 'Pending')

    if (globalResponses && globalResponses.length > 0) {
      globalResponses.forEach(r => {
        if (r.invitees?.member_id && r.rsvp_status) {
          globalStatusMap[`${r.invitees.member_id}_${r.event_id}`] = r.rsvp_status
        }
      })
    }
  }
  
  return invitations.map(inv => {
    // Reconcile pending statuses with any global confirmed/attending/declined response
    const resolvedMemberEvents = (inv.invitation_member_events || []).map(ime => {
      const memberId = ime.invitees?.member_id
      const eventId = ime.events?.id
      let status = ime.rsvp_status || 'Pending'
      if (status === 'Pending' && memberId && eventId) {
        const globalStatus = globalStatusMap[`${memberId}_${eventId}`]
        if (globalStatus) {
          status = globalStatus
        }
      }
      return {
        ...ime,
        rsvp_status: status
      }
    })

    const uniqueInvitees = Array.from(new Map(resolvedMemberEvents.map(ime => [ime.invitees?.id, ime.invitees])).values())
    const uniqueEvents = Array.from(new Map(resolvedMemberEvents.map(ime => [ime.events?.id, ime.events])).values())

    return {
      ...inv,
      surname: inv.families?.surname,
      hof_its: inv.families?.hof_its,
      recipient_name: Array.isArray(inv.family_members) ? inv.family_members[0]?.full_name : inv.family_members?.full_name,
      recipient_mobile: Array.isArray(inv.family_members) ? inv.family_members[0]?.mobile : inv.family_members?.mobile,
      invitee_ids: uniqueInvitees.map(i => i?.id).filter(Boolean),
      invitee_names: uniqueInvitees.map(i => i?.full_name).filter(Boolean).join(', '),
      event_ids: uniqueEvents.map(e => e?.id).filter(Boolean),
      event_names: uniqueEvents.map(e => e?.event_name).filter(Boolean).join(', '),
      member_events: resolvedMemberEvents,
    }
  })
}

export async function getAllInvitations() {
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      *,
      users (display_name, username),
      families (surname, hof_its),
      family_members (full_name, mobile),
      invitation_member_events ( rsvp_status, invitees (id, member_id, full_name, mobile, gender), events (id, event_name) )
    `)
    .order('created_at', { ascending: false })
    
  if (error) return []

  const memberIds = new Set()
  invitations.forEach(inv => {
    (inv.invitation_member_events || []).forEach(ime => {
      if (ime.invitees?.member_id) {
        memberIds.add(ime.invitees.member_id)
      }
    })
  })

  const globalStatusMap = {}
  if (memberIds.size > 0) {
    const { data: globalResponses } = await supabase
      .from('invitation_member_events')
      .select('event_id, rsvp_status, invitees!inner(member_id)')
      .in('invitees.member_id', Array.from(memberIds))
      .neq('rsvp_status', 'Pending')

    if (globalResponses && globalResponses.length > 0) {
      globalResponses.forEach(r => {
        if (r.invitees?.member_id && r.rsvp_status) {
          globalStatusMap[`${r.invitees.member_id}_${r.event_id}`] = r.rsvp_status
        }
      })
    }
  }
  
  return invitations.map(inv => {
    const resolvedMemberEvents = (inv.invitation_member_events || []).map(ime => {
      const memberId = ime.invitees?.member_id
      const eventId = ime.events?.id
      let status = ime.rsvp_status || 'Pending'
      if (status === 'Pending' && memberId && eventId) {
        const globalStatus = globalStatusMap[`${memberId}_${eventId}`]
        if (globalStatus) {
          status = globalStatus
        }
      }
      return {
        ...ime,
        rsvp_status: status
      }
    })

    const uniqueInvitees = Array.from(new Map(resolvedMemberEvents.map(ime => [ime.invitees?.id, ime.invitees])).values())
    const uniqueEvents = Array.from(new Map(resolvedMemberEvents.map(ime => [ime.events?.id, ime.events])).values())

    return {
      ...inv,
      invited_by: inv.users?.display_name || inv.users?.username || 'Unknown',
      surname: inv.families?.surname,
      hof_its: inv.families?.hof_its,
      recipient_name: inv.family_members?.full_name,
      recipient_mobile: inv.family_members?.mobile,
      invitees: uniqueInvitees.filter(Boolean),
      invitee_ids: uniqueInvitees.map(i => i?.id).filter(Boolean),
      invitee_names: uniqueInvitees.map(i => i?.full_name).filter(Boolean).join(', '),
      event_ids: uniqueEvents.map(e => e?.id).filter(Boolean),
      event_names: uniqueEvents.map(e => e?.event_name).filter(Boolean).join(', '),
      member_events: resolvedMemberEvents,
    }
  })
}

export async function getAllInvitees() {
  const { data: invitees, error } = await supabase
    .from('invitees')
    .select('*')
  if (error) return []
  return invitees
}

export async function getBridesAndGrooms() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, display_name, role, extra_thaals, total_amount_due, amount_collected, payment_method, payment_date, installments')
    .in('role', ['bride', 'groom'])
    .order('display_name', { ascending: true })
  
  if (error) return []
  return users
}

// --------------------------- Master Data (Families & Events) -------------------------------------------

export async function getEventGuestData() {
  // Fetch all invitees joined with the user who invited them and their events
  const { data: invitees, error } = await supabase
    .from('invitees')
    .select('*, users (display_name, username), invitation_member_events(event_id)')
    
  if (error) return {}

  // We want to group everything by event_id, then by member_id
  const eventMap = new Map() // event_id -> map(member_id -> array of invitee records)

  for (const inv of invitees) {
    if (!inv.invitation_member_events || inv.invitation_member_events.length === 0) {
      continue // Skip members who haven't actually been invited to an event yet
    }
    
    const eventIds = inv.invitation_member_events.map(e => e.event_id)
    for (const eid of eventIds) {
      if (!eventMap.has(eid)) eventMap.set(eid, new Map())
      const memberMap = eventMap.get(eid)
      
      if (!memberMap.has(inv.member_id)) {
        memberMap.set(inv.member_id, [])
      }
      memberMap.get(inv.member_id).push(inv)
    }
  }

  const result = {}

  for (const [eventId, memberMap] of eventMap.entries()) {
    const actualGuests = []
    const totalGuests = []
    const duplicateGuests = []

    for (const [member_id, group] of memberMap.entries()) {
      const member = group[0]
      const invitedByList = group.map(g => ({
        name: g.users?.display_name || g.users?.username || 'Unknown',
        invitee_id: g.id
      }))

      const guestData = {
        member_id: member.member_id,
        member_its: member.member_its,
        full_name: member.full_name,
        surname: member.surname,
        invitedByList: invitedByList
      }

      actualGuests.push(guestData)

      group.forEach(g => {
        totalGuests.push({
          member_id: member.member_id,
          member_its: member.member_its,
          full_name: member.full_name,
          surname: member.surname,
          invitedByList: [{
            name: g.users?.display_name || g.users?.username || 'Unknown',
            invitee_id: g.id
          }]
        })
      })

      if (group.length > 1) {
        duplicateGuests.push(guestData)
      }
    }

    // Sort by ITS number
    const sortByIts = (a, b) => (a.member_its || '').localeCompare(b.member_its || '')
    actualGuests.sort(sortByIts)
    totalGuests.sort(sortByIts)
    duplicateGuests.sort(sortByIts)

    result[eventId] = {
      totalActual: actualGuests.length,
      totalTotal: totalGuests.length,
      totalDuplicates: duplicateGuests.length,
      actualGuests,
      totalGuests,
      duplicateGuests
    }
  }

  return result
}

export async function getUserStats(userId) {
  const invitees = await getInviteesByUser(userId)
  const invitations = await getInvitationsByUser(userId)
  
  const families = new Set(invitees.map((i) => i.family_id))
  
  // Calculate RSVPs from invitation_member_events
  const { data: userInvs } = await supabase.from('invitations').select('id, status').eq('bride_groom_user_id', userId)
  const validInvIds = userInvs ? userInvs.map(i => i.id) : []
  const trackedInvIds = userInvs ? userInvs.filter(i => ['Sent', 'WhatsApp Opened', 'RSVP Sent', 'RSVPed'].includes(i.status)).map(i => i.id) : []
  const phase4InvIds = new Set(userInvs ? userInvs.filter(i => ['RSVP Sent', 'RSVPed'].includes(i.status)).map(i => i.id) : [])

  let rsvps = []
  if (validInvIds.length > 0) {
    const { data } = await supabase
      .from('invitation_member_events')
      .select('invitee_id, event_id, rsvp_status, invitation_id, invitees (member_id)')
      .in('invitation_id', validInvIds)
    if (data) rsvps = data
  }

  // Global Sync for user stats
  const memberIds = [...new Set(rsvps.map(r => r.invitees?.member_id).filter(Boolean))]
  const globalStatusMap = {}
  if (memberIds.length > 0) {
    const { data: globalResponses } = await supabase
      .from('invitation_member_events')
      .select('event_id, rsvp_status, invitees!inner(member_id)')
      .in('invitees.member_id', memberIds)
      .neq('rsvp_status', 'Pending')

    if (globalResponses && globalResponses.length > 0) {
      globalResponses.forEach(r => {
        if (r.invitees?.member_id && r.rsvp_status) {
          globalStatusMap[`${r.invitees.member_id}_${r.event_id}`] = r.rsvp_status
        }
      })
    }
  }

  const seatsPerEvent = {}
  const personRsvps = new Map()
  if (rsvps) {
    rsvps.forEach(r => {
      let currentStatus = r.rsvp_status || 'Pending'
      if (currentStatus === 'Pending' && r.invitees?.member_id && r.event_id) {
        const globalStatus = globalStatusMap[`${r.invitees.member_id}_${r.event_id}`]
        if (globalStatus) {
          currentStatus = globalStatus
        }
      }

      // Track seats per event for ALL invitations
      if (r.event_id) {
        seatsPerEvent[r.event_id] = (seatsPerEvent[r.event_id] || 0) + 1
      }

      // ONLY track stats for invitations that have been sent
      if (trackedInvIds.includes(r.invitation_id)) {
        if (!personRsvps.has(r.invitee_id)) {
          personRsvps.set(r.invitee_id, { attending: 0, pending: 0, notAttending: 0, confirmed: 0, declined: 0, hasPhase4Inv: false })
        }
        const s = personRsvps.get(r.invitee_id)
        const isPhase4 = phase4InvIds.has(r.invitation_id)
        if (isPhase4) s.hasPhase4Inv = true
        
        if (currentStatus === 'Attending') {
          if (isPhase4) s.attending++
          else s.confirmed++
        } else if (currentStatus === 'Not Attending') {
          if (isPhase4) s.notAttending++
          else s.declined++
        } else if (currentStatus === 'Confirmed') {
          s.confirmed++
        } else if (currentStatus === 'Declined') {
          s.declined++
        } else {
          s.pending++
        }
      }
    })
  }

  let confirmed = 0, declined = 0, pendingConfirmations = 0
  let attending = 0, notAttending = 0, pendingRsvps = 0
  
  personRsvps.forEach(s => {
    // Phase 4 RSVPs
    let inPhase4 = false
    if (s.hasPhase4Inv) {
      inPhase4 = true
      if (s.attending > 0) attending++
      else if (s.notAttending > 0) notAttending++
      else pendingRsvps++
    } else {
      // Catch edge cases where they have attending/notAttending without the flag
      if (s.attending > 0) {
        attending++
        inPhase4 = true
      } else if (s.notAttending > 0) {
        notAttending++
        inPhase4 = true
      }
    }

    // Phase 3 Confirmations
    // A person counts as "Confirmed" if they are currently confirmed OR if they advanced to Phase 4
    if (s.confirmed > 0 || inPhase4) {
      confirmed++
    }
    // Declined in Phase 3
    else if (s.declined > 0) {
      declined++
    }
    // Pending in Phase 3
    else if (s.pending > 0) {
      pendingConfirmations++
    }
  })



  const { data: userRec } = await supabase.from('users').select('extra_thaals').eq('id', userId).single()

  return {
    totalInvitees: invitees.length,
    totalFamilies: families.size,
    drafts: invitations.filter((i) => i.status === 'Draft').length,
    ready: invitations.filter((i) => i.status === 'Ready' || i.status === 'WhatsApp Opened').length,
    sent: invitations.filter((i) => i.status === 'Sent' || i.status === 'RSVP Sent').length,
    attending,
    notAttending,
    pendingRsvps,
    confirmed: confirmed + attending + notAttending, // If they reached phase 3, they were confirmed in phase 2
    declined,
    pendingConfirmations,
    totalSeatsConsumed: rsvps.filter(r => r.rsvp_status !== 'Not Attending' && r.rsvp_status !== 'Declined').length,
    seatsPerEvent,
    extra_thaals: userRec?.extra_thaals || 0
  }
}

export async function getAdminStats() {
  const { count: bridesCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'bride')
  const { count: groomsCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'groom')
  const { count: familiesCount } = await supabase.from('families').select('*', { count: 'exact', head: true })
  
  // Get all invitees to calculate RSVP stats and family counts
  const { data: allInvitees } = await supabase.from('invitees').select('id, family_id')
  const inviteesCount = allInvitees ? allInvitees.length : 0
  const familyIds = new Set((allInvitees || []).map((i) => i.family_id))
  
  // Get RSVPs from invitation_member_events where invitation is Sent
  const { data: invs } = await supabase.from('invitations').select('id').in('status', ['Sent', 'WhatsApp Opened', 'RSVP Sent', 'RSVPed'])
  const validInvIds = invs ? invs.map(i => i.id) : []

  let allRsvps = []
  if (validInvIds.length > 0) {
    const { data } = await supabase
      .from('invitation_member_events')
      .select('invitee_id, rsvp_status, invitees(member_id)')
      .in('invitation_id', validInvIds)
    if (data) allRsvps = data
  }

  const personRsvps = new Map()
  if (allRsvps) {
    allRsvps.forEach(r => {
      const personKey = r.invitees?.member_id || r.invitee_id
      if (!personRsvps.has(personKey)) {
        personRsvps.set(personKey, { attending: 0, pending: 0, notAttending: 0 })
      }
      const s = personRsvps.get(personKey)
      if (r.rsvp_status === 'Attending' || r.rsvp_status === 'Confirmed') s.attending++
      else if (r.rsvp_status === 'Not Attending' || r.rsvp_status === 'Declined') s.notAttending++
      else s.pending++
    })
  }

  let attending = 0, notAttending = 0, pendingRsvps = 0
  personRsvps.forEach(s => {
    if (s.attending > 0) attending++
    else if (s.pending > 0) pendingRsvps++
    else if (s.notAttending > 0) notAttending++
  })
  
  const invitations = await getAllInvitations()
  
  return {
    totalBrides: bridesCount || 0,
    totalGrooms: groomsCount || 0,
    totalFamilies: familiesCount || 0,
    totalFamiliesInvited: familyIds.size,
    totalInvitees: inviteesCount || 0,
    totalInvitations: invitations.length,
    sentInvitations: invitations.filter((i) => i.status === 'Sent' || i.status === 'RSVP Sent').length,
    pendingInvitations: invitations.filter((i) => i.status !== 'Sent' && i.status !== 'RSVP Sent').length,
    attending,
    notAttending,
    pendingRsvps,
  }
}

export async function getTncRsvpData() {
  // Fetch relevant invitations first to avoid PostgREST inner join ambiguity
  const { data: invs, error: invsErr } = await supabase
    .from('invitations')
    .select('id, status, users (display_name)')
    .in('status', ['Sent', 'WhatsApp Opened', 'RSVP Sent', 'RSVPed'])
    
  if (invsErr || !invs || invs.length === 0) {
    if (invsErr) console.error('Error fetching TNC RSVPs (invitations):', invsErr)
    return []
  }

  const validInvIds = invs.map(i => i.id)
  const invMap = Object.fromEntries(invs.map(i => [i.id, i]))

  const { data, error } = await supabase
    .from('invitation_member_events')
    .select(`
      invitation_id,
      rsvp_status,
      events (event_name),
      invitees (
        id,
        member_id,
        full_name,
        surname,
        mobile,
        relationship,
        gender
      )
    `)
    .in('invitation_id', validInvIds)

  if (error) {
    console.error('Error fetching TNC RSVP Data (junctions):', error)
    return []
  }

  return data.map(row => ({
    rsvp_status: row.rsvp_status || 'Pending',
    event_name: row.events?.event_name,
    invitee_id: row.invitees?.id,
    member_id: row.invitees?.member_id,
    full_name: row.invitees?.full_name,
    surname: row.invitees?.surname,
    mobile: row.invitees?.mobile,
    relationship: row.invitees?.relationship,
    gender: row.invitees?.gender,
    invited_by: invMap[row.invitation_id]?.users?.display_name
  }))
}

export async function resetUserData(userId) {
  // Due to cascade deletes on invitation_members, deleting invitations and invitees is sufficient
  const { error: invErr } = await supabase.from('invitations').delete().eq('bride_groom_user_id', userId)
  if (invErr) throw invErr
  
  const { error: reqErr } = await supabase.from('invitees').delete().eq('bride_groom_user_id', userId)
  if (reqErr) throw reqErr
}

export async function resetUserPhaseData(userId, phase) {
  if (phase === 1) {
    // Phase 1: Reset Invitees (Delete all invitees and their invitations)
    const { error: invErr } = await supabase.from('invitations').delete().eq('bride_groom_user_id', userId)
    if (invErr) throw invErr
    const { error: reqErr } = await supabase.from('invitees').delete().eq('bride_groom_user_id', userId)
    if (reqErr) throw reqErr
  } else if (phase === 2) {
    // Phase 2: Reset Invitations (Delete invitations only, keep invitees)
    const { error: invErr } = await supabase.from('invitations').delete().eq('bride_groom_user_id', userId)
    if (invErr) throw invErr
    
    // Also reset invitation_status on invitees
    const { error: updateErr } = await supabase.from('invitees').update({ invitation_status: 'Not Invited' }).eq('bride_groom_user_id', userId)
    if (updateErr) throw updateErr
  } else if (phase === 3) {
    // Phase 3: Reset RSVPs (Keep invitations, just set all RSVP status to Pending)
    const { data: invs } = await supabase.from('invitations').select('id, status').eq('bride_groom_user_id', userId)
    if (invs && invs.length > 0) {
      const invIds = invs.map(i => i.id)
      
      // Reset all RSVP statuses to Pending
      const { error: rsvpErr } = await supabase.from('invitation_member_events')
        .update({ rsvp_status: 'Pending' })
        .in('invitation_id', invIds)
      if (rsvpErr) throw rsvpErr
        
      // Revert any invitations that were "RSVP Sent" back to "Sent"
      const rsvpSentIds = invs.filter(i => i.status === 'RSVP Sent').map(i => i.id)
      if (rsvpSentIds.length > 0) {
        const { error: revertErr } = await supabase.from('invitations')
          .update({ status: 'Sent' })
          .in('id', rsvpSentIds)
        if (revertErr) throw revertErr
      }
    }
  }
}

export async function deleteFamily(familyId) {
  const { error } = await supabase.from('families').delete().eq('id', familyId)
  if (error) throw error
}

export async function deleteAllFamilies() {
  const { error } = await supabase.from('families').delete().neq('id', '00000000-0000-0000-0000-000000000000') // Deletes all rows safely
  if (error) throw error
}

export async function getAllUsersSafe() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, display_name, role, can_add_invitees, can_send_invitations, can_send_rsvps, created_at')
    .order('username', { ascending: true })
  if (error) return []
  return users
}

// --------------------------- Global Settings ---------------------------------

export async function getGlobalRsvpStatus() {
  const { data } = await supabase.from('users').select('can_send_rsvps').eq('role', 'admin').maybeSingle()
  // Default to open if no admin found or not set
  return data ? data.can_send_rsvps !== false : true
}

export async function getGlobalPhaseVisibility() {
  const { data } = await supabase.from('users').select('phase_1_visible, phase_2_visible, phase_3_visible').eq('role', 'admin').maybeSingle()
  if (!data) return { phase_1_visible: true, phase_2_visible: true, phase_3_visible: true }
  return {
    phase_1_visible: data.phase_1_visible !== false,
    phase_2_visible: data.phase_2_visible !== false,
    phase_3_visible: data.phase_3_visible !== false,
  }
}

export async function setGlobalPhaseVisibility(updates) {
  const { error } = await supabase.from('users').update(updates).eq('role', 'admin')
  if (error) throw error
}

// --------------------------- Public RSVP -------------------------------------

export async function getPublicInvitationDetails(invitationId) {
  // Fetch invitation, family details, and invited members safely for public view
  const { data: inv, error } = await supabase
    .from('invitations')
    .select(`
      id,
      status,
      families (surname, hof_its),
      users (username, role, display_name),
      invitation_member_events (
        rsvp_status,
        events (id, event_name),
        invitees (
          id,
          member_id,
          full_name
        )
      )
    `)
    .eq('id', invitationId)
    .single()
    
  if (error || !inv) {
    console.error("Error fetching public invitation:", error)
    return { error: 'Invitation not found.' }
  }

  // Group events by invitee
  const uniqueInviteesMap = new Map()
  
  if (inv.invitation_member_events) {
    inv.invitation_member_events.forEach(im => {
      if (im.invitees && im.invitees.id && im.events) {
        if (!uniqueInviteesMap.has(im.invitees.id)) {
          uniqueInviteesMap.set(im.invitees.id, {
            id: im.invitees.id,
            member_id: im.invitees.member_id,
            full_name: im.invitees.full_name,
            events: []
          })
        }
        uniqueInviteesMap.get(im.invitees.id).events.push({
          junction_id: `${im.invitees.id}_${im.events.id}`,
          invitee_id: im.invitees.id,
          event_id: im.events.id,
          event_name: im.events.event_name,
          rsvp_status: im.rsvp_status || 'Pending'
        })
      }
    })
  }

  // --- NEW: Global Sync Check ---
  // If this person already responded on ANOTHER invitation link, we want to reflect it here
  const memberIds = Array.from(uniqueInviteesMap.values()).map(inv => inv.member_id).filter(Boolean)
  if (memberIds.length > 0) {
    const { data: globalResponses } = await supabase
      .from('invitation_member_events')
      .select('event_id, rsvp_status, invitees!inner(member_id)')
      .in('invitees.member_id', memberIds)
      .neq('rsvp_status', 'Pending')

    if (globalResponses && globalResponses.length > 0) {
      const globalStatusMap = {}
      globalResponses.forEach(r => {
        globalStatusMap[`${r.invitees.member_id}_${r.event_id}`] = r.rsvp_status
      })

      // Update the local map with the global status if it exists
      uniqueInviteesMap.forEach(invitee => {
        if (!invitee.member_id) return
        invitee.events.forEach(ev => {
          const globalStatus = globalStatusMap[`${invitee.member_id}_${ev.event_id}`]
          if (globalStatus && ev.rsvp_status === 'Pending') {
            ev.rsvp_status = globalStatus
          }
        })
      })
    }
  }

  return {
    invitation: {
      id: inv.id,
      status: inv.status,
      surname: inv.families?.surname,
      invited_by: inv.users?.display_name,
      invited_by_username: inv.users?.username,
      invited_by_role: inv.users?.role
    },
    invitees: Array.from(uniqueInviteesMap.values())
  }
}

export async function submitRsvp(invitationId, rsvpData, isConfirmation = false) {
  // rsvpData is an array of objects: { junctionId: "inviteeId_eventId", status: 'Attending' | 'Not Attending' }
  try {
    const updatedInvitationIds = new Set([invitationId])

    for (const rsvp of rsvpData) {
      if (!rsvp.junctionId) continue;
      const [inviteeId, eventId] = rsvp.junctionId.split('_')
      if (!inviteeId || !eventId) continue;
      
      // Look up the member_id for this invitee
      const { data: invitee, error: inviteeErr } = await supabase
        .from('invitees')
        .select('member_id')
        .eq('id', inviteeId)
        .single()
        
      if (inviteeErr) return { error: inviteeErr.message }
      if (!invitee || !invitee.member_id) continue;
      
      // Look up all invitees that share this member_id
      const { data: siblingInvitees, error: sibErr } = await supabase
        .from('invitees')
        .select('id')
        .eq('member_id', invitee.member_id)
        
      if (sibErr) return { error: sibErr.message }
      if (!siblingInvitees) continue;
      
      const siblingIds = siblingInvitees.map(s => s.id)
      
      // Update across all sibling invitees
      const { data, error: updateErr } = await supabase
        .from('invitation_member_events')
        .update({ rsvp_status: rsvp.status })
        .in('invitee_id', siblingIds)
        .eq('event_id', eventId)
        .select('invitation_id')
        
      if (updateErr) return { error: updateErr.message }
      if (data) {
        data.forEach(row => updatedInvitationIds.add(row.invitation_id))
      }
    }
    
    // Update all affected invitations status to RSVPed so they know they responded
    if (updatedInvitationIds.size > 0 && !isConfirmation) {
      const { error: invError } = await supabase
        .from('invitations')
        .update({ status: 'RSVPed' })
        .in('id', Array.from(updatedInvitationIds))
      if (invError) return { error: invError.message }
    }
      
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
}

