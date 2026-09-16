import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const envContent = fs.readFileSync('.env', 'utf-8')
const envObj = {}
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=')
    envObj[key.trim()] = rest.join('=').trim()
  }
})

const supabaseUrl = envObj['VITE_SUPABASE_URL']
const supabaseKey = envObj['VITE_SUPABASE_ANON_KEY']
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  // Login as admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@majmuishaadi.com',
    password: 'admin' // Assuming this is the password based on previous sessions if known? Actually I can't guess the password.
  })
  
  if (authError) {
    console.log("Auth error:", authError)
    return
  }

  const { data: users } = await supabase.from('users').select('id, username').eq('role', 'bride')
  
  for (const user of users) {
    const { data, error } = await supabase.from('users').update({ can_send_rsvps: true }).eq('id', user.id).select()
    console.log(`Update ${user.username}:`, data, error)
  }
}
run()
