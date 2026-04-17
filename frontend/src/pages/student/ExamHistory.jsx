import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CheckCircle, XCircle, Clock, BookOpen, Target, Calendar } from 'lucide-react';

export default function ExamHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/student/history');
      setAttempts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Examination History</h1>
        <p className="text-gray-400 mt-2 text-lg">Your complete record of completed assessments.</p>
      </div>

      {attempts.length === 0 ? (
        <div className="py-32 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
            <BookOpen size={30} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-300">No completed examinations</h3>
            <p className="text-gray-500 text-sm mt-1">Your submitted exam results will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const exam = attempt.Exam;
            const passed = attempt.total_score !== null && attempt.total_score >= (exam?.pass_marks || 0);
            const showResult = exam?.show_result_immediately !== false;
            const percentage = exam?.total_marks && attempt.total_score !== null
              ? Math.round((attempt.total_score / exam.total_marks) * 100)
              : null;

            return (
              <div key={attempt.id} className="premium-card p-6 border border-white/5 bg-black/40 flex items-center justify-between group hover:border-white/10 transition-all">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${showResult ? (passed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400') : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    {showResult
                      ? (passed ? <CheckCircle size={24} /> : <XCircle size={24} />)
                      : <BookOpen size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg tracking-tight">{exam?.title || 'Examination'}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      <span className="text-accent">{exam?.subject}</span>
                      <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(attempt.submitted_at)}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {formatDuration(attempt.time_taken_seconds)}</span>
                    </div>
                    {attempt.status === 'auto_submitted' && (
                      <span className="mt-1 inline-block text-[9px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                        Auto-Submitted
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  {showResult && attempt.total_score !== null ? (
                    <>
                      <div className={`text-3xl font-black ${passed ? 'text-green-400' : 'text-red-400'}`}>
                        {attempt.total_score}
                        <span className="text-base text-gray-600 font-bold"> / {exam?.total_marks}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <span className="text-[10px] text-gray-500 font-bold">{percentage}%</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${passed ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                          {passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-600 flex items-center gap-2">
                      <Target size={14} /> Result Pending
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
