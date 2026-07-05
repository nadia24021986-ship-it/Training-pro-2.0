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

  const resultLabel = (p) => (p.soal_completed ? `${p.score}/${p.total_questions} benar` : 'Belum selesai')

  const handleExport = async () => {
    if (!exportRef.current) return
    setExporting(true)
    try {
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
            <span className="pulse-dot" /> {participants.length} login
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

      {!loading && participants.length > 0 && (
        <div className="mt-16" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 640 }}>
            <thead>
              <tr>
                {['Nama', 'Jabatan', 'Wilayah Kerja', 'Waktu Mulai', 'Waktu Selesai', 'Hasil'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 8px',
                      borderBottom: '2px solid var(--border)',
                      color: 'var(--ink-soft)',
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{p.position}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)' }}>{p.location}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {formatDateTime(p.logged_in_at)}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    {p.completed_at ? formatDateTime(p.completed_at) : '-'}
                  </td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <span className={`badge ${p.soal_completed ? 'badge-success' : 'badge-pending'}`}>
                      {resultLabel(p)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden plain-styled template used only for JPG export.
          Uses hardcoded colors (no CSS variables) since html2canvas
          can render CSS variables and animations inconsistently. */}
      <div
        ref={exportRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: 820,
          background: '#ffffff',
          padding: 28,
          fontFamily: 'Inter, sans-serif',
          color: '#14213d',
        }}
      >
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 22 }}>
          {sessionTitle || 'Hasil Training'}
        </div>
        <div style={{ color: '#4a5578', fontSize: 13, marginTop: 4, marginBottom: 18 }}>
          Diekspor {formatDateTime(new Date().toISOString())}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Nama', 'Jabatan', 'Wilayah Kerja', 'Waktu Mulai', 'Waktu Selesai', 'Hasil'].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 6px',
                    borderBottom: '2px solid #e2e5ec',
                    color: '#4a5578',
                    fontSize: 11,
                    textTransform: 'uppercase',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={p.id}>
                <td
                  style={{
                    padding: '8px 6px',
                    borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none',
                    fontWeight: 700,
                  }}
                >
                  {p.name}
                </td>
                <td style={{ padding: '8px 6px', borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none' }}>
                  {p.position}
                </td>
                <td style={{ padding: '8px 6px', borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none' }}>
                  {p.location}
                </td>
                <td style={{ padding: '8px 6px', borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none', whiteSpace: 'nowrap' }}>
                  {formatDateTime(p.logged_in_at)}
                </td>
                <td style={{ padding: '8px 6px', borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none', whiteSpace: 'nowrap' }}>
                  {p.completed_at ? formatDateTime(p.completed_at) : '-'}
                </td>
                <td style={{ padding: '8px 6px', borderBottom: i < participants.length - 1 ? '1px solid #e2e5ec' : 'none', whiteSpace: 'nowrap' }}>
                  {resultLabel(p)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
