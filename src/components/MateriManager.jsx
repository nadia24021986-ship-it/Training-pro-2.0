import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const BUCKET = 'training-materials'

export default function MateriManager({ sessionId }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('text')
  const [pageTitle, setPageTitle] = useState('')
  const [content, setContent] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('training_materials')
      .select('*')
      .eq('session_id', sessionId)
      .order('page_number', { ascending: true })
    setMaterials(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const nextPageNumber = () =>
    materials.length ? materials[materials.length - 1].page_number + 1 : 1

  const handleAddText = async () => {
    if (!content.trim()) return
    setError('')
    const { error: insertError } = await supabase.from('training_materials').insert({
      session_id: sessionId,
      page_number: nextPageNumber(),
      type: 'text',
      title: pageTitle.trim() || null,
      content: content.trim(),
    })
    if (insertError) {
      setError('Gagal menyimpan halaman.')
      return
    }
    setContent('')
    setPageTitle('')
    load()
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fileExt = file.name.split('.').pop()
    const filePath = `${sessionId}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(filePath, file)

    if (uploadError) {
      setError('Gagal mengunggah file. Pastikan bucket "training-materials" sudah dibuat dan bersifat publik.')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('training_materials').insert({
      session_id: sessionId,
      page_number: nextPageNumber(),
      type,
      title: pageTitle.trim() || file.name,
      content: urlData.publicUrl,
    })

    setUploading(false)
    if (insertError) {
      setError('File terunggah tapi gagal menyimpan halaman.')
      return
    }
    setPageTitle('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    load()
  }

  const handleDelete = async (id) => {
    await supabase.from('training_materials').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="card">
        <h3>Tambah Halaman Materi</h3>
        <div className="field mt-16">
          <label className="field-label">Jenis Konten</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="text">Teks (ketik langsung)</option>
            <option value="image">Gambar (JPG/PNG)</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Judul Halaman (opsional)</label>
          <input
            className="input"
            value={pageTitle}
            onChange={(e) => setPageTitle(e.target.value)}
            placeholder="Contoh: Pengenalan Produk"
          />
        </div>

        {type === 'text' ? (
          <>
            <div className="field">
              <label className="field-label">Isi Materi</label>
              <textarea
                className="input"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ketik isi materi di sini..."
              />
            </div>
            <button className="btn btn-accent" onClick={handleAddText}>
              Tambah Halaman
            </button>
          </>
        ) : (
          <div className="field">
            <label className="field-label">Unggah File {type === 'image' ? 'Gambar' : 'PDF'}</label>
            <input
              ref={fileInputRef}
              className="input"
              type="file"
              accept={type === 'image' ? 'image/*' : 'application/pdf'}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-muted mt-8">Mengunggah...</p>}
          </div>
        )}
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }} className="mt-8">{error}</p>}
      </div>

      <div className="card">
        <h3>Halaman Materi ({materials.length})</h3>
        {loading && <p className="text-muted mt-8">Memuat...</p>}
        {!loading && materials.length === 0 && (
          <p className="text-muted mt-8">Belum ada halaman materi.</p>
        )}
        {materials.map((m) => (
          <div key={m.id} className="roster-row">
            <div className="roster-info">
              <div className="roster-name">
                Hal. {m.page_number} {m.title ? `— ${m.title}` : ''}
              </div>
              <div className="roster-meta">
                {m.type === 'text' ? 'Teks' : m.type === 'image' ? 'Gambar' : 'PDF'}
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
