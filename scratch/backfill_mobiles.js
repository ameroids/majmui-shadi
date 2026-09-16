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
  const { data: invitees, error } = await supabase.from('invitees').select('member_id, mobile').not('mobile', 'is', null)
  if (error) { console.error(error); return; }

  const uniqueMobiles = {}
  for (const inv of invitees) {
    if (inv.mobile && inv.mobile.trim() !== '') {
      uniqueMobiles[inv.member_id] = inv.mobile.trim()
    }
  }

  for (const [member_id, mobile] of Object.entries(uniqueMobiles)) {
    const { error: updErr } = await supabase.from('family_members').update({ mobile }).eq('id', member_id)
    if (updErr) console.error(`Failed to update ${member_id}:`, updErr)
  }
  console.log('Successfully backfilled mobile numbers.')
}
run()
