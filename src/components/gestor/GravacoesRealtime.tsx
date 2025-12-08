"use client"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase"

interface Recording {
  id: string
  upload_id: string
  file_name: string
  file_url: string
  uploaded_at: string
  upload?: { file_name: string }
}

export function GravacoesRealtime() {
  const supabase = getSupabaseClient()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [uploads, setUploads] = useState<any[]>([])
  const [selectedUploadId, setSelectedUploadId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string | null>(null)

  useEffect(() => {
    loadInitialData()
    const channel = supabase
      .channel('recordings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recordings' }, () => {
        loadInitialData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    console.log('[DEBUG] User ID:', session.user.id)

    // Load user's uploads (planilhas do gestor)
    const { data: uploadsData, error: uploadsError } = await supabase
      .from('uploads')
      .select('id, file_name, uploaded_at')
      .eq('user_id', session.user.id)
      .order('uploaded_at', { ascending: false })
    
    console.log('[DEBUG] Uploads:', uploadsData, 'Error:', uploadsError)
    
    const userUploadIds = (uploadsData || []).map(u => u.id)

    if (userUploadIds.length === 0) {
      console.log('[DEBUG] Nenhum upload encontrado')
      setRecordings([])
      setUploads([])
      setLoading(false)
      return
    }

    console.log('[DEBUG] Upload IDs:', userUploadIds)

    // Load ALL recordings for user's uploads
    const { data: recordingsData, error: recordingsError } = await supabase
      .from('recordings')
      .select('*, upload:uploads(file_name)')
      .in('upload_id', userUploadIds)
      .order('uploaded_at', { ascending: false })

    console.log('[DEBUG] Recordings:', recordingsData, 'Error:', recordingsError)

    setRecordings(recordingsData || [])

    // Build uploads list from recordings (to show only planilhas with recordings)
    const uploadsWithRecordings = uploadsData?.filter(u => 
      (recordingsData || []).some(r => r.upload_id === u.id)
    ) || []
    
    console.log('[DEBUG] Uploads com recordings:', uploadsWithRecordings)
    
    setUploads(uploadsWithRecordings)
    setLoading(false)
  }

  useEffect(() => {
    applyFilters()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUploadId, startDate, endDate])

  const applyFilters = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: uploadsData } = await supabase
      .from('uploads')
      .select('id, file_name, uploaded_at')
      .eq('user_id', session.user.id)
      .order('uploaded_at', { ascending: false })
    
    const userUploadIds = (uploadsData || []).map(u => u.id)
    if (userUploadIds.length === 0) return

    let query = supabase
      .from('recordings')
      .select('*, upload:uploads(file_name)')
      .in('upload_id', userUploadIds)
      .order('uploaded_at', { ascending: false })

    if (selectedUploadId) query = query.eq('upload_id', selectedUploadId)
    if (startDate) query = query.gte('uploaded_at', new Date(startDate).toISOString())
    if (endDate) query = query.lte('uploaded_at', new Date(endDate + 'T23:59:59').toISOString())

    const { data: recordingsData } = await query
    setRecordings(recordingsData || [])
  }

  const getAudioUrl = async (fileUrl: string) => {
    const { data } = await supabase.storage.from('gravacoes').createSignedUrl(fileUrl, 3600)
    return data?.signedUrl || ''
  }

  const handlePlay = async (rec: Recording) => {
    if (playingId === rec.id) {
      setPlayingId(null)
      return
    }
    setPlayingId(rec.id)
  }

  const handleDownload = async (rec: Recording) => {
    const url = await getAudioUrl(rec.file_url)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = rec.file_name
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded p-4 space-y-3">
        <div className="font-semibold">Filtros</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm mb-1">Planilha</label>
            <select value={selectedUploadId} onChange={e => setSelectedUploadId(e.target.value)} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Todas</option>
              {uploads.map(u => (
                <option key={u.id} value={u.id}>{u.file_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Data inicial</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm mb-1">Data final</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>
      </div>

      {loading && <div className="text-center text-gray-500">Carregando...</div>}

      {!loading && recordings.length === 0 && (
        <div className="text-center text-gray-500 py-8">Nenhuma gravação encontrada</div>
      )}

      {!loading && recordings.length > 0 && (
        <div className="bg-white border rounded p-4">
          <div className="font-semibold mb-3">Gravações ({recordings.length})</div>
          <div className="space-y-2">
            {recordings.map(rec => (
              <RecordingItem 
                key={rec.id} 
                recording={rec} 
                isPlaying={playingId === rec.id}
                onPlay={() => handlePlay(rec)}
                onDownload={() => handleDownload(rec)}
                getAudioUrl={getAudioUrl}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RecordingItem({ recording, isPlaying, onPlay, onDownload, getAudioUrl }: {
  recording: Recording
  isPlaying: boolean
  onPlay: () => void
  onDownload: () => void
  getAudioUrl: (url: string) => Promise<string>
}) {
  const [audioUrl, setAudioUrl] = useState<string>("")

  useEffect(() => {
    if (isPlaying && !audioUrl) {
      getAudioUrl(recording.file_url).then(setAudioUrl)
    }
  }, [isPlaying, audioUrl, recording.file_url, getAudioUrl])

  return (
    <div className="border rounded p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{recording.file_name}</div>
          <div className="text-xs text-gray-500">
            Planilha: {recording.upload?.file_name || 'N/A'} • {new Date(recording.uploaded_at).toLocaleString('pt-BR')}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onPlay} className="text-xs px-3 py-1 rounded bg-blue-600 text-white">
            {isPlaying ? 'Pausar' : 'Ouvir'}
          </button>
          <button onClick={onDownload} className="text-xs px-3 py-1 rounded bg-gray-600 text-white">
            Baixar
          </button>
        </div>
      </div>
      {isPlaying && audioUrl && (
        <audio controls autoPlay className="w-full" src={audioUrl} />
      )}
    </div>
  )
}
