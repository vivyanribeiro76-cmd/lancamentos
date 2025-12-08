import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Extract connection details from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)/)[1]
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

async function fixRLS() {
  console.log('Conectando ao banco de dados...\n')
  
  const sql = postgres(connectionString, {
    ssl: 'require'
  })

  try {
    console.log('Removendo políticas antigas...')
    await sql`DROP POLICY IF EXISTS "uploads_select" ON uploads`
    await sql`DROP POLICY IF EXISTS "uploads_insert" ON uploads`
    await sql`DROP POLICY IF EXISTS "recordings_select" ON recordings`
    await sql`DROP POLICY IF EXISTS "recordings_insert" ON recordings`
    console.log('✓ Políticas antigas removidas\n')

    console.log('Criando política: uploads_select')
    await sql`
      CREATE POLICY "uploads_select" ON uploads
      FOR SELECT
      USING (auth.uid() = user_id)
    `
    console.log('✓ uploads_select criada\n')

    console.log('Criando política: uploads_insert')
    await sql`
      CREATE POLICY "uploads_insert" ON uploads
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    `
    console.log('✓ uploads_insert criada\n')

    console.log('Criando política: recordings_select')
    await sql`
      CREATE POLICY "recordings_select" ON recordings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM uploads 
          WHERE uploads.id = recordings.upload_id 
          AND uploads.user_id = auth.uid()
        )
      )
    `
    console.log('✓ recordings_select criada\n')

    console.log('Criando política: recordings_insert')
    await sql`
      CREATE POLICY "recordings_insert" ON recordings
      FOR INSERT
      WITH CHECK (true)
    `
    console.log('✓ recordings_insert criada\n')

    console.log('✅ Todas as políticas RLS foram corrigidas com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await sql.end()
  }
}

fixRLS().catch(console.error)
