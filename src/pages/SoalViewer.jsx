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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [draftAnswer, setDraftAnswer] = useState('')
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

  const finalizeAndSubmit = async (allAnswers) => {
    setSubmitting(true)

    let correctCount = 0
    const rows = questions.map((q) => {
      const given = allAnswers[q.id] ?? ''
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
        completed_at: new Date().toISOString(),
      })
      .eq('id', participant.id)

    setResult({ score: correctCount, total: questions.length })
    setSubmitting(false)
  }

  const handleNext = () => {
    const currentQuestion = questions[currentIndex]
    if (!draftAnswer.trim()) return

    const updatedAnswers = { ...answers, [currentQuestion.id]: draftAnswer }
    setAnswers(updatedAnswers)
    setDraftAnswer('')

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    } else {
      finalizeAndSubmit(updatedAnswers)
    }
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

  const q = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  return (
    <div className="container">
      <div className="eyebrow">{session.title}</div>
      <h3 className="mt-8">
        Soal {currentIndex + 1} dari {questions.length}
      </h3>

      <div className="page-dots">
        {questions.map((_, i) => (
          <span key={i} className={i === currentIndex ? 'active' : ''} />
        ))}
      </div>

      <div className="question-block mt-16">
        <p style={{ fontWeight: 600 }}>{q.question_text}</p>

        {q.type === 'multiple_choice' ? (
          <div className="mt-16">
            {q.options?.map((opt, i) => (
              <label key={i} className={`option-row ${draftAnswer === opt ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name={q.id}
                  checked={draftAnswer === opt}
                  onChange={() => setDraftAnswer(opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input
            className="input mt-16"
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            placeholder="Ketik jawabanmu"
            autoFocus
          />
        )}
      </div>

      <button
        className="btn btn-accent btn-block"
        onClick={handleNext}
        disabled={submitting || !draftAnswer.trim()}
      >
        {submitting ? 'Mengirim...' : isLast ? 'Kirim Jawaban' : 'Berikutnya'}
      </button>
    </div>
  )
}
