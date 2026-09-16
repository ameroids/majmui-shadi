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
  const { data, error } = await supabase.from('users').select('username, display_name').order('username')
  if (error) {
    console.error(error)
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}
run()
