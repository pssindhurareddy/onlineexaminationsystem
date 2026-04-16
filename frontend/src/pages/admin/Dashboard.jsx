import { useState, useEffect } from 'react';
import { Users, BookOpen, Layers, Activity, UserCheck } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/axios';

const mockChartData = [
  { name: 'Mon', attempts: 4000, completions: 2400 },
  { name: 'Tue', attempts: 3000, completions: 1398 },
  { name: 'Wed', attempts: 2000, completions: 9800 },
  { name: 'Thu', attempts: 2780, completions: 3908 },
  { name: 'Fri', attempts: 1890, completions: 4800 },
  { name: 'Sat', attempts: 2390, completions: 3800 },
  { name: 'Sun', attempts: 3490, completions: 4300 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    studentCount: 0,
    facultyCount: 0,
    examCount: 0,
    passRate: 0,
    systemLoad: '...'
  });
  const [requests, setRequests] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRequests();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      console.error("Stats fetching failed", err);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await api.get('/admin/users/pending-requests');
      setRequests(res.data.data || []);
    } catch (err) {
      console.error("Requests fetching failed", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      const res = await api.patch(`/admin/users/${id}/approve`);
      alert(`Identity Authorized. Genesis Key generated: ${res.data.genesisKey}`);
      fetchRequests();
      fetchStats();
    } catch (err) {
      alert("Authorization protocol failed.");
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-heading text-white tracking-tight">System Oversight</h1>
          <p className="text-gray-400 mt-1">Real-time institutional metrics and compliance throughput.</p>
        </div>
        <div className="bg-accent/5 border border-accent/20 px-4 py-2 rounded-xl flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
           <span className="text-[10px] font-black uppercase text-accent tracking-widest">Network Secure</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={stats.studentCount.toLocaleString()} subValue="Active identities" icon={Users} colorClass="text-blue-500" delay={0.1} />
        <StatCard title="Faculty Roster" value={stats.facultyCount.toLocaleString()} subValue="Authorized educators" icon={UserCheck} colorClass="text-purple-500" delay={0.2} />
        <StatCard title="Examination Load" value={stats.examCount.toLocaleString()} subValue="Active configurations" icon={BookOpen} colorClass="text-accent" delay={0.3} />
        <StatCard title="Average Pass Rate" value={`${stats.passRate}%`} subValue="Institutional efficiency" icon={Activity} colorClass="text-success" delay={0.4} />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 premium-card p-6 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-[0.02]">
             <Activity size={300} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-6 font-heading tracking-tight">Engagement Flow Analytics</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C2FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C2FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" tick={{fill: '#666'}} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#050A15', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="attempts" stroke="#00C2FF" strokeWidth={3} fillOpacity={1} fill="url(#colorAttempts)" />
                <Area type="monotone" dataKey="completions" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorCompletions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Membership Requests */}
        <div className="lg:col-span-1 premium-card border border-white/10 flex flex-col bg-black/40">
           <div className="p-6 border-b border-white/5 bg-white/5 rounded-t-2xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Access Requests</h2>
              <p className="text-lg font-bold text-white mt-1">Pending Authorization</p>
           </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-6 space-y-4">
              {loadingRequests ? (
                <div className="p-12 text-center text-gray-600 animate-pulse uppercase tracking-widest text-[10px] font-black">Synchronizing Identity Web...</div>
              ) : requests.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
                   <UserCheck size={48} className="mb-4 text-gray-700" />
                   <p className="text-xs font-bold uppercase tracking-widest text-gray-700">Identity Queue Empty</p>
                </div>
              ) : (
                requests.map(r => (
                  <div key={r.id} className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-4 hover:border-accent/20 transition-all group">
                     <div>
                        <p className="font-bold text-gray-200 group-hover:text-white transition-colors">{r.name}</p>
                        <p className="text-[10px] text-gray-500 font-medium truncate">{r.email}</p>
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest">{r.role}</span>
                     </div>
                     <button 
                       disabled={approvingId === r.id}
                       onClick={() => handleApprove(r.id)}
                       className="w-full bg-accent hover:bg-accent/80 text-background py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-glow-sm"
                     >
                        {approvingId === r.id ? 'Authorizing...' : 'Grant Access'}
                     </button>
                  </div>
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
