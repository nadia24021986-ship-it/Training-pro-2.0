import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { generateCode, formatDateTime } from '../lib/utils.js'

export default function AdminDashboard() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const navigate = useNavigate()

  const [loadError, setLoadError] = useState('')

  const loadSessions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*, training_participants(count)')
      .order('created_at', { ascending: false })
    if (error) setLoadError(error.message)
    setSessions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setCreateError('')
    const { data, error } = await supabase
      .from('training_sessions')
      .insert({
        title: title.trim(),
        materi_code: generateCode(),
        soal_code: generateCode(),
      })
      .select()
      .single()
    setCreating(false)
    if (error) {
      setCreateError(error.message || 'Gagal membuat sesi.')
      return
    }
    if (data) {
      navigate(`/admin/${data.id}`)
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div className="container">
          <div className="brand">
            <span className="dot" />
            Training Pro 2.0
          </div>
        </div>
      </div>

      <div className="container">
        <div className="header-row">
          <div>
            <div className="eyebrow">Dashboard Instruktur</div>
            <h2 className="mt-8">Daftar Sesi Training</h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            + Sesi Baru
          </button>
        </div>

        {showForm && (
          <div className="card">
            <form onSubmit={handleCreate}>
              <div className="field">
                <label className="field-label">Judul Training</label>
                <input
                  className="input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Onboarding Karyawan Baru"
                  autoFocus
                  required
                />
              </div>
              {createError && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }} className="mt-8">
                  {createError}
                </p>
              )}
              <button className="btn btn-accent" type="submit" disabled={creating}>
                {creating ? 'Membuat...' : 'Buat Sesi'}
              </button>
            </form>
          </div>
        )}

        {loadError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }} className="mt-16">
            Gagal memuat: {loadError}
          </p>
        )}

        {loading && <p className="text-muted mt-16">Memuat sesi...</p>}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <p>Belum ada sesi training. Buat sesi pertamamu untuk mulai membagikan link ke peserta.</p>
          </div>
        )}

        {!loading &&
          sessions.map((s) => (
            <Link key={s.id} to={`/admin/${s.id}`} style={{ textDecoration: 'none' }}>
              <div className="card">
                <div className="header-row" style={{ marginBottom: 0 }}>
                  <div>
                    <h3>{s.title}</h3>
                    <p className="text-muted mt-8" style={{ fontSize: '0.82rem' }}>
                      Dibuat {formatDateTime(s.created_at)}
                    </p>
                  </div>
                  <span className="badge badge-pending">
                    {s.training_participants?.[0]?.count ?? 0} peserta
                  </span>
                </div>
              </div>
            </Link>
          ))}
      </div>
    </div>
  )
}
