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
  const { data: users } = await supabase.from('users').select('id, username').in('username', ['Dulhan01', 'Dulhan02'])
  const d1 = users.find(u => u.username === 'Dulhan01').id
  const d2 = users.find(u => u.username === 'Dulhan02').id

  const { data: inv1 } = await supabase.from('invitations').select('id, family_id, whatsapp_recipient_member_id, family_members(full_name, mobile)').eq('bride_groom_user_id', d1).limit(2)
  const { data: inv2 } = await supabase.from('invitations').select('id, family_id, whatsapp_recipient_member_id, family_members(full_name, mobile)').eq('bride_groom_user_id', d2).limit(2)

  console.log("Dulhan01 Invitations:", JSON.stringify(inv1, null, 2))
  console.log("Dulhan02 Invitations:", JSON.stringify(inv2, null, 2))
}
run()
