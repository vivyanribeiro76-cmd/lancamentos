import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aopbzryufcpsawaweico.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcGJ6cnl1ZmNwc2F3YXdlaWNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTE4NjUxNCwiZXhwIjoyMDQ0NzYyNTE0fQ.KoacMPJPj3xqauphjtDfVRklynQoQ-lE805lsM9LpGs'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUploads() {
  console.log('🔍 Verificando uploads...\n')

  // Buscar todos os uploads
  const { data: uploads, error } = await supabase
    .from('uploads')
    .select('*')

  if (error) {
    console.error('❌ Erro ao buscar uploads:', error)
    return
  }

  console.log(`📊 Total de uploads: ${uploads?.length || 0}\n`)

  if (uploads && uploads.length > 0) {
    console.log('📋 Uploads encontrados:')
    uploads.forEach((u, idx) => {
      console.log(`\n${idx + 1}. ID: ${u.id}`)
      console.log(`   Nome: ${u.file_name}`)
      console.log(`   User ID: ${u.user_id}`)
      console.log(`   Created At: ${u.created_at}`)
      console.log(`   File Path: ${u.file_path}`)
      console.log(`   File URL: ${u.file_url}`)
    })
  } else {
    console.log('⚠️ Nenhum upload encontrado!')
  }

  // Verificar planilha_dados
  const { data: planilhaDados, error: pdError } = await supabase
    .from('planilha_dados')
    .select('upload_id')
    .limit(5)

  if (!pdError && planilhaDados) {
    console.log(`\n📊 Total de registros em planilha_dados: ${planilhaDados.length}`)
  }
}

checkUploads()
