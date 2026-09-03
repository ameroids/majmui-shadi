import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aufeofbfdpqxueibbzec.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmVvZmJmZHBxeHVlaWJiemVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MjE0MzAsImV4cCI6MjEwMzM5NzQzMH0.oH9SU2bi_ZOqXCe0KCGppEsphEM4l_TwzZ2v89OF6QM'
);

async function check() {
  const { data: invitees, error } = await supabase.from('invitees').select('id, full_name, bride_groom_user_id');
  
  if (error) {
    console.error('Error fetching invitees:', error);
    return;
  }
  
  console.log(`\nFound ${invitees.length} total invitees in the database.`);
  
  if (invitees.length > 0) {
    console.log('\nHere is who invited them:');
    
    // Group by user ID
    const byUser = {};
    for (const inv of invitees) {
      if (!byUser[inv.bride_groom_user_id]) byUser[inv.bride_groom_user_id] = [];
      byUser[inv.bride_groom_user_id].push(inv.full_name);
    }
    
    // Fetch user names
    const { data: users } = await supabase.from('users').select('id, display_name');
    const userMap = users ? Object.fromEntries(users.map(u => [u.id, u.display_name])) : {};
    
    for (const [userId, names] of Object.entries(byUser)) {
      const brideOrGroom = userMap[userId] || 'Unknown User';
      console.log(`\n- ${brideOrGroom} (ID: ${userId}) invited:`);
      names.forEach(n => console.log(`  -> ${n}`));
    }
  }
}

check();
