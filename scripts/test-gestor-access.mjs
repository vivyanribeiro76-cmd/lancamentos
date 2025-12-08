import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testGestorAccess() {
  console.log('\n=== TESTE: Login como Gestor ===\n')
  
  // Login como gestor
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'fbapaes@gmail.com',
    password: 'imob@123'
  })
  
  if (authError) {
    console.error('❌ Erro no login:', authError.message)
    return
  }
  
  console.log('✓ Login OK')
  console.log('User ID:', authData.user.id)
  
  // Testar query de uploads
  console.log('\n=== Testando query de uploads ===')
  const { data: uploads, error: uploadsError } = await supabase
    .from('uploads')
    .select('id, file_name, uploaded_at')
    .eq('user_id', authData.user.id)
  
  console.log('Erro:', uploadsError ? uploadsError.message : 'Nenhum')
  console.log('Uploads retornados:', uploads?.length || 0)
  if (uploads && uploads.length > 0) {
    uploads.forEach(u => console.log(`  - ${u.file_name} (${u.id})`))
  } else {
    console.log('  ❌ PROBLEMA: Nenhum upload retornado!')
  }
  
  // Testar query de recordings
  if (uploads && uploads.length > 0) {
    console.log('\n=== Testando query de recordings ===')
    const uploadIds = uploads.map(u => u.id)
    const { data: recordings, error: recError } = await supabase
      .from('recordings')
      .select('*, upload:uploads(file_name)')
      .in('upload_id', uploadIds)
    
    console.log('Erro:', recError ? recError.message : 'Nenhum')
    console.log('Recordings retornadas:', recordings?.length || 0)
    if (recordings && recordings.length > 0) {
      recordings.forEach(r => console.log(`  - ${r.file_name}`))
    } else {
      console.log('  ❌ PROBLEMA: Nenhuma recording retornada!')
    }
  }
  
  await supabase.auth.signOut()
}

testGestorAccess().catch(console.error)
