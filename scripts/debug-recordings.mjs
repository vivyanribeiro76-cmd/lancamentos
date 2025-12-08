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

async function debug() {
  console.log('\n=== DEBUG: Uploads ===')
  const { data: uploads, error: uploadsErr } = await supabase
    .from('uploads')
    .select('id, user_id, file_name, uploaded_at')
    .order('uploaded_at', { ascending: false })
  
  if (uploadsErr) {
    console.error('Erro ao buscar uploads:', uploadsErr)
  } else {
    console.log(`Total de uploads: ${uploads.length}`)
    uploads.forEach(u => {
      console.log(`- ${u.file_name} (ID: ${u.id}, User: ${u.user_id})`)
    })
  }

  console.log('\n=== DEBUG: Recordings ===')
  const { data: recordings, error: recErr } = await supabase
    .from('recordings')
    .select('id, upload_id, file_name, uploaded_at')
    .order('uploaded_at', { ascending: false })
  
  if (recErr) {
    console.error('Erro ao buscar recordings:', recErr)
  } else {
    console.log(`Total de recordings: ${recordings.length}`)
    recordings.forEach(r => {
      console.log(`- ${r.file_name} (Upload ID: ${r.upload_id})`)
    })
  }

  console.log('\n=== DEBUG: User Profiles ===')
  const { data: profiles, error: profErr } = await supabase
    .from('user_profiles')
    .select('user_id, role, email')
  
  if (profErr) {
    console.error('Erro ao buscar profiles:', profErr)
  } else {
    console.log(`Total de profiles: ${profiles.length}`)
    profiles.forEach(p => {
      console.log(`- ${p.email} (Role: ${p.role}, User ID: ${p.user_id})`)
    })
  }

  console.log('\n=== DEBUG: Gestor fbapaes@gmail.com ===')
  const { data: gestorProfile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('email', 'fbapaes@gmail.com')
    .single()
  
  if (gestorProfile) {
    console.log(`User ID do gestor: ${gestorProfile.user_id}`)
    
    const { data: gestorUploads } = await supabase
      .from('uploads')
      .select('id, file_name')
      .eq('user_id', gestorProfile.user_id)
    
    console.log(`Uploads do gestor: ${gestorUploads?.length || 0}`)
    gestorUploads?.forEach(u => console.log(`  - ${u.file_name} (ID: ${u.id})`))
    
    if (gestorUploads && gestorUploads.length > 0) {
      const uploadIds = gestorUploads.map(u => u.id)
      const { data: gestorRecordings } = await supabase
        .from('recordings')
        .select('id, file_name, upload_id')
        .in('upload_id', uploadIds)
      
      console.log(`Recordings vinculadas aos uploads do gestor: ${gestorRecordings?.length || 0}`)
      gestorRecordings?.forEach(r => console.log(`  - ${r.file_name} (Upload ID: ${r.upload_id})`))
    }
  }
}

debug().catch(console.error)
