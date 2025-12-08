import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function fixRLS() {
  console.log('Corrigindo políticas RLS...\n')

  // First, let's check current policies
  console.log('Verificando políticas atuais...')
  const { data: currentPolicies, error: checkError } = await supabase
    .from('pg_policies')
    .select('*')
    .or('tablename.eq.uploads,tablename.eq.recordings')
  
  if (!checkError && currentPolicies) {
    console.log('Políticas encontradas:', currentPolicies.length)
  }

  // The issue is that we need direct SQL access
  // Let's try a different approach: disable RLS temporarily and check data
  console.log('\n⚠️  Não é possível executar SQL DDL via Supabase JS Client.')
  console.log('\nPor favor, execute manualmente no Supabase Dashboard:')
  console.log('1. Acesse: https://supabase.com/dashboard')
  console.log('2. Selecione seu projeto')
  console.log('3. Vá em SQL Editor')
  console.log('4. Cole e execute o SQL abaixo:\n')
  
  const sql = `
-- Drop existing policies
DROP POLICY IF EXISTS "uploads_select" ON uploads;
DROP POLICY IF EXISTS "uploads_insert" ON uploads;
DROP POLICY IF EXISTS "recordings_select" ON recordings;
DROP POLICY IF EXISTS "recordings_insert" ON recordings;

-- Allow users to see their own uploads
CREATE POLICY "uploads_select" ON uploads
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own uploads
CREATE POLICY "uploads_insert" ON uploads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to see recordings linked to their uploads
CREATE POLICY "recordings_select" ON recordings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM uploads 
    WHERE uploads.id = recordings.upload_id 
    AND uploads.user_id = auth.uid()
  )
);

-- Allow anyone authenticated to insert recordings (admin)
CREATE POLICY "recordings_insert" ON recordings
FOR INSERT
WITH CHECK (true);
`
  
  console.log(sql)
  console.log('\n5. Após executar, recarregue a página /gestor/recordings')
}

fixRLS().catch(console.error)
