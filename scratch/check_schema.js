import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function getColumns(table) {
  // We can just run a select query and look at the keys of the returned object
  const { data, error } = await supabase.from(table).select('*').limit(1)
  if (data && data.length > 0) {
    console.log(`Columns for ${table}:`, Object.keys(data[0]))
  } else {
    console.log(`No data or error for ${table}:`, error, data)
  }
}

async function run() {
  await getColumns('families')
  await getColumns('invitees')
}

run()
