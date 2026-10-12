import fs from 'fs'
import readline from 'readline'
import { createClient } from '@supabase/supabase-js'

// 1. Read .env credentials
const envContent = fs.readFileSync('.env', 'utf-8')
const envObj = {}
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=')
    envObj[key.trim()] = rest.join('=').trim()
  }
})

const supabaseUrl = envObj['VITE_SUPABASE_URL']
const supabaseKey = envObj['VITE_SUPABASE_ANON_KEY']
const supabase = createClient(supabaseUrl, supabaseKey)

function parseCSVLine(line) {
  const result = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim())
      cur = ''
    } else {
      cur += char
    }
  }
  result.push(cur.trim())
  return result
}

async function run() {
  console.log('🚀 Starting import from families.csv...')
  console.log('Connecting to:', supabaseUrl)

  const fileStream = fs.createReadStream('families.csv')
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  let isHeader = true
  const rawRows = []
  const familiesMap = new Map() // hof_its -> surname

  for await (const line of rl) {
    if (!line.trim()) continue
    if (isHeader) {
      isHeader = false
      continue
    }

    // Expected columns: HOF_ID, Surname, ITS_ID, Full_Name, HOF_FM_TYPE, Gender
    const parts = parseCSVLine(line)
    if (parts.length < 4) continue

    let hof_id = (parts[0] || '').trim()
    const surname = (parts[1] || 'Family').trim()
    const its_id = (parts[2] || '').trim()
    const full_name = (parts[3] || '').trim()
    const designation = (parts[4] || '').trim()
    const gender = (parts[5] || '').trim()

    // If HOF_ID is missing, fallback to the person's own ITS
    if (!hof_id && its_id) {
      hof_id = its_id
    }

    if (!its_id || !full_name) continue

    let relationship = designation
    if (designation.toUpperCase() === 'HOF') relationship = 'HOF'
    else if (designation.toUpperCase() === 'FM') relationship = 'Member'

    if (!familiesMap.has(hof_id)) {
      familiesMap.set(hof_id, surname || 'Family')
    }

    rawRows.push({
      hof_id,
      member_its: its_id,
      full_name,
      relationship: relationship || 'Member',
      gender: gender || null
    })
  }

  console.log(`\n📊 Parsed ${rawRows.length} total member rows across ${familiesMap.size} unique families.`)

  // Check Supabase connection and permissions
  const { data: testFamily, error: testErr } = await supabase
    .from('families')
    .select('id')
    .limit(1)

  if (testErr) {
    console.error('❌ Connection or RLS Error:', testErr)
    return
  }

  // Step 1: Upsert families in chunks of 500
  console.log(`\n⏳ Step 1/3: Upserting ${familiesMap.size} families...`)
  const familyList = Array.from(familiesMap.entries()).map(([hof_its, surname]) => ({
    hof_its,
    surname,
    is_manual: false
  }))

  const CHUNK_SIZE = 500
  for (let i = 0; i < familyList.length; i += CHUNK_SIZE) {
    const chunk = familyList.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase
      .from('families')
      .upsert(chunk, { onConflict: 'hof_its' })

    if (error) {
      console.error(`❌ Error upserting families batch ${i} - ${i + chunk.length}:`, error)
      return
    }
    process.stdout.write(`   Progress: ${Math.min(i + CHUNK_SIZE, familyList.length)} / ${familyList.length} families\r`)
  }
  console.log(`\n✅ Families upserted successfully!`)

  // Step 2: Fetch all family IDs mapped by hof_its
  console.log(`\n⏳ Step 2/3: Fetching family IDs mapping...`)
  const familyIdMap = new Map() // hof_its -> uuid
  let page = 0
  const PAGE_SIZE = 1000
  while (true) {
    const { data: fams, error: fErr } = await supabase
      .from('families')
      .select('id, hof_its')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (fErr) {
      console.error('❌ Error fetching families:', fErr)
      return
    }
    if (!fams || fams.length === 0) break

    for (const f of fams) {
      familyIdMap.set(f.hof_its, f.id)
    }
    if (fams.length < PAGE_SIZE) break
    page++
  }
  console.log(`✅ Loaded ${familyIdMap.size} family ID mappings.`)

  // Step 3: Insert members in chunks of 500
  console.log(`\n⏳ Step 3/3: Inserting ${rawRows.length} members...`)
  const memberRows = rawRows.map(r => ({
    family_id: familyIdMap.get(r.hof_id),
    member_its: r.member_its,
    full_name: r.full_name,
    relationship: r.relationship,
    gender: r.gender,
    mobile: null
  })).filter(r => r.family_id) // ensure valid family_id

  console.log(`Ready to insert ${memberRows.length} validated members.`)

  for (let i = 0; i < memberRows.length; i += CHUNK_SIZE) {
    const chunk = memberRows.slice(i, i + CHUNK_SIZE)
    const { error } = await supabase
      .from('family_members')
      .insert(chunk)

    if (error) {
      console.error(`❌ Error inserting members batch ${i} - ${i + chunk.length}:`, error)
      return
    }
    process.stdout.write(`   Progress: ${Math.min(i + CHUNK_SIZE, memberRows.length)} / ${memberRows.length} members\r`)
  }

  console.log(`\n\n🎉 ALL DONE! Successfully imported ${memberRows.length} members into Supabase!`)
}

run().catch(err => {
  console.error('Fatal error during import:', err)
})
