import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Send, Bookmark, BookmarkCheck, Clock, Info, Flag } from 'lucide-react';

const AUTO_SUBMIT_VIOLATIONS = 5;
const AUTO_SAVE_INTERVAL_MS = 30000;

export default function TakeExam() {
  const { id, orgSlug } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const containerRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const timerIntervalRef = useRef(null);

  const [warnings, setWarnings] = useState(0);
  const [examState, setExamState] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'instructions' | 'exam' | 'submitted'
  const [timeLeft, setTimeLeft] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const warningsRef = useRef(0);

  // ─── Init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    initExam();

    const token = localStorage.getItem('token');
    const newSocket = io('/exam-monitor', { auth: { token } });
    socketRef.current = newSocket;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && phase === 'exam') {
        newSocket.emit('tab_switch', { examId: id });
        warningsRef.current += 1;
        setWarnings(warningsRef.current);
        recordTabSwitch();
        if (warningsRef.current >= AUTO_SUBMIT_VIOLATIONS) {
          triggerAutoSubmitRef.current('max_violations');
        }
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        warningsRef.current += 1;
        setWarnings(warningsRef.current);
        newSocket.emit('security_violation', { type: 'fullscreen_exit', examId: id });
      }
    };

    const preventAction = (e) => e.preventDefault();

    const handleKeyDown = (e) => {
      const forbidden = [
        e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i'),
        e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j'),
        e.ctrlKey && (e.key === 'U' || e.key === 'u'),
        e.ctrlKey && (e.key === 'S' || e.key === 's'),
        e.ctrlKey && (e.key === 'P' || e.key === 'p'),
        e.key === 'F12'
      ];
      if (forbidden.some(Boolean)) {
        e.preventDefault();
        warningsRef.current += 1;
        setWarnings(warningsRef.current);
        newSocket.emit('security_violation', { type: 'forbidden_key', key: e.key, examId: id });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('paste', preventAction);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      newSocket.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('paste', preventAction);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(timerIntervalRef.current);
      clearInterval(autoSaveTimerRef.current);
    };
  }, [id]);

  // ─── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam' || timeLeft === null) return;
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerIntervalRef.current);
          triggerAutoSubmitRef.current('time_expired');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, [phase]);

  // ─── Auto-save ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'exam' || !examState) return;
    clearInterval(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setInterval(() => {
      performAutoSave();
    }, AUTO_SAVE_INTERVAL_MS);
    return () => clearInterval(autoSaveTimerRef.current);
  }, [phase, examState]);

  // keep a stable ref to triggerAutoSubmit
  const triggerAutoSubmitRef = useRef(null);

  const triggerAutoSubmit = useCallback(async (reason) => {
    if (submitting || submitted) return;
    setSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const res = await api.post(`/student/exams/${id}/submit`, {
        attemptId: examState?.attemptId,
        answers,
        autoSubmit: true,
        reason
      });
      setSubmitted(true);
      setResult(res.data.data);
      setPhase('submitted');
    } catch (_) {
      setSubmitting(false);
    }
  }, [examState, answers, id, submitted, submitting]);

  useEffect(() => {
    triggerAutoSubmitRef.current = triggerAutoSubmit;
  }, [triggerAutoSubmit]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const initExam = async () => {
    try {
      const res = await api.get(`/student/exams/${id}/attempt`);
      const data = res.data.data;
      setExamState(data);
      if (data.savedAnswers && Object.keys(data.savedAnswers).length > 0) {
        setAnswers(data.savedAnswers);
      }
      setTimeLeft(data.exam.duration_minutes * 60);
      setPhase('instructions');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load exam.');
      navigate(`/org/${orgSlug}/student/dashboard`);
    }
  };

  const performAutoSave = useCallback(async () => {
    if (!examState) return;
    const currentQ = examState.exam.Questions[currentIndex];
    if (!currentQ || !answers[currentQ.id]) return;
    try {
      await api.post(`/student/attempts/${examState.attemptId}/auto-save`, {
        questionId: currentQ.id,
        answer: answers[currentQ.id]
      });
      setLastSaved(new Date());
    } catch (_) { /* silent */ }
  }, [examState, answers, currentIndex]);

  const recordTabSwitch = async () => {
    if (!examState?.attemptId) return;
    try { await api.post(`/student/attempts/${examState.attemptId}/tab-switch`); } catch (_) {}
  };

  const enterFullscreen = () => {
    if (containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen();
  };

  const handleSelectOption = (qId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: [optionIndex] }));
  };

  const handleTextAnswer = (qId, text) => {
    setAnswers(prev => ({ ...prev, [qId]: [text] }));
  };

  const toggleMarkForReview = (qId) => {
    setMarkedForReview(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const startExam = () => {
    enterFullscreen();
    setPhase('exam');
  };

  const submitFinal = async () => {
    if (!window.confirm('Submit your exam? This action is irreversible.')) return;
    if (submitting) return;
    setSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const res = await api.post(`/student/exams/${id}/submit`, {
        attemptId: examState.attemptId,
        answers
      });
      setSubmitted(true);
      setResult(res.data.data);
      setPhase('submitted');
    } catch (err) {
      setSubmitting(false);
      alert('Submission failed. Please check your connection.');
    }
  };

  const formatTime = (secs) => {
    if (secs === null || secs < 0) return '00:00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  const answeredCount = Object.keys(answers).length;
  const totalQ = examState?.exam?.Questions?.length || 0;

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center space-y-4 bg-background">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Examination Protocol...</p>
      </div>
    );
  }

  // ── SUBMITTED ────────────────────────────────────────────────────────────────
  if (phase === 'submitted') {
    const showResult = examState?.exam?.show_result_immediately !== false;
    if (!showResult || !result) {
      return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-background">
          <div className="premium-card p-12 text-center max-w-lg w-full border border-white/5">
            <div className="w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 shadow-2xl bg-accent/20 text-accent">
              <CheckCircle size={56} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Submission Recorded</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">Your answers have been saved successfully. Results will be published by your instructor once evaluation is complete.</p>
            <button onClick={() => navigate(`/org/${orgSlug}/student/dashboard`)} className="w-full py-4 bg-accent text-background font-black rounded-2xl transition-all hover:opacity-90 active:scale-95 shadow-lg uppercase tracking-widest text-xs">
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen flex flex-col items-center justify-center p-6 bg-background">
        <div className="premium-card p-12 text-center max-w-lg w-full border border-white/5">
          <div className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-8 shadow-2xl ${result.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className="text-5xl font-black">{result.score}</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{result.passed ? '✓ PASSED' : '✗ FAILED'}</h2>
          <p className="text-gray-400 mb-1">Score: <span className="text-white font-bold">{result.score}</span> / {result.totalMarks}</p>
          <p className="text-gray-400 mb-1">Percentage: <span className="text-white font-bold">{result.percentage}%</span></p>
          <p className="text-gray-500 text-sm mb-8">Time taken: {Math.floor((result.timeTakenSeconds || 0) / 60)}m {(result.timeTakenSeconds || 0) % 60}s</p>
          <button onClick={() => navigate(`/org/${orgSlug}/student/dashboard`)} className="w-full py-4 bg-accent text-background font-black rounded-2xl transition-all hover:opacity-90 active:scale-95 shadow-lg uppercase tracking-widest text-xs">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── INSTRUCTIONS ─────────────────────────────────────────────────────────────
  if (phase === 'instructions' && examState) {
    const exam = examState.exam;
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-2xl w-full space-y-6">
          <div className="premium-card p-8 border border-accent/20 bg-accent/5">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-accent/20 border border-accent/20 text-accent"><Info size={28} /></div>
              <div>
                <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
                <p className="text-gray-400 text-sm">{exam.subject}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Duration', value: `${exam.duration_minutes} minutes` },
                { label: 'Total Marks', value: exam.total_marks },
                { label: 'Pass Marks', value: exam.pass_marks },
                { label: 'Questions', value: totalQ },
              ].map(item => (
                <div key={item.label} className="p-4 bg-black/40 border border-white/5 rounded-xl">
                  <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">{item.label}</p>
                  <p className="text-white text-xl font-black mt-1">{item.value}</p>
                </div>
              ))}
            </div>

            {exam.instructions && (
              <div className="mb-6 p-4 bg-black/40 border border-white/5 rounded-xl">
                <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Instructions</p>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{exam.instructions}</p>
              </div>
            )}

            <div className="mb-6 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl space-y-2">
              <p className="text-yellow-400 text-xs uppercase tracking-widest font-bold mb-2">Exam Rules</p>
              {[
                'Fullscreen mode is required — exiting will log a violation.',
                'Right-click, copy, and paste are disabled during the exam.',
                'Tab switching is monitored and logged.',
                exam.negative_marking_enabled ? `Negative marking: -${exam.negative_marks_per_wrong} mark(s) per wrong answer.` : 'No negative marking for wrong answers.',
                exam.shuffle_questions ? 'Questions are randomized uniquely for each student.' : null,
                `Exam auto-submits after ${AUTO_SUBMIT_VIOLATIONS} security violations.`,
                'Timer auto-submits the exam when it reaches zero.'
              ].filter(Boolean).map((rule, i) => (
                <p key={i} className="text-gray-400 text-sm flex items-start gap-2"><span className="text-yellow-400 mt-0.5">•</span>{rule}</p>
              ))}
            </div>

            <button onClick={startExam} className="w-full py-5 bg-accent text-background font-black rounded-2xl transition-all hover:opacity-90 active:scale-95 shadow-lg uppercase tracking-widest text-sm">
              Begin Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FULLSCREEN GATE ───────────────────────────────────────────────────────────
  if (!isFullscreen && phase === 'exam') {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-background">
        <div className="premium-card p-10 max-w-xl text-center border border-accent/30 bg-accent/5">
          <AlertTriangle size={60} className="text-accent mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Fullscreen Required</h2>
          <p className="text-gray-400 mb-4 leading-relaxed">Please return to fullscreen to continue. This exit has been logged.</p>
          <p className="text-red-400 font-bold text-sm mb-8">Violations: {warnings} / {AUTO_SUBMIT_VIOLATIONS}</p>
          <button onClick={enterFullscreen} className="bg-accent text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            Resume Secure Environment
          </button>
        </div>
      </div>
    );
  }

  if (!examState) return null;

  const currentQ = examState.exam.Questions[currentIndex];

  const getQuestionStatus = (q, i) => {
    if (i === currentIndex) return 'current';
    if (markedForReview[q.id]) return 'review';
    if (answers[q.id]) return 'answered';
    return 'unanswered';
  };

  const statusClasses = {
    current: 'bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(0,194,255,0.2)]',
    review: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    answered: 'bg-green-500/20 text-green-400 border-green-500/40',
    unanswered: 'bg-white/5 text-gray-600 border-transparent hover:bg-white/10'
  };

  const timerColor = timeLeft !== null && timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-white';

  // ── EXAM UI ───────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex flex-col w-full min-h-screen bg-background animate-in fade-in duration-500">
      {/* Security banner */}
      <div className="flex items-center justify-center gap-2 py-2 bg-accent/10 border-b border-accent/20 flex-shrink-0">
        <Shield size={10} className="text-accent animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent">Secure Session Active • Activity Monitored</span>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white/5 border-b border-white/10 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">{examState.exam.title}</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{examState.exam.subject}</p>
        </div>
        <div className="flex items-center gap-6">
          {lastSaved && (
            <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
              <CheckCircle size={10} /> Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <div className="text-right">
            <div className={`text-2xl font-black tabular-nums flex items-center gap-2 ${timerColor}`}>
              <Clock size={16} />{formatTime(timeLeft)}
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Time Remaining</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 flex flex-col p-8 overflow-y-auto">
          {currentQ ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-4 py-1.5 rounded-full border border-accent/20 uppercase tracking-[0.2em]">
                  Question {currentIndex + 1} of {totalQ}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">{currentQ.marks} Marks</span>
                  <button
                    onClick={() => toggleMarkForReview(currentQ.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${markedForReview[currentQ.id] ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-white/5 border-white/5 text-gray-500 hover:border-yellow-500/20 hover:text-yellow-400'}`}
                  >
                    {markedForReview[currentQ.id] ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
                    {markedForReview[currentQ.id] ? 'Marked' : 'Mark for Review'}
                  </button>
                </div>
              </div>

              <div className="premium-card p-8 border border-white/10 mb-6">
                <h2 className="text-xl font-bold text-white mb-8 leading-relaxed">{currentQ.text}</h2>
                <div className="space-y-4">
                  {currentQ.type !== 'word' && currentQ.type !== 'fill_blank' ? (
                    currentQ.options.map((opt, i) => (
                      <label key={i} className={`flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all ${answers[currentQ.id]?.[0] === i ? 'bg-accent/10 border-accent' : 'border-white/5 bg-black/20 hover:border-white/20'}`}>
                        <input type="radio" name={`q_${currentQ.id}`} checked={answers[currentQ.id]?.[0] === i} onChange={() => handleSelectOption(currentQ.id, i)} className="w-5 h-5 accent-accent" />
                        <span className={`text-base font-medium ${answers[currentQ.id]?.[0] === i ? 'text-white' : 'text-gray-400'}`}>{opt}</span>
                      </label>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Type your answer:</p>
                      <textarea rows={4} value={answers[currentQ.id]?.[0] || ''} onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-white focus:border-accent outline-none transition-all placeholder:text-gray-700" placeholder="Enter your answer..." />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(c => c - 1)} className="flex items-center gap-2 px-6 py-3 border border-white/10 rounded-2xl text-[10px] text-gray-400 hover:bg-white/5 transition-all font-bold uppercase tracking-widest disabled:opacity-30">
                  <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex gap-3">
                  {currentIndex < totalQ - 1 && (
                    <button onClick={() => setCurrentIndex(c => c + 1)} className="flex items-center gap-2 px-8 py-3 bg-white/10 text-white font-bold rounded-2xl transition-all text-xs uppercase tracking-widest hover:bg-white/20">
                      Next <ChevronRight size={16} />
                    </button>
                  )}
                  <button onClick={submitFinal} disabled={submitting} className="flex items-center gap-2 px-8 py-3 bg-green-500 text-black font-black rounded-2xl transition-all text-xs uppercase tracking-widest disabled:opacity-60 active:scale-95">
                    <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Exam'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 italic p-6">No questions found.</div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-72 flex flex-col gap-4 p-4 border-l border-white/5 overflow-y-auto flex-shrink-0">
          <div className="premium-card p-5 border border-white/10 bg-black/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Questions</h3>
              <span className="text-white font-black text-xs">{answeredCount}/{totalQ}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {examState.exam.Questions.map((q, i) => (
                <button key={q.id} onClick={() => setCurrentIndex(i)} className={`aspect-square rounded-xl text-xs font-black flex items-center justify-center transition-all border-2 ${statusClasses[getQuestionStatus(q, i)]}`}>
                  {markedForReview[q.id] ? <Flag size={9} /> : i + 1}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4 text-[9px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1 text-green-400"><span className="w-2 h-2 rounded bg-green-500/40 inline-block" /> Answered</span>
              <span className="flex items-center gap-1 text-yellow-400"><span className="w-2 h-2 rounded bg-yellow-500/40 inline-block" /> Review</span>
              <span className="flex items-center gap-1 text-gray-500"><span className="w-2 h-2 rounded bg-white/10 inline-block" /> Pending</span>
            </div>
          </div>

          <div className="premium-card p-5 border border-white/10 bg-black/40">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Security Monitor</h3>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-green-500">Live Connection</span>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between ${warnings > 0 ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                <span className="text-xs font-bold">Violations</span>
                <span className="font-black">{warnings}<span className="text-gray-600 text-xs">/{AUTO_SUBMIT_VIOLATIONS}</span></span>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                <span className="text-xs font-bold text-orange-500">Anti-Cheat Active</span>
                <CheckCircle size={14} className="text-orange-500" />
              </div>
            </div>
          </div>

          <div className="premium-card p-5 border border-white/10 bg-black/40">
            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
              <span>Progress</span><span>{Math.round((answeredCount / (totalQ || 1)) * 100)}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2">
              <div className="bg-accent h-2 rounded-full transition-all" style={{ width: `${(answeredCount / (totalQ || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
