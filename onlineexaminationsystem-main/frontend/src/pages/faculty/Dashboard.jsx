import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, PlusCircle, BarChart3, Users, ChevronRight, Activity, Clock } from 'lucide-react';

export default function FacultyDashboard() {
  const { orgSlug } = useParams();
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      setExams(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const quickActions = [
    { name: 'Examination Builder', desc: 'Design new assessment protocols', icon: PlusCircle, path: `/org/${orgSlug}/faculty/question-bank`, color: 'text-accent' },
    { name: 'Active Monitoring', desc: 'Real-time student oversight', icon: Activity, path: `/org/${orgSlug}/faculty/dashboard`, color: 'text-success' },
    { name: 'Evaluation Reports', desc: 'Review performance metrics', icon: BarChart3, path: `/org/${orgSlug}/faculty/results`, iconColor: 'text-purple-500' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Institutional Portal</h1>
           <p className="text-gray-400 mt-2 text-lg">Manage examinations and monitor academic compliance.</p>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl shadow-inner">
           <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Session Engine</span>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <section className="grid md:grid-cols-3 gap-6">
         {quickActions.map((action, i) => (
           <button 
             key={i} 
             onClick={() => navigate(action.path)}
             className="premium-card p-8 border border-white/5 bg-[#050A15]/60 hover:border-accent/30 hover:bg-accent/5 transition-all group text-left relative overflow-hidden"
           >
              <div className="relative z-10">
                 <div className={`mb-6 ${action.color || 'text-white'}`}>
                    <action.icon size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors">{action.name}</h3>
                 <p className="text-gray-500 text-sm mt-2">{action.desc}</p>
                 <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-accent opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                    Access Terminal <ChevronRight size={12} />
                 </div>
              </div>
           </button>
         ))}
      </section>

      {/* Recent Examinations */}
      <section className="space-y-6">
         <h2 className="text-xs font-bold text-gray-600 uppercase tracking-[0.3em] flex items-center gap-4">
            Recent Examination Deployments <div className="h-px flex-1 bg-white/5" />
         </h2>
         
         <div className="grid lg:grid-cols-2 gap-4">
            {exams.slice(0, 4).map(exam => (
              <div key={exam.id} className="premium-card p-6 border border-white/5 bg-black/40 flex items-center justify-between group hover:border-white/10 transition-all">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-accent group-hover:border-accent/20 transition-all">
                       <BookOpen size={24} />
                    </div>
                    <div>
                       <h3 className="font-bold text-white text-lg">{exam.title}</h3>
                       <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {exam.duration_minutes}m</span>
                          <span className="flex items-center gap-1.5"><Users size={12} /> {exam.subject}</span>
                       </div>
                    </div>
                 </div>
                 <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:text-white transition-colors flex items-center gap-1">Configure Environment <ChevronRight size={14} /></button>
              </div>
            ))}
            {exams.length === 0 && <div className="col-span-full py-12 text-center text-gray-500 italic border border-dashed border-white/10 rounded-3xl">No active examinations recovered.</div>}
         </div>
      </section>
    </div>
  );
}
