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
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!id) return;
    initExam();
    
    const token = localStorage.getItem('token');
    const newSocket = io('/exam-monitor', { auth: { token } });
    setSocket(newSocket);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !submitted) {
        newSocket.emit('tab_switch', { attemptId: 'active-exam' });
        setWarnings(w => w + 1);
      }
    };

    const handleFullscreenChange = () => {
       setIsFullscreen(!!document.fullscreenElement);
       if (!document.fullscreenElement && !submitted) {
          setWarnings(w => w + 1);
          newSocket.emit('security_violation', { type: 'fullscreen_exit' });
       }
    };

    const preventAction = (e) => e.preventDefault();
    
    const handleKeyDown = (e) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S
      const forbiddenKeys = [
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')),
          (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')),
          (e.ctrlKey && (e.key === 'U' || e.key === 'u')),
          (e.ctrlKey && (e.key === 'S' || e.key === 's')),
          (e.ctrlKey && (e.key === 'P' || e.key === 'p')),
          (e.key === 'F12')
      ];

      if (forbiddenKeys.some(condition => condition)) {
        e.preventDefault();
        setWarnings(w => w + 1);
        newSocket.emit('security_violation', { type: 'forbidden_key', key: e.key });
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

  const submitFinal = async () => {
    if (!window.confirm("Are you prepared to finalize your official submission? This action is irreversible.")) return;
    try {
      if (document.fullscreenElement) {
         document.exitFullscreen();
      }
      const res = await api.post(`/student/exams/${id}/submit`, {
        attemptId: examState.attemptId,
        answers
      });
      setSubmitted(true);
      setResult(res.data.data);
    } catch (err) {
      alert("Submission failed. Please check your connection.");
    }
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

  if (!isFullscreen && !submitted) {
     return (
       <div className="flex-1 flex items-center justify-center p-6">
          <div className="premium-card p-10 max-w-xl text-center border border-accent/30 bg-accent/5">
             <AlertTriangle size={60} className="text-accent mx-auto mb-6" />
             <h2 className="text-3xl font-bold text-white mb-4">Security Lockdown Required</h2>
             <p className="text-gray-400 mb-8 leading-relaxed">This examination requires exclusive access to your screen. Fullscreen mode must be active to proceed. Exiting fullscreen will flag a security violation.</p>
             <button onClick={enterFullscreen} className="bg-accent text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-accent/20 active:scale-95 transition-all">Enable Secure Environment</button>
          </div>
       </div>
     );
  }

  const currentQ = examState.exam.Questions[currentIndex];

  return (
    <div ref={containerRef} className="flex-1 flex flex-col gap-8 w-full animate-in fade-in duration-500 p-8 max-w-7xl mx-auto bg-background min-h-screen relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-accent/20 overflow-hidden z-[100]">
         <div className="h-full bg-accent animate-shimmer" style={{ width: '30%' }} />
      </div>
      
      <div className="flex items-center justify-center gap-2 py-1 bg-accent/10 border-b border-accent/20">
         <Shield size={10} className="text-accent animate-pulse" />
         <span className="text-[8px] font-black uppercase tracking-[0.3em] text-accent">Institutional Lockdown Active • Active Surveillance Enabled</span>
      </div>
      
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
               <div className="text-2xl font-black text-white tabular-nums">00:45:12</div>
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
           <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(c=>c-1)} className="flex items-center gap-2 px-8 py-4 border border-white/10 rounded-2xl text-[10px] text-gray-400 hover:bg-white/5 hover:border-white/20 transition-all font-bold uppercase tracking-widest disabled:opacity-30">
             <ChevronLeft size={16} /> Previous Segment
           </button>
           
           <div className="flex gap-4">
              {currentIndex === examState.exam.Questions.length - 1 ? (
                <button onClick={submitFinal} className="flex items-center gap-2 px-10 py-4 bg-success text-black font-black rounded-2xl shadow-xl shadow-success/20 active:scale-95 transition-all">
                  <Send size={20} /> Finish & Submit
                </button>
              ) : (
                <button onClick={() => setCurrentIndex(c=>c+1)} className="flex items-center gap-2 px-10 py-4 bg-white text-black font-black rounded-2xl shadow-xl shadow-white/20 active:scale-95 transition-all">
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
                  {i+1}
                </button>
             ))}
           </div>
         </div>

         <div className="premium-card p-6 border border-white/10 bg-black/40 flex-1">
            <h3 className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">Security Monitoring</h3>
            <div className="space-y-4">
               <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-green-500">Live Secure Connection</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               </div>
               <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${warnings > 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                  <span className="text-xs font-bold">Policy Violations</span>
                  <span className="text-lg font-black">{warnings}</span>
               </div>
               <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-500">Anti-Cheat Active</span>
                  <CheckCircle size={16} className="text-orange-500" />
               </div>
            </div>
            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed uppercase tracking-tighter">Your activity is being transmitted securely. Any unauthorized interactions will be logged for administrative review.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
