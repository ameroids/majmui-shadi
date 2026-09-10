import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function run() {
  const { data: users, error } = await supabase.from('users').select('id, username, display_name').order('username')
  console.log('Users:', users)
}

run()
