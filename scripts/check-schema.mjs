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

async function checkSchema() {
  console.log('\n=== Verificando estrutura da tabela user_profiles ===')
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Colunas disponíveis:', data.length > 0 ? Object.keys(data[0]) : 'Tabela vazia')
    console.log('Dados:', data)
  }

  console.log('\n=== Verificando auth.users ===')
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()
  
  if (authErr) {
    console.error('Erro:', authErr)
  } else {
    console.log(`Total de usuários: ${authData.users.length}`)
    authData.users.forEach(u => {
      console.log(`- ${u.email} (ID: ${u.id})`)
    })
  }
}

checkSchema().catch(console.error)
