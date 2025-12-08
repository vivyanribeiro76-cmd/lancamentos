"use client"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { UploadGravacoes } from "@/components/admin/UploadGravacoes"

export default function AdminUploadsPage(){
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(()=>{
    (async ()=>{
      const { data: { session } } = await supabase.auth.getSession()
      if(!session) return router.replace('/admin/login')
      setReady(true)
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const handleLogout = async ()=>{
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if(!ready) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Upload de Gravações (.wav)</h1>
        <button onClick={handleLogout} className="text-sm px-3 py-2 rounded bg-gray-800 text-white">Sair</button>
      </div>
      <UploadGravacoes />
    </div>
  )
}
