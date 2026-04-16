import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Clock, CheckCircle, XCircle, BookOpen, Award, Activity } from 'lucide-react';

export default function ExamHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/student/my-attempts');
      setAttempts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load exam history', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-5xl mx-auto p-4">
      <div>
        <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Examination History</h1>
        <p className="text-gray-400 mt-2">A complete record of all your past examination attempts.</p>
      </div>

      {attempts.length === 0 ? (
        <div className="py-24 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
            <BookOpen size={30} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-300">No attempts yet</h3>
            <p className="text-gray-500 text-sm">You haven't completed any exams yet. Start an exam from your dashboard.</p>
          </div>
        </div>
      ) : (
        <div className="premium-card border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
                <tr>
                  <th className="px-6 py-4 font-black">Exam</th>
                  <th className="px-6 py-4 font-black">Score</th>
                  <th className="px-6 py-4 font-black">%</th>
                  <th className="px-6 py-4 font-black">Result</th>
                  <th className="px-6 py-4 font-black">Time Taken</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attempts.map(attempt => {
                  const resultHidden = !attempt.showResultImmediately && attempt.status !== 'in_progress';
                  return (
                    <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-semibold text-sm">{attempt.examTitle}</p>
                          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{attempt.examSubject}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {resultHidden ? (
                          <span className="text-gray-600 text-xs italic">Pending</span>
                        ) : (
                          <>
                            <span className="text-white font-black">{attempt.score ?? '—'}</span>
                            {attempt.totalMarks != null && (
                              <span className="text-gray-600 text-xs">/{attempt.totalMarks}</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {resultHidden ? (
                          <span className="text-gray-600 text-xs italic">—</span>
                        ) : (
                          <span className={`font-bold ${attempt.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                            {attempt.percentage != null ? `${attempt.percentage}%` : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {resultHidden ? (
                          <span className="text-gray-500 text-xs italic flex items-center gap-1"><Activity size={12} /> Results Pending</span>
                        ) : attempt.score !== null ? (
                          attempt.passed
                            ? <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle size={12} /> Pass</span>
                            : <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><XCircle size={12} /> Fail</span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs flex items-center gap-1.5">
                        <Clock size={12} /> {formatDuration(attempt.timeTakenSeconds)}
                      </td>
                      <td className="px-6 py-4">
                        {attempt.status === 'in_progress' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">In Progress</span>
                        ) : attempt.status === 'auto_submitted' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 text-orange-400">Auto-Submitted</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 text-green-400">Submitted</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(attempt.submittedAt || attempt.startedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
