import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  BarChart3, Clock, User, Download, ChevronLeft, AlertTriangle, CheckCircle,
  XCircle, Eye, Activity, TrendingUp, Award
} from 'lucide-react';

export default function ExamResults() {
  const { examId, orgSlug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!examId) return;
    fetchResults();
  }, [examId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/exams/${examId}/results`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(`${import.meta.env.VITE_API_URL || ''}/api/exams/${examId}/export`, '_blank');
  };

  const formatDuration = (secs) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const getStatusBadge = (attempt) => {
    if (attempt.status === 'in_progress') return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">In Progress</span>;
    if (attempt.status === 'auto_submitted') return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-orange-500/10 border border-orange-500/20 text-orange-400">Auto-Submitted</span>;
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 border border-green-500/20 text-green-400">Submitted</span>;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const { exam, attempts, stats } = data;

  const filtered = filterStatus === 'all' ? attempts
    : filterStatus === 'submitted' ? attempts.filter(a => a.status !== 'in_progress')
    : attempts.filter(a => a.status === 'in_progress');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/org/${orgSlug}/faculty/question-bank`)} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{exam.title}</h1>
            <p className="text-gray-500 text-sm mt-1">{exam.subject} • Exam Results & Analytics</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-accent text-background font-black rounded-2xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Submitted', value: stats.total, icon: CheckCircle, color: 'text-green-400' },
          { label: 'In Progress', value: stats.inProgress, icon: Activity, color: 'text-yellow-400' },
          { label: 'Avg Score', value: stats.avgScore || '—', icon: TrendingUp, color: 'text-accent' },
          { label: 'Highest', value: stats.highestScore || '—', icon: Award, color: 'text-purple-400' },
          { label: 'Lowest', value: stats.lowestScore !== null ? stats.lowestScore : '—', icon: BarChart3, color: 'text-red-400' },
          { label: 'Avg Time', value: stats.avgTimeSecs ? formatDuration(stats.avgTimeSecs) : '—', icon: Clock, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="premium-card p-5 border border-white/5 bg-[#050A15]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{label}</span>
              <Icon size={14} className={color} />
            </div>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {['all', 'submitted', 'in_progress'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} className={`px-5 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f ? 'bg-accent text-background border-accent' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}>
            {f === 'all' ? `All (${attempts.length})` : f === 'submitted' ? `Submitted (${attempts.filter(a => a.status !== 'in_progress').length})` : `In Progress (${attempts.filter(a => a.status === 'in_progress').length})`}
          </button>
        ))}
      </div>

      {/* Results Table */}
      <div className="premium-card border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
              <tr>
                <th className="px-6 py-4 font-black">Student</th>
                <th className="px-6 py-4 font-black">Score</th>
                <th className="px-6 py-4 font-black">%</th>
                <th className="px-6 py-4 font-black">Result</th>
                <th className="px-6 py-4 font-black">Time Taken</th>
                <th className="px-6 py-4 font-black">Tab Switches</th>
                <th className="px-6 py-4 font-black">Started At</th>
                <th className="px-6 py-4 font-black">Status</th>
                <th className="px-6 py-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-600 text-sm">No submissions yet.</td>
                </tr>
              )}
              {filtered.map(attempt => {
                const passed = attempt.total_score !== null && attempt.total_score >= exam.pass_marks;
                const suspicious = attempt.tab_switch_count > 3;
                return (
                  <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white font-semibold text-sm">{attempt.User?.name}</p>
                        <p className="text-gray-600 text-xs">{attempt.User?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-black">{attempt.total_score ?? '—'}</span>
                      <span className="text-gray-600 text-xs">/{exam.total_marks}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${attempt.percentage >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                        {attempt.percentage != null ? `${attempt.percentage}%` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {attempt.total_score !== null ? (
                        passed
                          ? <span className="flex items-center gap-1 text-green-400 text-xs font-bold"><CheckCircle size={12} /> Pass</span>
                          : <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><XCircle size={12} /> Fail</span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{formatDuration(attempt.time_taken_seconds)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-black text-sm flex items-center gap-1 ${suspicious ? 'text-red-400' : 'text-gray-400'}`}>
                        {suspicious && <AlertTriangle size={12} />}
                        {attempt.tab_switch_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {attempt.started_at ? new Date(attempt.started_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(attempt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setSelectedAttempt(attempt)} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer Review Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col premium-card border border-white/10 bg-[#050A15]">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedAttempt.User?.name}</h2>
                <p className="text-gray-500 text-xs">{selectedAttempt.User?.email} • Score: {selectedAttempt.total_score}/{exam.total_marks} • Time: {formatDuration(selectedAttempt.time_taken_seconds)}</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedAttempt.tab_switch_count > 0 && (
                  <span className="flex items-center gap-1 text-orange-400 text-xs font-bold border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 rounded-full">
                    <AlertTriangle size={12} /> {selectedAttempt.tab_switch_count} tab switches
                  </span>
                )}
                <button onClick={() => setSelectedAttempt(null)} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {selectedAttempt.AttemptAnswers?.map((ans, i) => (
                <div key={ans.id} className={`p-5 rounded-2xl border ${ans.is_correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Q{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500">{ans.marks_awarded !== null ? `${ans.marks_awarded > 0 ? '+' : ''}${ans.marks_awarded}` : '—'} pts</span>
                      {ans.is_correct ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                    </div>
                  </div>
                  <p className="text-white text-sm font-medium mb-2">{ans.Question?.text}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Student answered:</span>
                    <span className={`font-bold ${ans.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                      {Array.isArray(ans.selected_answer) ? ans.selected_answer.map(a => {
                        if (ans.Question?.options && ans.Question.options[a] !== undefined) return ans.Question.options[a];
                        return String(a);
                      }).join(', ') : '—'}
                    </span>
                  </div>
                  {!ans.is_correct && ans.Question?.correct_answer && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="text-gray-500">Correct answer:</span>
                      <span className="font-bold text-green-400">
                        {Array.isArray(ans.Question.correct_answer) ? ans.Question.correct_answer.map(a => {
                          if (ans.Question?.options && ans.Question.options[a] !== undefined) return ans.Question.options[a];
                          return String(a);
                        }).join(', ') : String(ans.Question.correct_answer)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {(!selectedAttempt.AttemptAnswers || selectedAttempt.AttemptAnswers.length === 0) && (
                <p className="text-center text-gray-600 py-10">No answer data available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
