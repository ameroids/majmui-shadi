import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://aufeofbfdpqxueibbzec.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seedUsers() {
  const users = [
    { username: 'admin', password_hash: 'admin123', role: 'admin', display_name: 'Administrator' },
    { username: 'tnc', password_hash: 'tnc123', role: 'tnc', display_name: 'TNC Member' }
  ]

  // Add Dulhan01 to Dulhan10
  for (let i = 1; i <= 10; i++) {
    const padded = i.toString().padStart(2, '0');
    users.push({ username: `Dulhan${padded}`, password_hash: 'password123', role: 'bride', display_name: `Bride Family ${padded}` });
  }

  // Add Dulha01 to Dulha10
  for (let i = 1; i <= 10; i++) {
    const padded = i.toString().padStart(2, '0');
    users.push({ username: `Dulha${padded}`, password_hash: 'password123', role: 'groom', display_name: `Groom Family ${padded}` });
  }

  console.log('Seeding users...')
  for (const user of users) {
    const { data, error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'username' })
    if (error) {
      console.error(`Error inserting ${user.username}:`, error)
    } else {
      console.log(`Inserted ${user.username}`)
    }
  }
  console.log('Done seeding users.')
}

seedUsers()
