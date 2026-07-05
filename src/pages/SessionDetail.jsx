import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import MateriManager from '../components/MateriManager.jsx'
import SoalManager from '../components/SoalManager.jsx'
import ParticipantRoster from '../components/ParticipantRoster.jsx'

export default function SessionDetail() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [tab, setTab] = useState('materi')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      setSession(data)
    }
    load()
  }, [sessionId])

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const materiLink = session ? `${origin}/materi/${session.materi_code}` : ''
  const soalLink = session ? `${origin}/soal/${session.soal_code}` : ''

  const copy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 1500)
  }

  if (!session) {
    return (
      <div className="container">
        <p className="text-muted">Memuat sesi...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="container">
          <Link to="/admin" className="brand" style={{ textDecoration: 'none', color: '#fff' }}>
            <span className="dot" />
            Training Pro 2.0
          </Link>
        </div>
      </div>

      <div className="container">
        <div className="eyebrow">Sesi Training</div>
        <h2 className="mt-8">{session.title}</h2>

        <div className="card mt-16">
          <label className="field-label">Link Materi</label>
          <div className="link-box">
            <code>{materiLink}</code>
            <button className="btn btn-outline btn-sm" onClick={() => copy(materiLink, 'materi')}>
              {copied === 'materi' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
          <div className="field-label mt-16">Link Soal</div>
          <div className="link-box">
            <code>{soalLink}</code>
            <button className="btn btn-outline btn-sm" onClick={() => copy(soalLink, 'soal')}>
              {copied === 'soal' ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        <div className="tabs mt-16">
          <div className={`tab ${tab === 'materi' ? 'active' : ''}`} onClick={() => setTab('materi')}>
            Materi
          </div>
          <div className={`tab ${tab === 'soal' ? 'active' : ''}`} onClick={() => setTab('soal')}>
            Soal
          </div>
          <div className={`tab ${tab === 'peserta' ? 'active' : ''}`} onClick={() => setTab('peserta')}>
            Peserta
          </div>
        </div>

        {tab === 'materi' && <MateriManager sessionId={session.id} />}
        {tab === 'soal' && <SoalManager sessionId={session.id} />}
        {tab === 'peserta' && <ParticipantRoster sessionId={session.id} />}
      </div>
    </div>
  )
}

