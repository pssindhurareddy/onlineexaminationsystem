import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, PlusCircle, BarChart3, Users, ChevronRight, Activity, Clock, Layers, Star, Info, CheckCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const { orgSlug } = useParams();
  const [exams, setExams] = useState([]);
  const [myBatches, setMyBatches] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
    fetchFacultyCourses();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFacultyCourses = async () => {
    try {
      setLoading(true);
      // Fetch my batches
      const userRes = await api.get('/auth/me');
      setMyBatches(userRes.data.data.Batches || []);

      // Fetch all available structure for the browser
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
      fetchFacultyCourses();
    } catch (err) {
      alert("Subscription failed.");
    }
  };

  const quickActions = [
    { name: 'Examination Builder', desc: 'Design new assessment protocols', icon: PlusCircle, path: `/org/${orgSlug}/faculty/question-bank`, color: 'text-accent' },
    { name: 'Active Monitoring', desc: 'Real-time student oversight', icon: Activity, path: `/org/${orgSlug}/faculty/dashboard`, color: 'text-success' },
    { name: 'Evaluation Reports', desc: 'Review performance metrics', icon: BarChart3, path: `/org/${orgSlug}/faculty/results`, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Institutional Portal</h1>
           <p className="text-gray-400 mt-2 text-lg">Manage examinations and focus on your active course departments.</p>
        </div>
        <button 
          onClick={() => setShowBrowser(true)}
          className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-white/10 transition-all group"
        >
           <Layers size={18} className="text-accent group-hover:rotate-12 transition-transform" />
           <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Course Browser</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
         {/* Left Column: Quick Actions & My Courses */}
         <div className="lg:col-span-4 space-y-10">
            <section className="space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Action Console</h2>
               <div className="grid gap-4">
                  {quickActions.map((action, i) => (
                    <button 
                      key={i} 
                      onClick={() => navigate(action.path)}
                      className="p-5 premium-card border border-white/5 bg-[#050A15]/60 hover:border-accent/20 hover:bg-accent/5 transition-all text-left flex items-center gap-4 group"
                    >
                       <div className={`${action.color} p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform`}>
                          <action.icon size={20} />
                       </div>
                       <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-tight">{action.name}</h3>
                          <p className="text-[10px] text-gray-500">{action.desc}</p>
                       </div>
                    </button>
                  ))}
               </div>
            </section>

            <section className="space-y-4">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 flex justify-between items-center">
                  My Active Courses
                  <Star size={12} className="text-warning fill-warning" />
               </h2>
               <div className="space-y-3">
                  {myBatches.map(batch => (
                    <div key={batch.id} className="p-4 bg-accent/5 border border-accent/10 rounded-2xl flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent"><Users size={20} /></div>
                       <div>
                          <p className="text-sm font-bold text-white">{batch.name}</p>
                          <p className="text-[9px] font-black text-accent uppercase tracking-widest opacity-60">{batch.year} Cohort</p>
                       </div>
                    </div>
                  ))}
                  {myBatches.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl opacity-40">
                       <Info size={24} className="mx-auto mb-2" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No Active Subscriptions</p>
                    </div>
                  )}
               </div>
            </section>
         </div>

         {/* Right Column: Exams & Detailed Lists */}
         <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 flex items-center gap-4">
                  Master Examination Ledger <div className="h-px flex-1 bg-white/5" />
               </h2>
               
               <div className="grid gap-4">
                  {exams.map(exam => (
                    <div key={exam.id} className="premium-card p-6 border border-white/5 bg-black/40 flex items-center justify-between group hover:border-white/10 transition-all relative overflow-hidden">
                       <div className="flex items-center gap-5 relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-accent group-hover:border-accent/20 transition-all">
                             <BookOpen size={28} />
                          </div>
                          <div>
                             <h3 className="font-bold text-white text-xl tracking-tight">{exam.title}</h3>
                             <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                <span className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-md"><Clock size={12} /> {exam.duration_minutes} Minutes</span>
                                <span className="flex items-center gap-1.5 text-accent">{exam.subject}</span>
                             </div>
                          </div>
                       </div>
                       <button onClick={() => navigate(`/org/${orgSlug}/faculty/exams/${exam.id}/results`)} className="relative z-10 text-[10px] font-black uppercase tracking-widest text-accent border border-accent/20 px-4 py-2 rounded-xl hover:bg-accent hover:text-background transition-all">Analyze Results</button>
                    </div>
                  ))}
                  {exams.length === 0 && <div className="py-20 text-center text-gray-600 italic border border-dashed border-white/10 rounded-3xl">No examinations deployed under this identity.</div>}
               </div>
            </section>
         </div>
      </div>

      {/* COURSE BROWSER MODAL */}
      {showBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent"><Layers size={24} /></div>
                 <div>
                    <h2 className="text-2xl font-bold text-white font-heading tracking-tight">Institutional Course Registry</h2>
                    <p className="text-gray-500 text-xs uppercase tracking-widest">Subscribe to sections to manage examinations.</p>
                 </div>
              </div>
              
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar my-8">
                 {availableBatches.map(batch => {
                   const isSubscribed = myBatches.some(b => b.id === batch.id);
                   return (
                     <div key={batch.id} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${isSubscribed ? 'bg-accent/5 border-accent/20' : 'bg-white/5 border-white/5'}`}>
                        <div>
                           <p className={`font-bold ${isSubscribed ? 'text-white' : 'text-gray-400'}`}>{batch.name}</p>
                           <p className="text-[10px] uppercase font-black opacity-40 tracking-widest">{batch.deptName} • {batch.year} Cohort</p>
                        </div>
                        {isSubscribed ? (
                          <div className="flex items-center gap-2 text-success text-[10px] font-black uppercase tracking-widest px-4 py-2">
                             <CheckCircle size={14} /> Active
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleSubscribe(batch.id)}
                            className="text-[10px] font-black uppercase tracking-widest text-accent border border-accent/20 px-5 py-2.5 rounded-xl hover:bg-accent hover:text-background transition-all"
                          >
                             Subscribe
                          </button>
                        )}
                     </div>
                   );
                 })}
                 {availableBatches.length === 0 && <p className="text-center py-12 text-gray-700 text-xs font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-3xl">Institutional Structure Undefined</p>}
              </div>

              <button onClick={() => setShowBrowser(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors border-t border-white/5">Exit Registry</button>
           </div>
        </div>
      )}
    </div>
  );
}
