import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  BarChart3, Clock, User, Download, ChevronLeft, AlertTriangle, CheckCircle,
  XCircle, Eye, Activity, TrendingUp, Award, Edit3, Save, X as XIcon
} from 'lucide-react';

export default function ExamResults() {
  const { examId, orgSlug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Manual evaluation state
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editMarks, setEditMarks] = useState('');
  const [editComment, setEditComment] = useState('');
  const [savingEval, setSavingEval] = useState(false);

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

  const handleExportCSV = async () => {
    try {
      const res = await api.get(`/exams/${examId}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam_results_${examId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed. Please try again.');
    }
  };

  const handleExportPDF = () => {
    if (!data) return;
    const { exam, attempts } = data;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setFontSize(18);
    doc.text(`Exam Results: ${exam.title}`, 14, 18);
    doc.setFontSize(11);
    doc.text(`Subject: ${exam.subject}  |  Total Marks: ${exam.total_marks}  |  Pass Marks: ${exam.pass_marks}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

    const rows = attempts.map(a => [
      a.User?.name || '—',
      a.User?.email || '—',
      a.total_score != null ? `${a.total_score}/${exam.total_marks}` : '—',
      a.percentage != null ? `${a.percentage}%` : '—',
      a.total_score != null ? (a.total_score >= exam.pass_marks ? 'Pass' : 'Fail') : '—',
      a.status,
      a.time_taken_seconds ? `${Math.floor(a.time_taken_seconds / 60)}m ${a.time_taken_seconds % 60}s` : '—',
      a.tab_switch_count ?? 0,
      a.started_at ? new Date(a.started_at).toLocaleString() : '—'
    ]);

    autoTable(doc, {
      startY: 38,
      head: [['Student', 'Email', 'Score', '%', 'Result', 'Status', 'Time', 'Tab Switches', 'Started At']],
      body: rows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [0, 194, 255], textColor: 0, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 248, 255] }
    });

    doc.save(`exam_results_${examId}.pdf`);
  };

  const startEditAnswer = (ans) => {
    setEditingAnswerId(ans.id);
    setEditMarks(ans.marks_awarded != null ? String(ans.marks_awarded) : '0');
    setEditComment(ans.evaluator_comment || '');
  };

  const cancelEdit = () => {
    setEditingAnswerId(null);
    setEditMarks('');
    setEditComment('');
  };

  const saveManualEval = async (attemptId, answerId, questionMaxMarks) => {
    const marksNum = parseFloat(editMarks);
    if (isNaN(marksNum) || marksNum < 0 || marksNum > questionMaxMarks) {
      alert(`Marks must be between 0 and ${questionMaxMarks}.`);
      return;
    }
    setSavingEval(true);
    try {
      const res = await api.patch(`/exams/attempts/${attemptId}/answers/${answerId}`, {
        marks_awarded: marksNum,
        evaluator_comment: editComment
      });
      // Update local state so the modal reflects the new value without a full refetch
      setSelectedAttempt(prev => {
        const newAnswers = prev.AttemptAnswers.map(a =>
          a.id === answerId
            ? { ...a, marks_awarded: marksNum, evaluator_comment: editComment, manually_evaluated: true, is_correct: marksNum > 0 }
            : a
        );
        return { ...prev, AttemptAnswers: newAnswers, total_score: res.data.data.newTotal, percentage: res.data.data.percentage };
      });
      // Also refresh the main data table row
      setData(prev => ({
        ...prev,
        attempts: prev.attempts.map(a =>
          a.id === attemptId
            ? { ...a, total_score: res.data.data.newTotal, percentage: res.data.data.percentage }
            : a
        )
      }));
      cancelEdit();
    } catch (err) {
      alert('Failed to save evaluation.');
    } finally {
      setSavingEval(false);
    }
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
        <div className="flex items-center gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all border border-white/10">
            <Download size={16} /> CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-6 py-3 bg-accent text-background font-black rounded-2xl text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all">
            <Download size={16} /> PDF
          </button>
        </div>
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
                <button onClick={() => { setSelectedAttempt(null); cancelEdit(); }} className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {selectedAttempt.AttemptAnswers?.map((ans, i) => {
                const isDescriptive = ans.Question?.type === 'word' || ans.Question?.type === 'fill_blank';
                const isEditing = editingAnswerId === ans.id;
                return (
                  <div key={ans.id} className={`p-5 rounded-2xl border ${ans.is_correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Q{i + 1}</span>
                      <div className="flex items-center gap-2">
                        {ans.manually_evaluated && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 rounded-full">Manual</span>
                        )}
                        <span className="text-xs font-bold text-gray-500">{ans.marks_awarded !== null ? `${ans.marks_awarded > 0 ? '+' : ''}${ans.marks_awarded}` : '—'} pts</span>
                        {ans.is_correct ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                        {isDescriptive && !isEditing && (
                          <button onClick={() => startEditAnswer(ans)} className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all" title="Override marks">
                            <Edit3 size={12} />
                          </button>
                        )}
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
                    {!ans.is_correct && ans.Question?.correct_answer && !isDescriptive && (
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
                    {ans.evaluator_comment && !isEditing && (
                      <p className="mt-2 text-xs text-purple-300 italic">Evaluator note: {ans.evaluator_comment}</p>
                    )}
                    {isDescriptive && isEditing && (
                      <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Manual Evaluation</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Marks (0–{ans.Question?.marks ?? '?'})</label>
                            <input
                              type="number"
                              min={0}
                              max={ans.Question?.marks ?? undefined}
                              step={0.5}
                              value={editMarks}
                              onChange={e => setEditMarks(e.target.value)}
                              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-purple-400 outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Evaluator Comment (optional)</label>
                          <input
                            type="text"
                            value={editComment}
                            onChange={e => setEditComment(e.target.value)}
                            placeholder="e.g. Partial credit for correct reasoning..."
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:border-purple-400 outline-none"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button onClick={cancelEdit} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold">
                            <XIcon size={12} /> Cancel
                          </button>
                          <button
                            disabled={savingEval}
                            onClick={() => saveManualEval(selectedAttempt.id, ans.id, ans.Question?.marks ?? Infinity)}
                            className="flex items-center gap-1 px-5 py-2 rounded-xl bg-purple-500 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-400 transition-all disabled:opacity-60"
                          >
                            <Save size={12} /> {savingEval ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
