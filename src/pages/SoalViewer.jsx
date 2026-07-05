import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import ParticipantLogin from '../components/ParticipantLogin.jsx'
import { normalizeAnswer } from '../lib/utils.js'

export default function SoalViewer() {
  const { code } = useParams()
  const [session, setSession] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [participant, setParticipant] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('soal_code', code)
        .maybeSingle()
      if (!data) {
        setNotFound(true)
        return
      }
      setSession(data)
      const { data: qs } = await supabase
        .from('training_questions')
        .select('*')
        .eq('session_id', data.id)
        .order('question_number', { ascending: true })
      setQuestions(qs || [])
    }
    load()
  }, [code])

  const setAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    let correctCount = 0
    const rows = questions.map((q) => {
      const given = answers[q.id] ?? ''
      let isCorrect = false
      if (q.type === 'multiple_choice') {
        isCorrect = given === q.correct_answer
      } else {
        isCorrect = normalizeAnswer(given) === normalizeAnswer(q.correct_answer)
      }
      if (isCorrect) correctCount++
      return {
        participant_id: participant.id,
        question_id: q.id,
        answer_text: given,
        is_correct: isCorrect,
      }
    })

    await supabase.from('training_answers').insert(rows)

    await supabase
      .from('training_participants')
      .update({
        score: correctCount,
        total_questions: questions.length,
        soal_completed: true,
      })
      .eq('id', participant.id)

    setResult({ score: correctCount, total: questions.length })
    setSubmitting(false)
  }

  if (notFound) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Link soal tidak ditemukan. Periksa kembali link yang diberikan instruktur.</p>
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

  if (questions.length === 0) {
    return (
      <div className="container">
        <div className="empty-state">
          <p>Soal belum tersedia untuk sesi ini.</p>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="container">
        <div className="result-hero card">
          <div className="eyebrow">Selesai</div>
          <div className="result-score mt-8">
            {result.score}/{result.total}
          </div>
          <p className="text-muted mt-8">
            Terima kasih, {participant.name}. Jawabanmu telah tercatat pada instruktur.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="eyebrow">{session.title}</div>
      <h3 className="mt-8">Kuis ({questions.length} soal)</h3>

      <form onSubmit={handleSubmit} className="mt-16">
        {questions.map((q, idx) => (
          <div key={q.id} className="question-block">
            <p style={{ fontWeight: 600 }}>
              {idx + 1}. {q.question_text}
            </p>
            {q.type === 'multiple_choice' ? (
              <div className="mt-16">
                {q.options?.map((opt, i) => (
                  <label
                    key={i}
                    className={`option-row ${answers[q.id] === opt ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            ) : (
              <input
                className="input mt-16"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                placeholder="Ketik jawabanmu"
              />
            )}
          </div>
        ))}

        <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
          {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
        </button>
      </form>
    </div>
  )
}

