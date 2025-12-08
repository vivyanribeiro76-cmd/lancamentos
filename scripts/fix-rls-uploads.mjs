import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixRLS() {
  console.log('Corrigindo políticas RLS para uploads...')

  // Drop existing policies
  await supabase.rpc('exec_sql', {
    sql: `
      DROP POLICY IF EXISTS "uploads_select" ON uploads;
      DROP POLICY IF EXISTS "uploads_insert" ON uploads;
      DROP POLICY IF EXISTS "recordings_select" ON recordings;
      DROP POLICY IF EXISTS "recordings_insert" ON recordings;
    `
  }).catch(() => {})

  // Create new policies for uploads
  const { error: uploadsSelectErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "uploads_select" ON uploads
      FOR SELECT
      USING (auth.uid() = user_id);
    `
  })

  if (uploadsSelectErr) {
    console.error('Erro ao criar policy uploads_select:', uploadsSelectErr)
  } else {
    console.log('✓ Policy uploads_select criada')
  }

  const { error: uploadsInsertErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "uploads_insert" ON uploads
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    `
  })

  if (uploadsInsertErr) {
    console.error('Erro ao criar policy uploads_insert:', uploadsInsertErr)
  } else {
    console.log('✓ Policy uploads_insert criada')
  }

  // Create new policies for recordings (allow all authenticated users to see recordings of their uploads)
  const { error: recordingsSelectErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "recordings_select" ON recordings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM uploads 
          WHERE uploads.id = recordings.upload_id 
          AND uploads.user_id = auth.uid()
        )
      );
    `
  })

  if (recordingsSelectErr) {
    console.error('Erro ao criar policy recordings_select:', recordingsSelectErr)
  } else {
    console.log('✓ Policy recordings_select criada')
  }

  const { error: recordingsInsertErr } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "recordings_insert" ON recordings
      FOR INSERT
      WITH CHECK (true);
    `
  })

  if (recordingsInsertErr) {
    console.error('Erro ao criar policy recordings_insert:', recordingsInsertErr)
  } else {
    console.log('✓ Policy recordings_insert criada (admin pode inserir)')
  }

  console.log('\nPolíticas RLS corrigidas!')
}

fixRLS().catch(console.error)
