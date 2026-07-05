import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { supabase } from '../lib/supabase.js'
import { formatDateTime } from '../lib/utils.js'

export default function ParticipantRoster({ sessionId, sessionTitle }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef(null)

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
    let steps = 1
    if (p.materi_completed) steps++
    if (p.soal_completed) steps++
    return Math.round((steps / 3) * 100)
  }

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
      // small delay so the hidden template is fully laid out before capture
      await new Promise((resolve) => setTimeout(resolve, 50))
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      const safeTitle = (sessionTitle || 'hasil-training').replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      link.download = `${safeTitle}-hasil-peserta.jpg`
      link.href = canvas.toDataURL('image/jpeg', 0.95)
      link.click()
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="card">
      <div className="header-row" style={{ marginBottom: 0 }}>
        <h3>Peserta Live</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-success">
            <span className="pulse-dot" /> {participants.length} online / login
          </span>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleExport}
            disabled={exporting || participants.length === 0}
          >
            {exporting ? 'Mengekspor...' : 'Ekspor JPG'}
          </button>
        </div>
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

      {/* Hidden plain-styled template used only for JPG export.
          Uses hardcoded colors (no CSS variables) and no animations,
          since html2canvas can render those inconsistently. */}
      <div
        ref={exportRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: 640,
          background: '#ffffff',
          padding: 28,
          fontFamily: 'Inter, sans-serif',
          color: '#14213d',
        }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>
          {sessionTitle || 'Hasil Training'}
        </div>
        <div style={{ color: '#4a5578', fontSize: 13, marginTop: 4, marginBottom: 20 }}>
          Diekspor {formatDateTime(new Date().toISOString())}
        </div>

        {participants.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '14px 0',
              borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ color: '#4a5578', fontSize: 12.5, marginTop: 2 }}>
                {p.position} · {p.location}
              </div>
              <div style={{ color: '#4a5578', fontSize: 12.5, marginTop: 2 }}>
                Login {formatDateTime(p.logged_in_at)}
              </div>
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    marginRight: 6,
                    background: p.materi_completed ? '#e2f4ea' : '#fbe8c8',
                    color: p.materi_completed ? '#2f8a5c' : '#8a5c14',
                  }}
                >
                  {p.materi_completed ? 'Materi selesai' : 'Materi belum'}
                </span>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: p.soal_completed ? '#e2f4ea' : '#fbe8c8',
                    color: p.soal_completed ? '#2f8a5c' : '#8a5c14',
                  }}
                >
                  {p.soal_completed ? 'Soal selesai' : 'Soal belum'}
                </span>
              </div>
            </div>
            {p.soal_completed && (
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20 }}>
                  {p.score}/{p.total_questions}
                </div>
                <div style={{ color: '#4a5578', fontSize: 12 }}>benar</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
