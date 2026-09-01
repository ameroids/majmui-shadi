import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedDuplicates() {
  console.log('Fetching users...')
  const { data: users, error: uError } = await supabase.from('users').select('*').in('username', ['Dulhan01', 'Dulhan02', 'Dulha01'])
  if (uError) throw uError

  const user1 = users.find(u => u.username === 'Dulhan01')
  const user2 = users.find(u => u.username === 'Dulhan02')
  const user3 = users.find(u => u.username === 'Dulha01')

  console.log('Fetching families...')
  const { data: families, error: fError } = await supabase.from('families').select('id, surname, family_members(*)')
  if (fError) throw fError

  const ezziFamily = families.find(f => f.surname === 'Ezzi')
  const kapadiaFamily = families.find(f => f.surname === 'Kapadia')

  console.log('Inserting duplicate invitees...')

  const insertInvitees = async (user, family, membersToInvite) => {
    const inviteesData = membersToInvite.map(m => ({
      bride_groom_user_id: user.id,
      family_id: family.id,
      member_id: m.id,
      member_its: m.member_its,
      full_name: m.full_name,
      surname: family.surname,
      status: 'Ready'
    }))
    
    // UPSERT manually
    for (const inv of inviteesData) {
       await supabase.from('invitees').upsert(inv, { onConflict: 'bride_groom_user_id, member_id' })
    }
  }

  // Dulhan01 invites Ezzi and Kapadia families
  await insertInvitees(user1, ezziFamily, ezziFamily.family_members)
  await insertInvitees(user1, kapadiaFamily, kapadiaFamily.family_members)

  // Dulhan02 invites Ezzi family (CREATES DUPLICATES FOR EZZI)
  await insertInvitees(user2, ezziFamily, ezziFamily.family_members)

  // Dulha01 invites Kapadia family (CREATES DUPLICATES FOR KAPADIA)
  await insertInvitees(user3, kapadiaFamily, kapadiaFamily.family_members)

  console.log('Done creating duplicate entries!')
}

seedDuplicates().catch(console.error)
