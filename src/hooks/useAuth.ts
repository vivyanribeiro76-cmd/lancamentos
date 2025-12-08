"use client"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"

export type Role = 'admin' | 'gestor' | null

export function useAuth() {
  const supabase = getSupabaseClient()
  const [user, setUser] = useState<ReturnType<typeof supabase.auth.getUser> extends Promise<{ data: { user: infer U } }> ? U | null : any>(null)
  const [role, setRole] = useState<Role>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      if (session?.user) {
        setUser(session.user)
        // try to fetch role
        const { data } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
        setRole((data?.role as Role) ?? null)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    }
    load()
    const { data: sub } = supabase.auth.onAuthStateChange(() => load())
    return () => { mounted = false; sub.subscription.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }
  const logout = async () => {
    await supabase.auth.signOut()
  }

  return { user, role, loading, login, logout }
}
