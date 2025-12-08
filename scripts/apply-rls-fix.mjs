import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function executeSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify({ query: sql })
  })
  
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`SQL execution failed: ${response.status} ${text}`)
  }
  
  return response.json()
}

async function fixRLS() {
  console.log('Aplicando correções RLS...\n')

  const policies = [
    {
      name: 'Drop policies',
      sql: `
        DROP POLICY IF EXISTS "uploads_select" ON uploads;
        DROP POLICY IF EXISTS "uploads_insert" ON uploads;
        DROP POLICY IF EXISTS "recordings_select" ON recordings;
        DROP POLICY IF EXISTS "recordings_insert" ON recordings;
      `
    },
    {
      name: 'uploads_select',
      sql: `CREATE POLICY "uploads_select" ON uploads FOR SELECT USING (auth.uid() = user_id);`
    },
    {
      name: 'uploads_insert',
      sql: `CREATE POLICY "uploads_insert" ON uploads FOR INSERT WITH CHECK (auth.uid() = user_id);`
    },
    {
      name: 'recordings_select',
      sql: `CREATE POLICY "recordings_select" ON recordings FOR SELECT USING (EXISTS (SELECT 1 FROM uploads WHERE uploads.id = recordings.upload_id AND uploads.user_id = auth.uid()));`
    },
    {
      name: 'recordings_insert',
      sql: `CREATE POLICY "recordings_insert" ON recordings FOR INSERT WITH CHECK (true);`
    }
  ]

  for (const policy of policies) {
    try {
      console.log(`Executando: ${policy.name}...`)
      await executeSQL(policy.sql)
      console.log(`✓ ${policy.name}`)
    } catch (err) {
      console.error(`✗ ${policy.name}:`, err.message)
    }
  }

  console.log('\nConcluído!')
}

fixRLS().catch(console.error)
