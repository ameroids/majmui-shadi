import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: globalResponses, error } = await supabase
    .from('invitation_member_events')
    .select('event_id, rsvp_status, invitees!inner(member_id)')
    .neq('rsvp_status', 'Pending')
    .limit(5)
    
  console.log("Global responses:", JSON.stringify(globalResponses, null, 2))
  if (error) console.error("Error:", error)
}
test()
