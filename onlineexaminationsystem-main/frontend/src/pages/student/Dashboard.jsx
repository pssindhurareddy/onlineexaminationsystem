import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, Target, CheckCircle2 } from 'lucide-react';

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem('student_subjects')) || []; }
    catch (e) { return []; }
  });
  const { orgSlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Sync initial subjects to backend then fetch exams
    const init = async () => {
      try {
        const subRes = await api.get('/exams/subjects');
        setAvailableSubjects(subRes.data.data || []);
      } catch (e) { }

      if (selectedSubjects.length > 0) {
        try { await api.put('/student/subjects', { subjects: selectedSubjects }); } catch (e) { }
      }
      fetchExams();
    };
    init();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSubject = async (subj) => {
    const newSubjects = selectedSubjects.includes(subj)
      ? selectedSubjects.filter(s => s !== subj)
      : [...selectedSubjects, subj];

    setSelectedSubjects(newSubjects);
    localStorage.setItem('student_subjects', JSON.stringify(newSubjects));

    try {
      await api.put('/student/subjects', { subjects: newSubjects });
      fetchExams();
    } catch (err) {
      console.error("Failed to update subjects");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">My Assigned Examinations</h1>
          <p className="text-gray-400 mt-2 text-lg">Select an examination to launch your secure session.</p>
        </div>
        <div className="hidden md:block">
          <div className="px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Session Engine Active
          </div>
        </div>
      </div>

      {/* SUBJECT SELECTION AREA */}
      <div className="premium-card p-6 border border-white/5 bg-black/40">
        <h2 className="text-sm font-black uppercase text-gray-400 tracking-widest mb-4">Select your subjects</h2>
        <div className="flex flex-wrap gap-3">
          {availableSubjects.map(subj => {
            const isSelected = selectedSubjects.includes(subj);
            return (
              <button
                key={subj}
                onClick={() => toggleSubject(subj)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${isSelected ? 'bg-accent/20 text-accent border-accent/40 shadow-[0_0_15px_rgba(0,194,255,0.1)]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
              >
                {isSelected && <CheckCircle2 size={14} />} {subj}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {exams.map(exam => {
          const now = new Date();
          const hasStarted = !exam.scheduled_start || now >= new Date(exam.scheduled_start);
          const hasEnded = exam.scheduled_end && now > new Date(exam.scheduled_end);
          const canStart = hasStarted && !hasEnded;

          return (
            <div key={exam.id} className="premium-card p-8 border border-white/5 hover:border-accent/40 hover:shadow-[0_0_40px_rgba(0,194,255,0.05)] transition-all flex flex-col justify-between group h-[280px]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                    <BookOpen size={20} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">
                    {exam.subject}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight group-hover:text-accent transition-colors">{exam.title}</h3>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mt-4">
                  <div className="flex items-center gap-1.5"><Clock size={14} /> {exam.duration_minutes} Minutes</div>
                  <div className="flex items-center gap-1.5"><Target size={14} /> {exam.total_marks} Marks</div>
                </div>
              </div>
              <button
                onClick={() => canStart ? navigate(`/org/${orgSlug}/student/take-exam/${exam.id}`) : null}
                disabled={!canStart}
                className={`w-full font-bold py-4 rounded-2xl mt-8 transition-all active:scale-[0.98] shadow-lg uppercase tracking-widest text-[10px] ${canStart ? 'bg-white/5 group-hover:bg-accent text-gray-300 group-hover:text-background' : 'bg-white/5 text-gray-600 opacity-50 cursor-not-allowed'}`}
              >
                {!hasStarted ? `Starts ${new Date(exam.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : hasEnded ? 'Assessment Expired' : 'Commence Assessment Session'}
              </button>
            </div>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-full py-24 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-600">
              <BookOpen size={30} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-300">No active examinations</h3>
              <p className="text-gray-500 text-sm">You are currently not assigned to any live examination sessions.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
