import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ParticipantLogin from '../components/ParticipantLogin.jsx'

export default function MateriViewer() {
  const { code } = useParams()
  const [session, setSession] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [participant, setParticipant] = useState(null)
  const [materials, setMaterials] = useState([])
  const [pageIndex, setPageIndex] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('materi_code', code)
        .maybeSingle()
      if (!data) {
        setNotFound(true)
        return
      }
      setSession(data)
      const { data: mats } = await supabase
        .from('training_materials')
        .select('*')
        .eq('session_id', data.id)
        .order('page_number', { ascending: true })
      setMaterials(mats || [])
    }
    load()
  }, [code])

  const markCompleted = async () => {
    if (!participant) return
    await supabase
      .from('training_participants')
      .update({ materi_completed: true })
      .eq('id', participant.id)
    setDone(true)
  }

  const goNext = () => {
    if (pageIndex < materials.length - 1) {
      setPageIndex((i) => i + 1)
    } else {
      markCompleted()
    }
  }

  const goPrev = () => {
    if (pageIndex > 0) setPageIndex((i) => i - 1)
  }

  if (notFound) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Link materi tidak ditemukan. Periksa kembali link yang diberikan instruktur.</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container">
        <p className="text-muted">Memuat...</p>
      </div>
    )
  }

  if (!participant) {
    return (
      <ParticipantLogin
        sessionId={session.id}
        sessionTitle={session.title}
        onLoggedIn={setParticipant}
      />
    )
  }

  if (materials.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Materi belum tersedia untuk sesi ini.</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="container">
        <div className="result-hero card">
          <div className="eyebrow">Selesai</div>
          <h2 className="mt-8">Materi telah selesai dibaca</h2>
          <p className="text-muted mt-8">Terima kasih, {participant.name}. Silakan lanjut ke link soal jika tersedia.</p>
        </div>
      </div>
    )
  }

  const page = materials[pageIndex]

  return (
    <div className="container">
      <div className="eyebrow">{session.title}</div>
      <h3 className="mt-8">{page.title || `Halaman ${pageIndex + 1}`}</h3>

      <div className="card mt-16">
        {page.type === 'text' && <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{page.content}</p>}
        {page.type === 'image' && <img className="materi-image" src={page.content} alt={page.title || 'materi'} />}
        {page.type === 'pdf' && <iframe className="materi-pdf" src={page.content} title={page.title || 'materi'} />}
      </div>

      <div className="page-dots">
        {materials.map((_, i) => (
          <span key={i} className={i === pageIndex ? 'active' : ''} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-outline" onClick={goPrev} disabled={pageIndex === 0} style={{ flex: 1 }}>
          Sebelumnya
        </button>
        <button className="btn btn-accent" onClick={goNext} style={{ flex: 1 }}>
          {pageIndex < materials.length - 1 ? 'Selanjutnya' : 'Selesai'}
        </button>
      </div>
    </div>
  )
}
