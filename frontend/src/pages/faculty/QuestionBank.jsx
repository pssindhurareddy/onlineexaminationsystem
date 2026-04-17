import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { Database, CheckCircle2, X, Plus, Layers, Target, Settings, Save, ListChecks, Type, AlertCircle, Trash2, Clock, BookOpen, Send, Calendar, ToggleLeft, ToggleRight, Play, Square, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuestionBank() {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [activeTab, setActiveTab] = useState('questions'); // 'questions', 'configure', 'authorization'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Metadata
  const [courses, setCourses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  // New Exam Form State
  const [newExamData, setNewExamData] = useState({ title: '', subject: '', duration: 60 });

  // Question Form State
  const [qType, setQType] = useState('mcq');
  const [qText, setQText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswers, setCorrectAnswers] = useState([0]);
  const [marks, setMarks] = useState(5);
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [explanation, setExplanation] = useState('');

  // Settings Form State
  const [assignedSections, setAssignedSections] = useState([]);

  // Exam Configure State
  const [configForm, setConfigForm] = useState({
    title: '', subject: '', instructions: '',
    total_marks: 100, pass_marks: 40, duration_minutes: 60, max_attempts: 1,
    scheduled_start: '', scheduled_end: '',
    negative_marking_enabled: false, negative_marks_per_wrong: 0,
    shuffle_questions: false, shuffle_options: false,
    show_result_immediately: true, show_answer_key: true,
    status: 'draft'
  });

  useEffect(() => {
    fetchExams();
    fetchMetadata();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMetadata = async () => {
    try {
      const [coursesRes, sectionsRes] = await Promise.all([
        api.get('/org/courses'),
        api.get('/org/sections')
      ]);
      setCourses(coursesRes.data.data);
      setSections(sectionsRes.data.data);
    } catch (err) {
      console.error("Metadata fetch failed", err);
    }
  };

  const fetchExams = async (selectLatest = false) => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
      if (selectLatest && res.data.data.length > 0) {
        loadExam(res.data.data[0].id);
      } else if (res.data.data.length > 0 && !selectedExam) {
         loadExam(res.data.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadExam = async (id) => {
    try {
      const res = await api.get(`/exams/${id}`);
      setSelectedExam(res.data.data);
      const currentAssigned = res.data.data.AssignedSections?.map(s => s.id) || [];
      setAssignedSections(currentAssigned);
      // Populate config form
      const e = res.data.data;
      setConfigForm({
        title: e.title || '',
        subject: e.subject || '',
        instructions: e.instructions || '',
        total_marks: e.total_marks || 100,
        pass_marks: e.pass_marks || 40,
        duration_minutes: e.duration_minutes || 60,
        max_attempts: e.max_attempts || 1,
        scheduled_start: e.scheduled_start ? new Date(e.scheduled_start).toISOString().slice(0, 16) : '',
        scheduled_end: e.scheduled_end ? new Date(e.scheduled_end).toISOString().slice(0, 16) : '',
        negative_marking_enabled: !!e.negative_marking_enabled,
        negative_marks_per_wrong: e.negative_marks_per_wrong || 0,
        shuffle_questions: !!e.shuffle_questions,
        shuffle_options: !!e.shuffle_options,
        show_result_immediately: e.show_result_immediately !== false,
        show_answer_key: e.show_answer_key !== false,
        status: e.status || 'draft'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedExam) return;
    try {
      await api.put(`/exams/${selectedExam.id}`, {
        ...configForm,
        scheduled_start: configForm.scheduled_start || null,
        scheduled_end: configForm.scheduled_end || null
      });
      showToast('Exam settings updated.');
      loadExam(selectedExam.id);
    } catch (err) {
      showToast('Failed to update settings.', 'error');
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exams', {
        title: newExamData.title,
        subject: newExamData.subject,
        duration_minutes: Number(newExamData.duration)
      });
      setShowCreateModal(false);
      setNewExamData({ title: '', subject: '', duration: 60 });
      fetchExams(true);
      showToast("Examination Protocol Initialized.");
    } catch (err) {
      showToast("Protocol initialization failed.", "error");
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();
    if (!selectedExam) return showToast("Select an examination protocol first.", "error");
    
    // Validate MCQ options
    if (qType === 'mcq' && options.some(o => !o.trim())) {
      return showToast("Please fill all response options.", "error");
    }

    const payload = {
      text: qText,
      type: qType,
      options: (qType === 'word' || qType === 'fill_blank') ? [] : (qType === 'true_false' ? ['True', 'False'] : options),
      correct_answer: (qType === 'word' || qType === 'fill_blank') ? [explanation] : (qType === 'true_false' ? [correctAnswers[0]] : correctAnswers), 
      marks: Number(marks),
      subject: subject || selectedExam.subject,
      difficulty: difficulty,
      explanation: explanation
    };

    try {
      await api.post(`/exams/${selectedExam.id}/questions`, payload);
      setQText('');
      setOptions(['', '', '', '']);
      setExplanation('');
      setCorrectAnswers([0]);
      loadExam(selectedExam.id);
      showToast("Question persisted to registry.");
    } catch (err) {
      showToast("Persistence failure.", "error");
    }
  };

  const toggleSectionAssignment = (id) => {
    setAssignedSections(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleUpdateAuthorization = async () => {
    if (!selectedExam) return;
    try {
      await api.post(`/exams/${selectedExam.id}/assign`, { 
        assignedSections 
      });
      showToast("Security Clearance Parameters Updated.");
      loadExam(selectedExam.id);
    } catch (err) {
      showToast("Authorization update failed.", "error");
    }
  };

  const toggleCorrectStatus = (index) => {
    if (qType === 'mcq' || qType === 'true_false') {
      setCorrectAnswers([index]);
    } else {
      if (correctAnswers.includes(index)) {
         setCorrectAnswers(correctAnswers.filter(v => v !== index));
      } else {
         setCorrectAnswers([...correctAnswers, index]);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' : 'bg-success/10 border-success/20 text-success'}`}>
             {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
             <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-shrink-0 flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">Institutional Examination Hub</h1>
          <p className="text-gray-400 mt-1">Design, configure, and authorize academic assessments.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 shadow-inner">
           <button onClick={()=>setActiveTab('questions')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab==='questions' ? 'bg-accent text-background shadow-lg' : 'text-gray-400 hover:text-white'}`}>
             <ListChecks size={16} /> Question Bank
           </button>
           <button onClick={()=>setActiveTab('configure')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab==='configure' ? 'bg-accent text-background shadow-lg' : 'text-gray-400 hover:text-white'}`}>
             <Settings size={16} /> Configure
           </button>
           <button onClick={()=>setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab==='settings' ? 'bg-accent text-background shadow-lg' : 'text-gray-400 hover:text-white'}`}>
             <Target size={16} /> Authorization
           </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* Left Pane - Browser */}
        <div className="w-[320px] premium-card border border-white/5 flex flex-col h-full bg-[#050A15]/60 backdrop-blur-md">
          <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center text-[10px] uppercase tracking-widest font-black text-gray-500">
             Active Protocols
             <button onClick={() => setShowCreateModal(true)} className="text-accent hover:underline flex items-center gap-1"><Plus size={12} /> New</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {exams.map(exam => {
               const isSelected = selectedExam?.id === exam.id;
               return (
                 <div key={exam.id} 
                   className={`rounded-xl border p-4 cursor-pointer transition-all duration-300 ${isSelected ? 'border-accent bg-accent/5' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                   onClick={() => loadExam(exam.id)}
                 >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`font-bold truncate ${isSelected ? 'text-accent' : 'text-gray-300'}`}>{exam.title}</div>
                        <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-bold">{exam.subject} • {exam.status}</div>
                      </div>
                      {isSelected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/org/${orgSlug}/faculty/exams/${exam.id}/results`); }}
                          title="View Results"
                          className="flex-shrink-0 p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent hover:text-background transition-all"
                        >
                          <BarChart3 size={12} />
                        </button>
                      )}
                    </div>
                 </div>
               );
            })}
            {exams.length === 0 && <div className="p-10 text-center text-gray-700 italic text-xs">No active protocols found.</div>}
          </div>
        </div>

        {/* Right Pane - Content Area */}
        <div className="flex-1 premium-card border border-white/5 flex flex-col h-full bg-[#050A15]/80 overflow-hidden relative">
          
          {!selectedExam ? (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
               <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-gray-600">
                  <BookOpen size={40} />
               </div>
               <div>
                  <h2 className="text-2xl font-bold text-white">Select a Protocol to Begin</h2>
                  <p className="text-gray-500 max-w-sm mx-auto mt-2">Initialize a new assessment framework from the side panel to start building your evaluation schema.</p>
               </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'questions' ? (
                <motion.div key="questions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col h-full overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <div className="flex gap-1">
                        {['mcq', 'true_false', 'word'].map(t => (
                          <button key={t} onClick={()=>setQType(t)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${qType===t ? 'bg-accent/20 text-accent border border-accent/30 shadow-glow-sm' : 'text-gray-500 hover:text-gray-300'}`}>
                            {t === 'word' ? 'Fill In Blank' : t === 'mcq' ? 'Multiple Choice' : 'True / False'}
                          </button>
                        ))}
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Protocol Weight: <span className="text-white ml-2">{selectedExam?.Questions?.reduce((acc, q) => acc + q.marks, 0) || 0} pts</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form onSubmit={saveQuestion} className="max-w-4xl space-y-8">
                      <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Layers size={12} /> Points</label>
                            <input type="number" required value={marks} onChange={e=>setMarks(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Settings size={12} /> Difficulty</label>
                            <select value={difficulty} onChange={e=>setDifficulty(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent cursor-pointer outline-none">
                                <option value="easy">Foundation</option>
                                <option value="medium">Intermediate</option>
                                <option value="hard">Advanced</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Database size={12} /> Tag</label>
                            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="General" className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none" />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Problem Statement</label>
                          <textarea required rows={4} value={qText} onChange={e=>setQText(e.target.value)} placeholder={qType === 'word' ? "The capital of France is [_____]..." : "Enter the question context..."} className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-lg leading-relaxed focus:border-accent resize-none shadow-inner outline-none transition-all" />
                      </div>

                      {qType !== 'word' ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-gray-500">
                              <label className="text-[10px] font-black uppercase tracking-widest">Construct Options</label>
                              {qType === 'mcq' && (
                                <button type="button" onClick={() => setOptions([...options, ''])} className="text-accent flex items-center gap-1 text-[10px] font-black group transition-all">
                                  <Plus size={14} className="group-hover:rotate-90 transition-transform" /> ADD IDENTIFIER
                                </button>
                              )}
                          </div>
                          <div className="space-y-3">
                            {(qType === 'true_false' ? ['True', 'False'] : options).map((opt, i) => {
                              const isCorrect = correctAnswers.includes(i);
                              return (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isCorrect ? 'border-success/50 bg-success/5 shadow-glow-sm' : 'border-white/5 bg-black/20'}`}>
                                    <button type="button" onClick={() => toggleCorrectStatus(i)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCorrect ? 'border-success bg-success' : 'border-gray-700 hover:border-gray-500'}`}>
                                      {isCorrect && <CheckCircle2 size={12} className="text-black" />}
                                    </button>
                                    <input required disabled={qType === 'true_false'} value={qType === 'true_false' ? opt : opt} onChange={e => {
                                      const n = [...options]; n[i] = e.target.value; setOptions(n);
                                    }} className="flex-1 bg-transparent border-none outline-none text-white text-sm" placeholder={`Option ${i+1} description...`} />
                                    {qType === 'mcq' && options.length > 2 && <button type="button" onClick={() => setOptions(options.filter((_, idx)=>idx!==i))} className="text-gray-700 hover:text-danger"><Trash2 size={16} /></button>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                       <div className="space-y-4 p-8 bg-accent/5 border border-accent/20 rounded-2xl relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform">
                              <Type size={120} />
                           </div>
                           <label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                             <Type size={14} /> Expected Match Keywords
                           </label>
                           <input 
                             required 
                             placeholder="Enter the keyword(s) for auto-grading..." 
                             className="w-full bg-black/60 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none relative z-10 font-mono text-sm" 
                             value={explanation}
                             onChange={e => setExplanation(e.target.value)}
                           />
                           <p className="text-[8px] text-gray-600 italic font-black uppercase tracking-widest mt-2">System will perform strict lexical matching against the submitted response.</p>
                        </div>
                      )}

                      <div className="pt-8 border-t border-white/5 flex justify-end gap-3">
                        <button type="submit" className="flex items-center gap-3 bg-accent hover:bg-accent/80 text-background font-black py-5 px-12 rounded-2xl shadow-xl shadow-accent/20 active:scale-95 transition-all text-xs uppercase tracking-widest">
                            <Save size={18} /> Persist to Protocol
                        </button>
                      </div>
                    </form>

                    <div className="mt-20 border-t border-white/5 pt-10">
                       <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Established Registry ({selectedExam.Questions?.length || 0} Questions)</h3>
                       <div className="space-y-4 pb-20">
                          {selectedExam.Questions?.map((q, i) => (
                            <div key={q.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-start group">
                               <div className="space-y-2">
                                  <div className="flex items-center gap-3">
                                     <span className="text-[10px] font-black bg-white/5 px-2 py-0.5 rounded text-gray-600">Q-{i+1}</span>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-accent">{q.type.replace('_', ' ')}</span>
                                  </div>
                                  <p className="text-gray-300 text-sm max-w-2xl">{q.text}</p>
                               </div>
                               <div className="flex items-center gap-2">
                                  <button onClick={async () => {
                                     if (confirm("Revoke this question identity?")) {
                                        await api.delete(`/exams/questions/${q.id}`);
                                        loadExam(selectedExam.id);
                                        showToast("Question successfully revoked.");
                                     }
                                  }} className="p-3 bg-black/40 border border-white/5 text-gray-700 hover:text-danger hover:border-danger/20 rounded-xl transition-all"><Trash2 size={16} /></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === 'settings' ? (
                <motion.div key="authorization" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-10 space-y-12 overflow-y-auto custom-scrollbar">
                   <div className="space-y-6">
                      <h2 className="text-xl font-bold font-heading flex items-center gap-3">
                         <Target size={24} className="text-accent" /> Institutional Authorized Cohorts
                      </h2>
                      <p className="text-gray-400 text-sm max-w-xl">Specify the student sections and batches permitted to access and participate in this evaluation protocol.</p>
                      
                      <div className="grid md:grid-cols-2 gap-8 mt-10">
                         <div className="space-y-4 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Degree Pathways</label>
                            <p className="text-[10px] text-gray-600">Click to filter cohorts</p>
                            <div className="space-y-2">
                               {courses.map(c => {
                                 const isActive = selectedCourseId === c.id;
                                 return (
                                 <div key={c.id}
                                   onClick={() => setSelectedCourseId(isActive ? null : c.id)}
                                   className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition-all ${isActive ? 'border-accent bg-accent/5' : 'border-white/5 bg-black/20 hover:border-white/20'}`}>
                                    <div>
                                       <div className={`font-bold ${isActive ? 'text-accent' : 'text-gray-300'}`}>{c.name}</div>
                                       <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">{c.code}</div>
                                    </div>
                                    {isActive && <CheckCircle2 size={16} className="text-accent" />}
                                 </div>
                                 );
                               })}
                            </div>
                         </div>

                         <div className="space-y-4 text-left">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cohort Access</label>
                            <p className="text-[10px] text-gray-600">{selectedCourseId ? `Showing cohorts for selected pathway` : 'All cohorts'}</p>
                            <div className="space-y-2">
                               {sections.filter(s => !selectedCourseId || s.department_id === selectedCourseId).map(s => {
                                 const isActive = assignedSections.includes(s.id);
                                 return (
                                   <div key={s.id} 
                                     className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${isActive ? 'border-accent bg-accent/5' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                                     onClick={() => toggleSectionAssignment(s.id)}
                                   >
                                      <div>
                                         <div className={`font-bold ${isActive ? 'text-accent' : 'text-gray-300'}`}>{s.name}</div>
                                         <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">Year {s.year}</div>
                                      </div>
                                      {isActive ? <CheckCircle2 size={18} className="text-accent shadow-glow" /> : <div className="w-4 h-4 rounded-full border border-gray-800" />}
                                   </div>
                                 );
                               })}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="pt-10 border-t border-white/5 flex justify-end">
                      <button 
                        onClick={handleUpdateAuthorization}
                        className="flex items-center gap-2 bg-white text-background font-black px-10 py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest"
                      >
                         <Send size={18} /> Update Authorization parameters
                      </button>
                   </div>
                </motion.div>
              ) : activeTab === 'configure' ? (
                <motion.div key="configure" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-8 overflow-y-auto custom-scrollbar h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Exam Configuration</h2>
                      <p className="text-gray-500 text-sm mt-1">Set scheduling, scoring rules, and behavior settings.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Status badge */}
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        selectedExam?.status === 'active' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                        selectedExam?.status === 'published' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        selectedExam?.status === 'ended' ? 'bg-gray-500/10 border-gray-500/20 text-gray-400' :
                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                      }`}>{selectedExam?.status}</span>
                    </div>
                  </div>

                  {/* Status control */}
                  <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Exam Status</label>
                    <div className="flex gap-2 flex-wrap">
                      {['draft', 'published', 'active', 'ended'].map(s => (
                        <button key={s} onClick={() => setConfigForm(f => ({ ...f, status: s }))} className={`px-5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${configForm.status === s ? 'bg-accent text-background border-accent' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'}`}>
                          {s === 'draft' ? '⚪ Draft' : s === 'published' ? '🔵 Published' : s === 'active' ? '🟢 Active' : '🔴 Ended'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-600">Students can only attempt exams with status <span className="text-accent">Active</span>.</p>
                  </div>

                  {/* Basic settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Exam Title</label>
                      <input value={configForm.title} onChange={e => setConfigForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject</label>
                      <input value={configForm.subject} onChange={e => setConfigForm(f => ({ ...f, subject: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Marks</label>
                      <input type="number" value={configForm.total_marks} onChange={e => setConfigForm(f => ({ ...f, total_marks: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pass Marks</label>
                      <input type="number" value={configForm.pass_marks} onChange={e => setConfigForm(f => ({ ...f, pass_marks: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1"><Clock size={10} /> Duration (minutes)</label>
                      <input type="number" value={configForm.duration_minutes} onChange={e => setConfigForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Max Attempts</label>
                      <input type="number" min="1" value={configForm.max_attempts} onChange={e => setConfigForm(f => ({ ...f, max_attempts: Number(e.target.value) }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><Calendar size={12} /> Exam Window (Optional)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-600">Start Date & Time</label>
                        <input type="datetime-local" value={configForm.scheduled_start} onChange={e => setConfigForm(f => ({ ...f, scheduled_start: e.target.value }))} className="w-full bg-[#050A15] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-600">End Date & Time</label>
                        <input type="datetime-local" value={configForm.scheduled_end} onChange={e => setConfigForm(f => ({ ...f, scheduled_end: e.target.value }))} className="w-full bg-[#050A15] border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none text-sm" />
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-600">Students can only start the exam within this time window if set.</p>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Student Instructions</label>
                    <textarea rows={4} value={configForm.instructions} onChange={e => setConfigForm(f => ({ ...f, instructions: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none text-sm resize-none" placeholder="e.g. Read all questions carefully before answering..." />
                  </div>

                  {/* Toggles */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'negative_marking_enabled', label: 'Negative Marking', desc: 'Deduct marks for wrong answers' },
                      { key: 'shuffle_questions', label: 'Shuffle Questions', desc: 'Randomize question order per student' },
                      { key: 'shuffle_options', label: 'Shuffle Options', desc: 'Randomize MCQ option order per student' },
                      { key: 'show_result_immediately', label: 'Instant Results', desc: 'Show score immediately after submission' },
                      { key: 'show_answer_key', label: 'Show Answer Key', desc: 'Display correct answers after submission' },
                    ].map(({ key, label, desc }) => (
                      <div key={key} onClick={() => setConfigForm(f => ({ ...f, [key]: !f[key] }))} className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${configForm[key] ? 'bg-accent/5 border-accent/20' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                        <div>
                          <p className={`text-sm font-bold ${configForm[key] ? 'text-white' : 'text-gray-400'}`}>{label}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">{desc}</p>
                        </div>
                        {configForm[key] ? <ToggleRight size={24} className="text-accent flex-shrink-0" /> : <ToggleLeft size={24} className="text-gray-600 flex-shrink-0" />}
                      </div>
                    ))}

                    {configForm.negative_marking_enabled && (
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-red-400">Marks Deducted Per Wrong Answer</label>
                        <input type="number" min="0" step="0.25" value={configForm.negative_marks_per_wrong} onChange={e => setConfigForm(f => ({ ...f, negative_marks_per_wrong: Number(e.target.value) }))} className="w-full bg-black/60 border border-red-500/20 rounded-xl p-3 text-white focus:border-red-400 outline-none text-sm" />
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-end">
                    <button onClick={handleUpdateSettings} className="flex items-center gap-2 bg-accent text-background font-black px-10 py-5 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-widest">
                      <Save size={18} /> Save Configuration
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          )}

          {/* Create Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <div className="absolute inset-0 z-40 bg-[#050A15]/80 backdrop-blur-md flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="premium-card max-w-lg w-full p-8 border border-white/10 space-y-8 bg-black">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent">
                            <Layers size={20} />
                         </div>
                         <h2 className="text-xl font-bold font-heading">Protocol Initialization</h2>
                      </div>
                      <button onClick={() => setShowCreateModal(false)} className="text-gray-600 hover:text-white transition-colors"><X size={24} /></button>
                   </div>
                   
                   <form onSubmit={handleCreateExam} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Protocol Heading</label>
                        <input required value={newExamData.title} onChange={e=>setNewExamData({...newExamData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="e.g. End Semester - Advanced Algorithms" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Subject Space</label>
                          <input required value={newExamData.subject} onChange={e=>setNewExamData({...newExamData, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-accent outline-none" placeholder="Computer Science" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Window (Minutes)</label>
                          <div className="relative">
                             <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                             <input type="number" required value={newExamData.duration} onChange={e=>setNewExamData({...newExamData, duration: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-accent outline-none" />
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="w-full bg-accent text-background font-black py-5 rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] transition-all text-xs uppercase tracking-[0.2em]">
                        Establish Protocol
                      </button>
                   </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
