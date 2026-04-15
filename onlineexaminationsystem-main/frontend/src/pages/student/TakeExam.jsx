import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';

export default function TakeExam() {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [warnings, setWarnings] = useState(0);
  const containerRef = useRef(null);

  const [examState, setExamState] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!examState || submitted) return;

    // Calculate expiration time based on attempt started_at + duration or exam.scheduled_end
    const start = new Date(examState.attempt.started_at).getTime();
    const durationMs = examState.exam.duration_minutes * 60 * 1000;
    let expiresAt = start + durationMs;

    if (examState.exam.scheduled_end) {
      const scheduledEnd = new Date(examState.exam.scheduled_end).getTime();
      expiresAt = Math.min(expiresAt, scheduledEnd);
    }

    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const difference = expiresAt - now;

      if (difference <= 0) {
        clearInterval(timerInterval);
        setTimeLeft(0);

        // Auto-submit mechanism
        submitFinalInternal(examState.attemptId);
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [examState, submitted]);

  useEffect(() => {
    if (!id) return;
    initExam();

    const token = localStorage.getItem('token');
    const newSocket = io('/exam-monitor', { auth: { token } });
    setSocket(newSocket);

    // Lenient Mode: Remove strict visibility blocking and fullscreen blocks
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !submitted) {
        newSocket.emit('tab_switch', { attemptId: 'active-exam', info: 'lenient_tab_shift' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      newSocket.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  const initExam = async () => {
    try {
      const res = await api.get(`/student/exams/${id}/attempt`);
      setExamState(res.data.data);
    } catch (err) {
      navigate(`/org/${orgSlug}/student/dashboard`);
    }
  };

  const enterFullscreen = () => {
    if (containerRef.current.requestFullscreen) {
      containerRef.current.requestFullscreen();
    }
  };

  const handleSelectOption = (qId, optionIndex) => {
    setAnswers({ ...answers, [qId]: [optionIndex] });
  };

  const handleTextAnswer = (qId, text) => {
    setAnswers({ ...answers, [qId]: [text] });
  };

  const submitFinalInternal = async (attemptIdTarget) => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      const res = await api.post(`/student/exams/${id}/submit`, {
        attemptId: attemptIdTarget,
        answers
      });
      setSubmitted(true);
      setResult(res.data.data);
    } catch (err) {
      alert("Submission communication failed. The backend may have forcibly terminated the session.");
    }
  };

  const submitFinal = async () => {
    if (!window.confirm("Are you prepared to finalize your official submission? This action is irreversible.")) return;
    await submitFinalInternal(examState.attemptId);
  };

  const formatTime = (ms) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (submitted && result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card p-12 text-center max-w-lg w-full border border-white/5">
          <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 shadow-2xl ${result.passed ? 'bg-success/20 text-success shadow-success/20' : 'bg-danger/20 text-danger shadow-danger/20'}`}>
            <span className="text-5xl font-black">{result.score}</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{result.passed ? 'Result: PASSED' : 'Result: FAILED'}</h2>
          <p className="text-gray-400 mb-8 font-medium">Your final score is {result.score} out of {result.totalMarks}.</p>
          <button onClick={() => navigate(`/org/${orgSlug}/student/dashboard`)} className="w-full py-4 bg-accent text-background font-black rounded-2xl transition-all hover:opacity-90 active:scale-95 shadow-lg shadow-accent/20 uppercase tracking-widest text-xs">Exit Session & Return to Console</button>
        </motion.div>
      </div>
    );
  }

  if (!examState) return (
    <div className="h-screen w-full flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Examination Protocol...</p>
    </div>
  );

  // Fullscreen requirement removed for leniency

  const currentQ = examState.exam.Questions[currentIndex];

  return (
    <div ref={containerRef} className="flex-1 flex gap-8 w-full animate-in fade-in duration-500 p-8 max-w-7xl mx-auto bg-background min-h-screen">

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center p-6 bg-white/5 border border-white/10 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/20 text-accent">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">{examState.exam.title}</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{examState.exam.subject} • Secure Session</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-black tabular-nums transition-colors ${timeLeft < 300000 ? 'text-danger animate-pulse' : 'text-white'}`}>{formatTime(timeLeft)}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Time Remaining</div>
          </div>
        </div>

        {currentQ ? (
          <div className="premium-card p-10 relative overflow-hidden flex-1 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 uppercase tracking-[0.2em]">Question {currentIndex + 1} of {examState.exam.Questions.length}</span>
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 uppercase tracking-[0.2em]">{currentQ.marks} Marks</span>
            </div>
            <h2 className="text-2xl font-bold leading-tight text-white mb-10">{currentQ.text}</h2>

            <div className="space-y-4">
              {currentQ.type !== 'word' ? (
                currentQ.options.map((opt, i) => (
                  <label key={i} className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${answers[currentQ.id]?.[0] === i ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(0,194,255,0.05)]' : 'border-white/5 bg-black/20 hover:border-white/20'}`}>
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      checked={answers[currentQ.id]?.[0] === i}
                      onChange={() => handleSelectOption(currentQ.id, i)}
                      className="w-5 h-5 accent-accent"
                    />
                    <span className={`text-lg font-medium ${answers[currentQ.id]?.[0] === i ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                  </label>
                ))
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Type your answer below:</p>
                  <textarea
                    rows={4}
                    value={answers[currentQ.id]?.[0] || ''}
                    onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-lg focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="Enter short answer response..."
                  />
                </div>
              )}
            </div>
          </div>
        ) : <div className="text-gray-500 italic p-6">Initializing Examination Environment...</div>}

        <div className="flex justify-between items-center py-4">
          <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(c => c - 1)} className="flex items-center gap-2 px-8 py-4 border border-white/10 rounded-2xl text-[10px] text-gray-400 hover:bg-white/5 hover:border-white/20 transition-all font-bold uppercase tracking-widest disabled:opacity-30">
            <ChevronLeft size={16} /> Previous Segment
          </button>

          <div className="flex gap-4">
            {currentIndex === examState.exam.Questions.length - 1 ? (
              <button onClick={submitFinal} className="flex items-center gap-2 px-10 py-4 bg-success text-black font-black rounded-2xl shadow-xl shadow-success/20 active:scale-95 transition-all">
                <Send size={20} /> Finish & Submit
              </button>
            ) : (
              <button onClick={() => setCurrentIndex(c => c + 1)} className="flex items-center gap-2 px-10 py-4 bg-white text-black font-black rounded-2xl shadow-xl shadow-white/20 active:scale-95 transition-all">
                Next Question <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="w-80 flex flex-col gap-6">
        <div className="premium-card p-6 border border-white/10 bg-black/40">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
            Exam Progress
            <span className="text-white font-black">{Math.round((Object.keys(answers).length / examState.exam.Questions.length) * 100)}%</span>
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {examState.exam.Questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all border-2 ${answers[q.id] ? 'bg-success/20 text-success border-success/40' : currentIndex === i ? 'bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(0,194,255,0.2)]' : 'bg-white/5 text-gray-600 border-transparent hover:bg-white/10'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div className="premium-card p-6 border border-white/10 bg-black/40 flex-1">
          <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Session Integrity</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-500">Live Secure Connection</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
              <span className="text-xs font-bold text-purple-500">Lenient Mode</span>
              <CheckCircle size={16} className="text-purple-500" />
            </div>
          </div>
          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[10px] text-gray-600 font-medium leading-relaxed uppercase tracking-tighter">Please attempt the questions at your own pace. Best of luck!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
