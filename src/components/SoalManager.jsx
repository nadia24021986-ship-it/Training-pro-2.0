import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function SoalManager({ sessionId }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('multiple_choice')
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [correctText, setCorrectText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('training_questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('question_number', { ascending: true })
    setQuestions(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const resetForm = () => {
    setQuestionText('')
    setOptions(['', '', '', ''])
    setCorrectIndex(0)
    setCorrectText('')
  }

  const handleAdd = async () => {
    if (!questionText.trim()) return
    setError('')

    let payload = {
      session_id: sessionId,
      question_number: questions.length ? questions[questions.length - 1].question_number + 1 : 1,
      type,
      question_text: questionText.trim(),
    }

    if (type === 'multiple_choice') {
      const filledOptions = options.map((o) => o.trim()).filter(Boolean)
      if (filledOptions.length < 2) {
        setError('Isi minimal 2 pilihan jawaban.')
        return
      }
      payload.options = filledOptions
      payload.correct_answer = filledOptions[correctIndex] ?? filledOptions[0]
    } else {
      if (!correctText.trim()) {
        setError('Isi jawaban kunci untuk soal isian singkat.')
        return
      }
      payload.options = null
      payload.correct_answer = correctText.trim()
    }

    setSaving(true)
    const { error: insertError } = await supabase.from('training_questions').insert(payload)
    setSaving(false)
    if (insertError) {
      setError('Gagal menyimpan soal.')
      return
    }
    resetForm()
    load()
  }

  const handleDelete = async (id) => {
    await supabase.from('training_questions').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="card">
        <h3>Tambah Soal</h3>
        <div className="field mt-16">
          <label className="field-label">Jenis Soal</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="multiple_choice">Pilihan Ganda</option>
            <option value="short_answer">Isian Singkat</option>
          </select>
        </div>
        <div className="field">
          <label className="field-label">Pertanyaan</label>
          <textarea
            className="input"
            rows={3}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Tulis pertanyaan di sini..."
          />
        </div>

        {type === 'multiple_choice' ? (
          <div className="field">
            <label className="field-label">Pilihan Jawaban (tandai yang benar)</label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                />
                <input
                  className="input"
                  value={opt}
                  onChange={(e) => {
                    const copy = [...options]
                    copy[i] = e.target.value
                    setOptions(copy)
                  }}
                  placeholder={`Pilihan ${i + 1}`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="field">
            <label className="field-label">Jawaban Kunci</label>
            <input
              className="input"
              value={correctText}
              onChange={(e) => setCorrectText(e.target.value)}
              placeholder="Jawaban yang dianggap benar"
            />
            <p className="text-muted mt-8" style={{ fontSize: '0.78rem' }}>
              Jawaban peserta dicocokkan tanpa memperhatikan huruf besar/kecil dan spasi berlebih.
            </p>
          </div>
        )}

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }} className="mt-8">{error}</p>}
        <button className="btn btn-accent mt-8" onClick={handleAdd} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Tambah Soal'}
        </button>
      </div>

      <div className="card">
        <h3>Daftar Soal ({questions.length})</h3>
        {loading && <p className="text-muted mt-8">Memuat...</p>}
        {!loading && questions.length === 0 && <p className="text-muted mt-8">Belum ada soal.</p>}
        {questions.map((q) => (
          <div key={q.id} className="question-block">
            <div className="header-row" style={{ marginBottom: 8 }}>
              <strong>
                No. {q.question_number} · {q.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Isian Singkat'}
              </strong>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(q.id)}>
                Hapus
              </button>
            </div>
            <p>{q.question_text}</p>
            {q.type === 'multiple_choice' ? (
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {q.options?.map((o, i) => (
                  <li key={i} style={{ color: o === q.correct_answer ? 'var(--success)' : 'inherit' }}>
                    {o} {o === q.correct_answer ? '✓' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted mt-8">Jawaban kunci: {q.correct_answer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
