import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function backfillInstallments() {
  console.log('Fetching users...')
  const { data: users, error } = await supabase
    .from('users')
    .select('id, total_amount_due, amount_collected, payment_date, payment_method, installments')
    .in('role', ['bride', 'groom'])
  
  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  let updatedCount = 0

  for (const user of users) {
    let currentInstallments = []
    
    // Safety check: parse if string, skip if already has installments
    try {
      currentInstallments = typeof user.installments === 'string' 
        ? JSON.parse(user.installments) 
        : (user.installments || [])
    } catch(e) {}

    if (currentInstallments.length > 0) {
      continue // Skip users who already have installments set up
    }

    const due = user.total_amount_due || 0
    const collected = user.amount_collected || 0
    let newInstallments = []

    // 1. If they have paid something, create a 'Paid' installment for it
    if (collected > 0) {
      newInstallments.push({
        id: crypto.randomUUID(),
        amount: collected,
        paid: true,
        deadline: user.payment_date ? user.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        payment_date: user.payment_date ? user.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
        method: user.payment_method || 'Cash'
      })
    }

    // 2. If they still owe money, create a 'Pending' installment for the balance
    if (due > collected) {
      newInstallments.push({
        id: crypto.randomUUID(),
        amount: due - collected,
        paid: false,
        deadline: '',
        payment_date: '',
        method: ''
      })
    }

    // If we generated installments for them, save it to Supabase
    if (newInstallments.length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ installments: newInstallments })
        .eq('id', user.id)
      
      if (updateError) {
        console.error(\`Failed to update user \${user.id}:\`, updateError)
      } else {
        console.log(\`✅ Backfilled installments for user: \${user.id}\`)
        updatedCount++
      }
    }
  }

  console.log(\`\\n🎉 Finished! Successfully backfilled \${updatedCount} users.\`)
}

backfillInstallments()
