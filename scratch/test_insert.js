import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const manualId = 'manual_' + Math.random().toString(36).slice(2, 8)
  
  // Need a valid user ID. We can just pick the first user.
  const { data: user } = await supabase.from('users').select('id').limit(1).single()
  if (!user) return console.log("No users found.")
  const userId = user.id

  const { data: family, error } = await supabase.from('families').insert({
    surname: `FakeFamily ${Math.random().toString(36).substring(2, 6)}`,
    manual: true,
    hof_its: manualId,
    created_by: userId
  }).select('id').single()

  console.log("Family Insert Result:", family, error)
  
  if (family) {
    const invitees = Array.from({ length: 5 }).map((_, j) => ({
      family_id: family.id,
      bride_groom_user_id: userId,
      full_name: `Fake Member ${j + 1}`,
      mobile: `999999999${j}`,
      member_its: `${Math.floor(Math.random() * 100000000)}`
    }))
    const { data: invData, error: invErr } = await supabase.from('invitees').insert(invitees).select()
    console.log("Invitees Insert Result:", invData, invErr)
  }
}

run()
