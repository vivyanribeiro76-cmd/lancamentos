import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL || 'imobadmin@fzia.com'
const password = process.env.ADMIN_PASSWORD || 'imob@123'

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

async function main(){
  try {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createErr && !String(createErr.message||'').includes('already registered')) {
      throw createErr
    }
    let userId = created?.user?.id
    if (!userId) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers()
      if (listErr) throw listErr
      const found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!found) throw new Error('User not found after create')
      userId = found.id
    }
    const { error: upErr } = await admin.from('user_profiles').upsert({ id: userId, role: 'admin' })
    if (upErr) throw upErr
    console.log('✅ Admin ready:', email)
  } catch (e) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
}
main()
