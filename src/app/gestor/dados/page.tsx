"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

interface PlanilhaDado {
  id: string
  number: string
  name: string
  another_var: string
  created_at: string
  uploads: {
    file_name: string
  } | null
}

export default function DadosPlanilhaPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const [dados, setDados] = useState<PlanilhaDado[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadDados()
  }, [])

  async function loadDados() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/gestor/login")
        return
      }

      const { data, error } = await supabase
        .from("planilha_dados")
        .select(`
          id,
          number,
          name,
          another_var,
          created_at,
          uploads (
            file_name
          )
        `)
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDados((data || []).map(d => ({
        ...d,
        uploads: Array.isArray(d.uploads) && d.uploads.length > 0 ? d.uploads[0] : null
      })))
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDados = dados.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.number.includes(searchTerm) ||
      d.another_var.includes(searchTerm)
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/gestor/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dados das Planilhas</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nome, número ou another_var..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-4 text-sm text-gray-600">
            Total de registros: {filteredDados.length}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-3 font-semibold">Nome</th>
                  <th className="p-3 font-semibold">Número</th>
                  <th className="p-3 font-semibold">Another Var</th>
                  <th className="p-3 font-semibold">Planilha</th>
                  <th className="p-3 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {filteredDados.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum dado encontrado
                    </td>
                  </tr>
                ) : (
                  filteredDados.map((dado) => (
                    <tr key={dado.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{dado.name}</td>
                      <td className="p-3">{dado.number}</td>
                      <td className="p-3">{dado.another_var}</td>
                      <td className="p-3">{dado.uploads?.file_name || "-"}</td>
                      <td className="p-3">
                        {new Date(dado.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
