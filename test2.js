import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '.env') })

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
    
  console.log("Invitations:", JSON.stringify(invitations, null, 2))
  if (error) console.error("Error:", error)
}
test()
