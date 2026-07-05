import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const storageKey = (sessionId) => `tp_participant_${sessionId}`

export default function ParticipantLogin({ sessionId, sessionTitle, onLoggedIn }) {
  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const restore = async () => {
      const savedId = localStorage.getItem(storageKey(sessionId))
      if (savedId) {
        const { data } = await supabase
          .from('training_participants')
          .select('*')
          .eq('id', savedId)
          .maybeSingle()
        if (data) {
          onLoggedIn(data)
          return
        }
      }
      setChecking(false)
    }
    restore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !position.trim() || !location.trim()) return
    setSubmitting(true)
    setError('')
    const { data, error: insertError } = await supabase
      .from('training_participants')
      .insert({
        session_id: sessionId,
        name: name.trim(),
        position: position.trim(),
        location: location.trim(),
      })
      .select()
      .single()

    if (insertError) {
      setError('Gagal masuk, coba lagi.')
      setSubmitting(false)
      return
    }

    localStorage.setItem(storageKey(sessionId), data.id)
    onLoggedIn(data)
  }

  if (checking) {
    return (
      <div className="container">
        <div className="card">
          <p className="text-muted">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card">
        <div className="eyebrow">Absensi Peserta</div>
        <h2 className="mt-8">{sessionTitle || 'Training'}</h2>
        <p className="text-muted mt-8">
          Isi data berikut untuk melanjutkan. Data kamu akan langsung tercatat pada instruktur.
        </p>
        <form onSubmit={handleSubmit} className="mt-16">
          <div className="field">
            <label className="field-label">Nama Lengkap</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Jabatan</label>
            <input
              className="input"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Contoh: Staff Operasional"
              required
            />
          </div>
          <div className="field">
            <label className="field-label">Lokasi Kerja</label>
            <input
              className="input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Cabang Surabaya"
              required
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{error}</p>}
          <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

