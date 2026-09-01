import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  console.log('Deleting existing events...')
  // delete all events where active = true or false
  const { error: delErr } = await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    console.error('Error deleting events:', delErr)
    return
  }

  const eventsToInsert = [
    { event_name: 'Nikah', event_description: 'Nikah Ceremony', active: true },
    { event_name: 'Shadi', event_description: 'Shadi Ceremony', active: true },
    { event_name: 'Reception', event_description: 'Wedding Reception', active: true }
  ]

  console.log('Inserting Nikah, Shadi, Reception...')
  const { error: insErr } = await supabase.from('events').insert(eventsToInsert)
  
  if (insErr) {
    console.error('Error inserting events:', insErr)
  } else {
    console.log('Successfully updated events!')
  }
}

run()
