import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) dotenv.config({ path: envPath })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.EMAIL || 'fbapaes@gmail.com'
const newPassword = process.env.NEW_PASSWORD || 'imob@123'

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey)

async function main(){
  try {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers()
    if (listErr) throw listErr
    const user = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) throw new Error('User not found: ' + email)
    const { error: updErr } = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
    if (updErr) throw updErr
    console.log('✅ Password updated for', email)
  } catch (e) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
}
main()
