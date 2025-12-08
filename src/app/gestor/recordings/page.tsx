"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { GravacoesRealtime } from "@/components/gestor/GravacoesRealtime"

export default function GestorRecordingsPage(){
  const router = useRouter()
  const supabase = getSupabaseClient()
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    (async ()=>{
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) router.replace('/gestor/login')
      else setReady(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const handleLogout = async ()=>{
    await supabase.auth.signOut()
    router.replace('/gestor/login')
  }

  if(!ready) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Gravações</h1>
        <button onClick={handleLogout} className="text-sm px-3 py-2 rounded bg-gray-800 text-white">Sair</button>
      </div>
      <GravacoesRealtime />
    </div>
  )
}
