import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDateTime } from '../lib/utils.js'

export default function ParticipantRoster({ sessionId }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const { data } = await supabase
      .from('training_participants')
      .select('*')
      .eq('session_id', sessionId)
      .order('logged_in_at', { ascending: false })
    setParticipants(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()

    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_participants', filter: `session_id=eq.${sessionId}` },
        () => load()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const progressPercent = (p) => {
    let steps = 1 // logged in always counts
    if (p.materi_completed) steps++
    if (p.soal_completed) steps++
    return Math.round((steps / 3) * 100)
  }

  return (
    <div className="card">
      <div className="header-row" style={{ marginBottom: 0 }}>
        <h3>Peserta Live</h3>
        <span className="badge badge-success">
          <span className="pulse-dot" /> {participants.length} online / login
        </span>
      </div>

      {loading && <p className="text-muted mt-16">Memuat...</p>}

      {!loading && participants.length === 0 && (
        <div className="empty-state">
          <p>Belum ada peserta yang login. Bagikan link materi atau soal untuk mulai.</p>
        </div>
      )}

      <div className="mt-16">
        {participants.map((p) => (
          <div key={p.id} className="roster-row">
            <div className="roster-rail">
              <div className="roster-rail-fill" style={{ height: `${progressPercent(p)}%` }} />
            </div>
            <div className="roster-info">
              <div className="roster-name">{p.name}</div>
              <div className="roster-meta">
                {p.position} · {p.location}
              </div>
              <div className="roster-meta">Login {formatDateTime(p.logged_in_at)}</div>
              <div className="mt-8">
                <span className={`badge ${p.materi_completed ? 'badge-success' : 'badge-pending'}`}>
                  {p.materi_completed ? 'Materi selesai' : 'Materi belum'}
                </span>{' '}
                <span className={`badge ${p.soal_completed ? 'badge-success' : 'badge-pending'}`}>
                  {p.soal_completed ? 'Soal selesai' : 'Soal belum'}
                </span>
              </div>
            </div>
            {p.soal_completed && (
              <div className="roster-stats">
                <div className="roster-score">
                  {p.score}/{p.total_questions}
                </div>
                <div>benar</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

