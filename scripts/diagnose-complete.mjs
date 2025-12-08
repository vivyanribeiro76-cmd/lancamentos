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

async function diagnose() {
  console.log('\n========================================')
  console.log('DIAGNÓSTICO COMPLETO')
  console.log('========================================\n')

  // 1. Verificar usuários
  console.log('1. USUÁRIOS AUTH:')
  const { data: { users } } = await supabase.auth.admin.listUsers()
  users.forEach(u => {
    console.log(`   - ${u.email} (ID: ${u.id})`)
  })

  const gestorUser = users.find(u => u.email === 'fbapaes@gmail.com')
  const gestorId = gestorUser?.id

  console.log(`\n   Gestor ID: ${gestorId}`)

  // 2. Verificar uploads
  console.log('\n2. UPLOADS (todos):')
  const { data: allUploads } = await supabase
    .from('uploads')
    .select('*')
  
  console.log(`   Total: ${allUploads?.length || 0}`)
  allUploads?.forEach(u => {
    console.log(`   - ${u.file_name}`)
    console.log(`     ID: ${u.id}`)
    console.log(`     User ID: ${u.user_id}`)
    console.log(`     Match gestor: ${u.user_id === gestorId ? 'SIM ✓' : 'NÃO ✗'}`)
  })

  // 3. Verificar recordings
  console.log('\n3. RECORDINGS (todos):')
  const { data: allRecordings } = await supabase
    .from('recordings')
    .select('*')
  
  console.log(`   Total: ${allRecordings?.length || 0}`)
  allRecordings?.forEach(r => {
    console.log(`   - ${r.file_name}`)
    console.log(`     Upload ID: ${r.upload_id}`)
    const linkedUpload = allUploads?.find(u => u.id === r.upload_id)
    console.log(`     Planilha: ${linkedUpload?.file_name || 'NÃO ENCONTRADA'}`)
  })

  // 4. Testar query como gestor
  console.log('\n4. TESTE: Query como gestor faria:')
  const { data: gestorUploads, error: gestorError } = await supabase
    .from('uploads')
    .select('id, file_name')
    .eq('user_id', gestorId)
  
  console.log(`   Erro: ${gestorError ? gestorError.message : 'Nenhum'}`)
  console.log(`   Uploads retornados: ${gestorUploads?.length || 0}`)
  gestorUploads?.forEach(u => {
    console.log(`   - ${u.file_name} (${u.id})`)
  })

  if (gestorUploads && gestorUploads.length > 0) {
    const uploadIds = gestorUploads.map(u => u.id)
    const { data: gestorRecordings, error: recError } = await supabase
      .from('recordings')
      .select('*, upload:uploads(file_name)')
      .in('upload_id', uploadIds)
    
    console.log(`\n   Recordings para esses uploads:`)
    console.log(`   Erro: ${recError ? recError.message : 'Nenhum'}`)
    console.log(`   Total: ${gestorRecordings?.length || 0}`)
    gestorRecordings?.forEach(r => {
      console.log(`   - ${r.file_name}`)
      console.log(`     Planilha: ${r.upload?.file_name}`)
    })
  }

  // 5. Verificar RLS policies
  console.log('\n5. POLÍTICAS RLS ATIVAS:')
  const { data: policies } = await supabase
    .rpc('exec_sql', { sql: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename IN ('uploads', 'recordings')
      ORDER BY tablename, policyname
    `})
    .catch(() => ({ data: null }))
  
  if (policies) {
    console.log('   Políticas encontradas via RPC')
  } else {
    console.log('   Não foi possível verificar via RPC')
  }

  console.log('\n========================================')
  console.log('FIM DO DIAGNÓSTICO')
  console.log('========================================\n')
}

diagnose().catch(console.error)
