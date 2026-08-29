import { createClient } from '@supabase/supabase-js'

const url = 'https://aufeofbfdpqxueibbzec.supabase.co'
const key = 'sb_publishable_LODbJ8ysTtM1567bN2yYsQ_ynRTBgX3'

console.log('URL:', url)
console.log('KEY:', key)

const supabase = createClient(url, key)

async function test() {
  console.log('Testing connection...')
  const { data, error } = await supabase.from('users').select('*').limit(1)
  if (error) {
    console.error('Error connecting to Supabase:', error)
  } else {
    console.log('Success! Data:', data)
  }
}

test()
