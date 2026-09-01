import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  console.log('Seeding 10 mock families...')
  const familiesData = [
    {
      hof_its: '1111111', surname: 'Saifee',
      members: [
        { member_its: '1111111', full_name: 'Ahmed Saifee', mobile: '9111111111', relationship: 'HOF', gender: 'Male' },
        { member_its: '1111112', full_name: 'Zahra Saifee', mobile: '9111111112', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '2222222', surname: 'Vohra',
      members: [
        { member_its: '2222222', full_name: 'Murtaza Vohra', mobile: '9222222222', relationship: 'HOF', gender: 'Male' },
        { member_its: '2222223', full_name: 'Rukaiya Vohra', mobile: '', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '3333333', surname: 'Poonawala',
      members: [
        { member_its: '3333333', full_name: 'Khuzaima Poonawala', mobile: '9333333333', relationship: 'HOF', gender: 'Male' },
        { member_its: '3333334', full_name: 'Arwa Poonawala', mobile: '', relationship: 'Wife', gender: 'Female' },
        { member_its: '3333335', full_name: 'Ali Poonawala', mobile: '', relationship: 'Son', gender: 'Male' },
      ]
    },
    {
      hof_its: '4444444', surname: 'Jamali',
      members: [
        { member_its: '4444444', full_name: 'Taha Jamali', mobile: '9444444444', relationship: 'HOF', gender: 'Male' },
      ]
    },
    {
      hof_its: '5555555', surname: 'Mithaiwala',
      members: [
        { member_its: '5555555', full_name: 'Hakimuddin Mithaiwala', mobile: '9555555555', relationship: 'HOF', gender: 'Male' },
        { member_its: '5555556', full_name: 'Batool Mithaiwala', mobile: '9555555556', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '6666666', surname: 'Bohra',
      members: [
        { member_its: '6666666', full_name: 'Hasan Bohra', mobile: '9666666666', relationship: 'HOF', gender: 'Male' },
        { member_its: '6666667', full_name: 'Tasneem Bohra', mobile: '9666666667', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '7777777', surname: 'Dharampurwala',
      members: [
        { member_its: '7777777', full_name: 'Idris Dharampurwala', mobile: '9777777777', relationship: 'HOF', gender: 'Male' },
      ]
    },
    {
      hof_its: '8888888', surname: 'Khandala',
      members: [
        { member_its: '8888888', full_name: 'Najmuddin Khandala', mobile: '9888888888', relationship: 'HOF', gender: 'Male' },
        { member_its: '8888889', full_name: 'Insiyah Khandala', mobile: '9888888889', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '9999999', surname: 'Rajkotwala',
      members: [
        { member_its: '9999999', full_name: 'Amir Rajkotwala', mobile: '9999999999', relationship: 'HOF', gender: 'Male' },
        { member_its: '9999990', full_name: 'Jumana Rajkotwala', mobile: '9999999990', relationship: 'Wife', gender: 'Female' },
      ]
    },
    {
      hof_its: '1212121', surname: 'Suratwala',
      members: [
        { member_its: '1212121', full_name: 'Mohammad Suratwala', mobile: '9121212121', relationship: 'HOF', gender: 'Male' },
        { member_its: '1212122', full_name: 'Khadija Suratwala', mobile: '9121212122', relationship: 'Wife', gender: 'Female' },
        { member_its: '1212123', full_name: 'Zainuddin Suratwala', mobile: '', relationship: 'Son', gender: 'Male' },
      ]
    }
  ]

  for (const f of familiesData) {
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

    // Clear existing members just in case
    await supabase.from('family_members').delete().eq('family_id', family.id)

    const { error: mError } = await supabase.from('family_members').insert(membersToInsert)
    if (mError) {
      console.error('Error inserting members for', f.hof_its, mError)
    }
  }

  console.log('Done seeding 10 mock families!')
}

seed()
