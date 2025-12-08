import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase envs missing' }, { status: 500 })
    }

    const admin = createClient(url, serviceKey)

    // Create (or get) user via Admin API
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createErr && createErr.message && !createErr.message.includes('already registered')) {
      return NextResponse.json({ error: createErr.message }, { status: 500 })
    }

    const userId = created?.user?.id
    if (!userId) {
      // user may already exist, fetch id
      const { data: list, error: listErr } = await admin.auth.admin.listUsers()
      if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
      const found = list.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (!found) return NextResponse.json({ error: 'user not found after create' }, { status: 500 })
      const client = createClient(url, serviceKey)
      const { error: upErr } = await client.from('user_profiles').upsert({ id: found.id, role: 'gestor' })
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      return NextResponse.json({ ok: true, id: found.id, existed: true })
    }

    // Upsert role
    const client = createClient(url, serviceKey)
    const { error: upErr } = await client.from('user_profiles').upsert({ id: userId, role: 'gestor' })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: userId, created: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown error' }, { status: 500 })
  }
}
