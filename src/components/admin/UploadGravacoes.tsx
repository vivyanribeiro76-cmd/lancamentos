"use client"
import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { getSupabaseClient } from "@/lib/supabase"

interface UploadItem {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export function UploadGravacoes() {
  const supabase = getSupabaseClient()
  const [uploads, setUploads] = useState<any[]>([])
  const [selectedUploadId, setSelectedUploadId] = useState<string>("")
  const [files, setFiles] = useState<UploadItem[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadUploads()
  }, [])

  const loadUploads = async () => {
    const { data } = await supabase.from('uploads').select('id, file_name, uploaded_at').order('uploaded_at', { ascending: false }).limit(50)
    setUploads(data || [])
  }

  const onDrop = useCallback((accepted: File[]) => {
    const validFiles = accepted.filter(f => {
      if (f.size > 20 * 1024 * 1024) return false
      if (!f.name.toLowerCase().endsWith('.wav')) return false
      return true
    })
    setFiles(prev => [...prev, ...validFiles.map(f => ({ file: f, progress: 0, status: 'pending' as const }))])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'audio/wav': ['.wav'] }, 
    multiple: true 
  })

  const handleUpload = async () => {
    if (!selectedUploadId || files.length === 0) return
    setUploading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { alert('Faça login'); setUploading(false); return }

    for (let i = 0; i < files.length; i++) {
      const item = files[i]
      setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f))
      try {
        const filePath = `${selectedUploadId}/${Date.now()}-${item.file.name}`
        const { error: upErr } = await supabase.storage.from('gravacoes').upload(filePath, item.file, { upsert: false })
        if (upErr) throw upErr

        const { error: insErr } = await supabase.from('recordings').insert({
          upload_id: selectedUploadId,
          contact_phone: null,
          file_name: item.file.name,
          file_url: filePath,
          duration: null
        })
        if (insErr) throw insErr

        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'done', progress: 100 } : f))
      } catch (e: any) {
        setFiles(prev => prev.map((f, idx) => idx === i ? { ...f, status: 'error', error: e.message } : f))
      }
    }
    setUploading(false)
  }

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Selecionar Planilha</label>
        <select value={selectedUploadId} onChange={e => setSelectedUploadId(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">-- Escolha uma planilha --</option>
          {uploads.map(u => (
            <option key={u.id} value={u.id}>{u.file_name} ({new Date(u.uploaded_at).toLocaleDateString()})</option>
          ))}
        </select>
      </div>

      <div {...getRootProps()} className={`border-2 border-dashed rounded p-8 text-center cursor-pointer ${isDragActive ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}>
        <input {...getInputProps()} />
        <p className="font-medium">Arraste arquivos .wav aqui ou clique para selecionar</p>
        <p className="text-sm text-gray-500">Tamanho máximo: 20MB por arquivo</p>
      </div>

      {files.length > 0 && (
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Arquivos ({files.length})</div>
            <button onClick={handleUpload} disabled={uploading || !selectedUploadId} className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
              {uploading ? 'Enviando...' : 'Confirmar upload'}
            </button>
          </div>
          <div className="space-y-2">
            {files.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{item.file.name}</div>
                  <div className="text-xs text-gray-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center gap-2">
                  {item.status === 'pending' && <span className="text-gray-500">Aguardando</span>}
                  {item.status === 'uploading' && <span className="text-blue-600">Enviando...</span>}
                  {item.status === 'done' && <span className="text-green-600">✓ Concluído</span>}
                  {item.status === 'error' && <span className="text-red-600">Erro: {item.error}</span>}
                  {item.status === 'pending' && <button onClick={() => removeFile(idx)} className="text-red-600 text-xs">Remover</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
