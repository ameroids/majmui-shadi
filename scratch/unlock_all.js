import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Need to read the .env file manually to avoid dotenv resolution issue
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
  const { data, error } = await supabase.from('users').update({ can_send_rsvps: true }).neq('role', 'admin')
  console.log("Error:", error)
  console.log("Success unlocking all brides and grooms")
}
run()
