import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      *,
      families (surname, hof_its),
      family_members (full_name, mobile)
    `)
    .limit(1)
    
  fs.writeFileSync('scratch/test_output.json', JSON.stringify(invitations, null, 2))
}
test()
