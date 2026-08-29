import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  console.log('Seeding events...')
  const events = [
    { event_name: 'Nikah', event_date: '2027-10-15', event_time: '10:00 AM', venue: 'Saifee Masjid' },
    { event_name: 'Reception', event_date: '2027-10-16', event_time: '08:00 PM', venue: 'Community Hall' },
  ]
  for (const e of events) {
    await supabase.from('events').insert(e)
  }

  console.log('Seeding families...')
  const familiesData = [
    {
      hof_its: '1010101', surname: 'Ezzi',
      members: [
        { member_its: '1010101', full_name: 'Mustafa Ezzi', mobile: '9876543210', relationship: 'HOF', gender: 'Male' },
        { member_its: '1010102', full_name: 'Fatema Ezzi', mobile: '9876543211', relationship: 'Wife', gender: 'Female' },
        { member_its: '1010103', full_name: 'Husain Ezzi', mobile: '9876543212', relationship: 'Son', gender: 'Male' },
      ]
    },
    {
      hof_its: '2020202', surname: 'Kapadia',
      members: [
        { member_its: '2020202', full_name: 'Abbas Kapadia', mobile: '8876543210', relationship: 'HOF', gender: 'Male' },
        { member_its: '2020203', full_name: 'Zainab Kapadia', mobile: '', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '3030303', surname: 'Lokhandwala',
      members: [
        { member_its: '3030303', full_name: 'Ali Lokhandwala', mobile: '7876543210', relationship: 'HOF', gender: 'Male' },
        { member_its: '3030304', full_name: 'Sakina Lokhandwala', mobile: '7876543211', relationship: 'Wife', gender: 'Female' },
        { member_its: '3030305', full_name: 'Burhanuddin Lokhandwala', mobile: '', relationship: 'Son', gender: 'Male' },
        { member_its: '3030306', full_name: 'Ruqaiyah Lokhandwala', mobile: '', relationship: 'Daughter', gender: 'Female' },
      ]
    },
    {
      hof_its: '4040404', surname: 'Merchant',
      members: [
        { member_its: '4040404', full_name: 'Taher Merchant', mobile: '6876543210', relationship: 'HOF', gender: 'Male' },
      ]
    },
    {
      hof_its: '5050505', surname: 'Contractor',
      members: [
        { member_its: '5050505', full_name: 'Yusuf Contractor', mobile: '5876543210', relationship: 'HOF', gender: 'Male' },
        { member_its: '5050506', full_name: 'Mariya Contractor', mobile: '5876543211', relationship: 'Wife', gender: 'Female' },
      ]
    }
  ]

  for (const f of familiesData) {
    // Upsert or skip if hof_its exists
    const { data: family, error: fError } = await supabase
      .from('families')
      .upsert({ hof_its: f.hof_its, surname: f.surname }, { onConflict: 'hof_its' })
      .select()
      .single()

    if (fError) {
      console.error('Error inserting family', f.hof_its, fError)
      continue
    }

    const membersToInsert = f.members.map(m => ({
      family_id: family.id,
      ...m
    }))

    // Clear existing members just in case we are running this multiple times
    await supabase.from('family_members').delete().eq('family_id', family.id)

    const { error: mError } = await supabase.from('family_members').insert(membersToInsert)
    if (mError) {
      console.error('Error inserting members for', f.hof_its, mError)
    }
  }

  console.log('Done seeding mock data!')
}

seed()
