"use client"
import { useCallback, useMemo, useState } from "react"
import { useDropzone } from "react-dropzone"
import * as XLSX from "xlsx"
import { getSupabaseClient } from "@/lib/supabase"

interface ContactRow { number: string; name: string; another_var: string; email?: string }

function normalizeFileToRows(file: File): Promise<ContactRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Falha ao ler arquivo"))
    reader.onload = () => {
      try {
        const data = new Uint8Array(reader.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        // Validate required columns
        const required = ["number","name","another_var"]
        const hasAll = required.every((k) => Object.keys(json[0] || {}).map(x=>x.toString().trim().toLowerCase()).includes(k))
        if (!hasAll) throw new Error("Colunas obrigatórias: number, name, another_var")
        const rows: ContactRow[] = json.map((r:any)=>({
          number: String(r["number"]).trim(),
          name: String(r["name"]).trim(),
          another_var: String(r["another_var"]).trim(),
          email: r["email"] ? String(r["email"]).trim() : undefined,
        }))
        // another_var must equal number
        const invalid = rows.find(r=>r.number !== r.another_var)
        if (invalid) throw new Error("another_var deve ser exatamente igual ao number em todas as linhas")
        resolve(rows)
      } catch (e:any) {
        reject(e)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export function UploadPlanilha() {
  const supabase = getSupabaseClient()
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ContactRow[]>([])
  const [error, setError] = useState<string|null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [uploading, setUploading] = useState(false)
  const [history, setHistory] = useState<any[]>([])

  const onDrop = useCallback(async (accepted: File[]) => {
    setError(null)
    if (!accepted.length) return
    const f = accepted[0]
    if (f.size > 10 * 1024 * 1024) { setError("Arquivo acima de 10MB"); return }
    setFile(f)
    try {
      const parsed = await normalizeFileToRows(f)
      setRows(parsed)
    } catch (e:any) { setError(e.message || "Falha ao processar planilha") }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {".xlsx":[".xlsx"], ".xls":[".xls"], ".csv":[".csv"]}, multiple: false })

  const total = rows.length

  const handleConfirm = useCallback(async ()=>{
    if (!file || !total) { setError("Selecione um arquivo válido"); return }
    setUploading(true); setProgress(0); setError(null)
    try {
      // Check session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error("Faça login")

      // Create upload record
      const filePath = `${session.user.id}/${Date.now()}-${file.name}`
      // Upload file to storage (bucket gravacoes, pasta planilhas)
      const storageFilePath = `planilhas/${Date.now()}-${file.name}`
      const upRes = await supabase.storage.from("gravacoes").upload(storageFilePath, file, { upsert: false })
      if (upRes.error) throw upRes.error

      const { data: uploadInsert, error: upErr } = await supabase.from("uploads").insert({
        user_id: session.user.id,
        file_name: file.name,
        file_path: storageFilePath,
        file_url: storageFilePath,
      }).select("id").single()
      if (upErr) throw upErr

      // Insert planilha data in chunks
      const chunkSize = 500
      for (let i=0;i<rows.length;i+=chunkSize){
        const chunk = rows.slice(i, i+chunkSize).map(r=>({
          upload_id: uploadInsert.id,
          user_id: session.user.id,
          name: r.name,
          number: r.number,
          another_var: r.another_var,
        }))
        const { error } = await supabase.from("planilha_dados").insert(chunk)
        if (error) throw error
        setProgress(Math.round(((i+chunk.length)/rows.length)*100))
      }

      // Upload completed

      setHistory(prev=>[{ id: uploadInsert.id, file: file.name, total }, ...prev])
      setFile(null); setRows([]); setProgress(100)
    } catch (e:any) {
      setError(e.message || "Erro no envio")
    } finally {
      setUploading(false)
    }
  }, [file, rows, supabase, total])

  return (
    <div className="space-y-6">
      <div {...getRootProps()} className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${isDragActive?"bg-blue-50 border-blue-400":"bg-white"}`}>
        <input {...getInputProps()} />
        <p className="font-medium">Arraste e solte sua planilha aqui (.xlsx, .xls, .csv) ou clique para selecionar</p>
        <p className="text-sm text-gray-500">Tamanho máximo: 10MB. Colunas obrigatórias: number, name, another_var</p>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {file && (
        <div className="bg-white border rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">Pré-visualização</div>
              <div className="text-sm text-gray-600">Arquivo: {file.name} • Linhas: {total}</div>
            </div>
            <button onClick={handleConfirm} disabled={uploading} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">{uploading?`Enviando ${progress}%`:'Confirmar upload'}</button>
          </div>
          <div className="max-h-64 overflow-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr><th className="p-2 border-b">number</th><th className="p-2 border-b">name</th><th className="p-2 border-b">another_var</th><th className="p-2 border-b">email</th></tr>
              </thead>
              <tbody>
                {rows.slice(0,50).map((r,idx)=>(
                  <tr key={idx} className="odd:bg-gray-50">
                    <td className="p-2 border-b">{r.number}</td>
                    <td className="p-2 border-b">{r.name}</td>
                    <td className="p-2 border-b">{r.another_var}</td>
                    <td className="p-2 border-b">{r.email||'-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length>50 && <div className="text-xs text-gray-500 mt-2">Exibindo as 50 primeiras linhas</div>}
          </div>
        </div>
      )}

      {!!history.length && (
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-2">Histórico recente</div>
          <ul className="text-sm list-disc pl-5">
            {history.map(h=> (
              <li key={h.id}>Upload {h.id} • {h.file} • {h.total} contatos</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
