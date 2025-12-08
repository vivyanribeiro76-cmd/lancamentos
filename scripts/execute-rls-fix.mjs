import postgres from 'postgres'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

// Você precisa adicionar SUPABASE_DB_PASSWORD no .env.local
// Pegue em: Supabase Dashboard > Project Settings > Database > Connection string
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const projectRef = supabaseUrl.replace('https://', '').split('.')[0]

// Connection string format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
const connectionString = process.env.DATABASE_URL || `postgresql://postgres.${projectRef}:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

async function fixRLS() {
  console.log('Conectando ao banco de dados PostgreSQL...\n')
  
  if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.error('❌ ERRO: Adicione DATABASE_URL no .env.local')
    console.log('\nPegue a connection string em:')
    console.log('Supabase Dashboard > Project Settings > Database > Connection string (Pooler)')
    console.log('\nAdicione no .env.local:')
    console.log('DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres')
    return
  }

  const sql = postgres(connectionString, {
    ssl: 'require',
    max: 1
  })

  try {
    console.log('Removendo políticas antigas...')
    await sql.unsafe(`DROP POLICY IF EXISTS "uploads_select" ON uploads`)
    await sql.unsafe(`DROP POLICY IF EXISTS "uploads_insert" ON uploads`)
    await sql.unsafe(`DROP POLICY IF EXISTS "recordings_select" ON recordings`)
    await sql.unsafe(`DROP POLICY IF EXISTS "recordings_insert" ON recordings`)
    console.log('✓ Políticas antigas removidas\n')

    console.log('Criando política: uploads_select')
    await sql.unsafe(`
      CREATE POLICY "uploads_select" ON uploads
      FOR SELECT
      USING (auth.uid() = user_id)
    `)
    console.log('✓ uploads_select criada\n')

    console.log('Criando política: uploads_insert')
    await sql.unsafe(`
      CREATE POLICY "uploads_insert" ON uploads
      FOR INSERT
      WITH CHECK (auth.uid() = user_id)
    `)
    console.log('✓ uploads_insert criada\n')

    console.log('Criando política: recordings_select')
    await sql.unsafe(`
      CREATE POLICY "recordings_select" ON recordings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM uploads 
          WHERE uploads.id = recordings.upload_id 
          AND uploads.user_id = auth.uid()
        )
      )
    `)
    console.log('✓ recordings_select criada\n')

    console.log('Criando política: recordings_insert')
    await sql.unsafe(`
      CREATE POLICY "recordings_insert" ON recordings
      FOR INSERT
      WITH CHECK (true)
    `)
    console.log('✓ recordings_insert criada\n')

    console.log('✅ Todas as políticas RLS foram corrigidas com sucesso!')
    console.log('\nRecarregue http://localhost:3010/gestor/recordings')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('\nSe o erro persistir, execute manualmente no Supabase Dashboard SQL Editor')
  } finally {
    await sql.end()
  }
}

fixRLS().catch(console.error)
