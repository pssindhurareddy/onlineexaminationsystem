import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Clock, Target, Layers, CheckCircle, Info, X } from 'lucide-react';

export default function StudentDashboard() {
  const [availableBatches, setAvailableBatches] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchStudentAcademics();
  }, []);

  const fetchStudentAcademics = async () => {
    try {
      setLoading(true);
      const userRes = await api.get('/auth/me');
      setMyBatches(userRes.data.data.Batches || []);

      const structRes = await api.get('/org/structure');
      const allBatches = structRes.data.data.flatMap(dept => 
        (dept.Batches || []).map(b => ({ ...b, deptName: dept.name }))
      );
      setAvailableBatches(allBatches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (batchId) => {
    try {
      await api.post('/org/sections/subscribe', { batchId });
      fetchStudentAcademics();
      fetchExams(); // Refresh exams as they are assigned to batches
    } catch (err) {
      alert("Enrollment failed.");
    }
  };

  const launchExam = (examId) => {
    const url = `/org/${orgSlug}/student/take-exam/${examId}`;
    const windowFeatures = "menubar=no,location=no,resizable=yes,scrollbars=yes,status=no,toolbar=no,fullscreen=yes";
    window.open(url, `Exam_${examId}`, windowFeatures);
  };

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">My Assigned Examinations</h1>
          <p className="text-gray-400 mt-2 text-lg">Select an examination to launch your secure session.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={() => setShowBrowser(true)}
             className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all group"
           >
              <Layers size={18} className="text-accent group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Enroll in Subjects</span>
           </button>
           <div className="hidden md:block">
              <div className="px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-gray-500 uppercase tracking-widest bg-white/5 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Live Session Engine Active
              </div>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {exams.map(exam => {
           const now = new Date();
           const hasStarted = !exam.scheduled_start || now >= new Date(exam.scheduled_start);
           const hasEnded = (exam.scheduled_end && now > new Date(exam.scheduled_end)) || exam.status === 'ended';
           const isActive = exam.status === 'active';
           const canStart = isActive && hasStarted && !hasEnded;
           return (
           <div key={exam.id} className={`premium-card p-8 border hover:shadow-[0_0_40px_rgba(0,194,255,0.05)] transition-all flex flex-col justify-between group h-[300px] ${canStart ? 'border-white/5 hover:border-accent/40' : 'border-white/5 opacity-75'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                   <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <BookOpen size={20} />
                   </div>
                   <div className="flex items-center gap-2">
                     <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                       exam.status === 'active' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                       exam.status === 'ended' ? 'bg-gray-500/10 border-gray-500/20 text-gray-500' :
                       exam.status === 'published' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                       'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                     }`}>{exam.status}</span>
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full border border-white/5">
                        {exam.subject}
                     </span>
                   </div>
                </div>
                <h3 className={`text-2xl font-bold mb-2 leading-tight transition-colors ${canStart ? 'text-white group-hover:text-accent' : 'text-gray-400'}`}>{exam.title}</h3>
                <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mt-2">
                   <div className="flex items-center gap-1.5"><Clock size={14} /> {exam.duration_minutes} Minutes</div>
                   <div className="flex items-center gap-1.5"><Target size={14} /> {exam.total_marks} Marks</div>
                </div>
                {exam.scheduled_start && !hasEnded && (
                  <div className="mt-2 text-[10px] text-gray-600 flex items-center gap-1">
                    <Clock size={10} />
                    {hasStarted ? `Ends ${new Date(exam.scheduled_end).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : `Starts ${new Date(exam.scheduled_start).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </div>
                )}
              </div>
              <button 
                onClick={() => canStart ? launchExam(exam.id) : null}
                disabled={!canStart}
                className={`w-full font-bold py-4 rounded-2xl mt-4 transition-all active:scale-[0.98] shadow-lg uppercase tracking-widest text-[10px] ${canStart ? 'bg-white/5 group-hover:bg-accent text-gray-300 group-hover:text-background cursor-pointer' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}
              >
                {!isActive && exam.status !== 'active' ? `Not Available (${exam.status})` : !hasStarted ? `Starts ${new Date(exam.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : hasEnded ? 'Assessment Expired' : 'Commence Assessment Session'}
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

      {/* COURSE REGISTRY MODAL */}
      {showBrowser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent"><Layers size={24} /></div>
                    <div>
                       <h2 className="text-2xl font-bold text-white font-heading tracking-tight">Academic Subject Registry</h2>
                       <p className="text-gray-500 text-xs uppercase tracking-widest">Enroll in your specific cohorts to receive examinations.</p>
                    </div>
                 </div>
                 <button onClick={() => setShowBrowser(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar my-8">
                 {availableBatches.map(batch => {
                   const isEnrolled = myBatches.some(b => b.id === batch.id);
                   return (
                     <div key={batch.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isEnrolled ? 'bg-accent/5 border-accent/20' : 'bg-white/5 border-white/5'}`}>
                        <div>
                           <p className={`font-bold ${isEnrolled ? 'text-white' : 'text-gray-400'}`}>{batch.name}</p>
                           <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">{batch.deptName} • {batch.year} Cohort</p>
                        </div>
                        {isEnrolled ? (
                          <div className="flex items-center gap-2 text-success text-[10px] font-black uppercase tracking-widest px-4 py-2">
                             <CheckCircle size={14} /> Enrolled
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSubscribe(batch.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-accent border border-accent/20 px-5 py-2.5 rounded-xl hover:bg-accent hover:text-background transition-all"
                          >
                             Enroll Now
                          </button>
                        )}
                     </div>
                   );
                 })}
                 {availableBatches.length === 0 && (
                    <div className="py-12 text-center text-gray-700 text-xs font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-3xl">
                       Institutional Structure Undefined
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
