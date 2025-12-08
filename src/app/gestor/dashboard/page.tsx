"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase"
import { UploadPlanilha } from "@/components/gestor/UploadPlanilha"

export default function GestorDashboardPage(){
  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(()=>{
    (async ()=>{
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) router.replace('/gestor/login')
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const handleLogout = async ()=>{
    await supabase.auth.signOut()
    router.replace('/gestor/login')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard do Gestor</h1>
        <button onClick={handleLogout} className="text-sm px-3 py-2 rounded bg-gray-800 text-white">Sair</button>
      </div>
      <UploadPlanilha />
    </div>
  )
}
