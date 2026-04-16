import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus, Power, Shield, User, Mail, Database, CheckCircle2, Copy, Users, ClipboardCheck, History, XCircle, GraduationCap, ChevronRight } from 'lucide-react';

export default function UsersRoster() {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' or 'requests'
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState(null);
  
  // Academic Context
  const [availableBatches, setAvailableBatches] = useState([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTarget, setEnrollTarget] = useState(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  
  const [provisionMode, setProvisionMode] = useState('single'); 
  const [provisionData, setProvisionData] = useState({ name: '', email: '', role: 'student' });
  const [bulkList, setBulkList] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchData();
    fetchAcademicStructure();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'registry') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
      } else {
        const res = await api.get('/admin/users/pending-requests');
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicStructure = async () => {
    try {
      const res = await api.get('/org/structure');
      // Flatten structure for easy selection
      const allBatches = res.data.data.flatMap(dept => 
        (dept.Batches || []).map(b => ({ ...b, deptName: dept.name }))
      );
      setAvailableBatches(allBatches);
    } catch (err) {
      console.error("Failed to load academic map");
    }
  };

  const handleHandleProvision = async (e) => {
    e.preventDefault();
    try {
      let usersToProvision = [];
      if (provisionMode === 'single') {
        usersToProvision = [{ name: provisionData.name, email: provisionData.email }];
      } else {
        usersToProvision = bulkList.split('\n').filter(l => l.includes(',')).map(l => {
           const [name, email] = l.split(',');
           return { name: name.trim(), email: email.trim() };
        });
      }

      const res = await api.post('/admin/users/bulk', { users: usersToProvision, role: provisionData.role });
      setResults(res.data.data);
      fetchData();
      setProvisionData({ name: '', email: '', role: 'student' });
      setBulkList('');
    } catch (err) {
      alert(err.response?.data?.message || 'Provisioning failed.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert("Status update failed.");
    }
  };

  const handleAuthorize = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/approve`);
      alert("Identity Authorized.");
      fetchData();
    } catch (err) {
      alert("Authorization failed.");
    }
  };

  const handleEnrollmentSync = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/academics/sync-enrollments', { 
        userId: enrollTarget.id, 
        batchIds: selectedBatchIds 
      });
      setShowEnrollModal(false);
      fetchData();
    } catch (err) {
      alert("Sync failed.");
    }
  };

  const copyToClipboard = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus(id);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Identity Management</h1>
          <p className="text-gray-400 mt-2 text-lg">Provision identities and manage academic enrollments.</p>
        </div>
      </div>

      {results && (
        <div className="premium-card p-8 border border-success/20 bg-success/5">
           <div className="flex items-center gap-4 mb-6">
              <CheckCircle2 className="text-success" size={32} />
              <h2 className="text-xl font-bold text-white">Provisioning Successful</h2>
              <button onClick={() => setResults(null)} className="ml-auto text-[10px] font-bold text-gray-400">Dismiss</button>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                   <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-600 truncate">{r.email}</p>
                   </div>
                   <span className="bg-accent/10 border border-accent/20 text-accent font-black tracking-widest text-xs px-3 py-1.5 rounded-lg">{r.genesisKey}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Provisioning Control Panel */}
        <div className="lg:col-span-4 h-fit premium-card p-8 border border-white/10 bg-black/40">
          <div className="flex gap-4 mb-8">
             {['single', 'bulk'].map(m => (
               <button key={m} onClick={() => setProvisionMode(m)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${provisionMode === m ? 'bg-accent/10 border-accent text-accent' : 'bg-white/10 border-white/5 text-gray-600'}`}>{m === 'single' ? 'Single Identity' : 'Bulk Batch'}</button>
             ))}
          </div>

          <form onSubmit={handleHandleProvision} className="space-y-6">
            {provisionMode === 'single' ? (
              <div className="space-y-4">
                <input required className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 text-white text-sm" placeholder="Full Name" value={provisionData.name} onChange={e=>setProvisionData({...provisionData, name: e.target.value})} />
                <input type="email" required className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 text-white text-sm" placeholder="Email Address" value={provisionData.email} onChange={e=>setProvisionData({...provisionData, email: e.target.value})} />
              </div>
            ) : (
               <textarea required rows={8} className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 text-white text-sm font-mono" placeholder="Name, Email (One per line)" value={bulkList} onChange={e => setBulkList(e.target.value)} />
            )}

            <select className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 text-white text-sm" value={provisionData.role} onChange={e=>setProvisionData({...provisionData, role: e.target.value})}>
               <option value="student">Student Learner</option>
               <option value="faculty">Faculty Instructor</option>
               <option value="admin">Administrator</option>
            </select>

            <button type="submit" className="w-full mt-6 bg-accent text-background font-black py-5 rounded-2xl uppercase tracking-widest text-xs shadow-glow">Provision Identities</button>
          </form>
        </div>

        {/* Identity Registry */}
        <div className="lg:col-span-8 premium-card border border-white/10 bg-black/20 overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#050A15]/40">
            <div className="flex gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                {['registry', 'requests'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-accent text-background shadow-glow' : 'text-gray-600'}`}>{t === 'registry' ? 'Master Registry' : 'Pending Approvals'}</button>
                ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            {activeTab === 'registry' ? (
              <table className="w-full text-left">
                <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="px-8 py-5 font-black">Identity</th>
                    <th className="px-8 py-5 font-black">Academic Track</th>
                    <th className="px-8 py-5 font-black text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="group hover:bg-white/[0.02]">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-gray-500 group-hover:text-accent transition-all">{u.name.charAt(0)}</div>
                          <div>
                            <div className="font-bold text-gray-200 group-hover:text-white">{u.name}</div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-accent/60">{u.role}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex flex-wrap gap-1">
                            {u.Batches && u.Batches.length > 0 ? u.Batches.map(b => (
                              <span key={b.id} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-bold text-gray-500">{b.name}</span>
                            )) : (
                              <span className="text-[8px] font-black text-gray-700 uppercase tracking-tighter">No Active Trace</span>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => { setEnrollTarget(u); setSelectedBatchIds((u.Batches || []).map(b => b.id)); setShowEnrollModal(true); }}
                             className="p-2.5 rounded-xl bg-accent/5 border border-accent/10 text-accent hover:bg-accent hover:text-background transition-all"
                             title="Manage academic links"
                           >
                             <GraduationCap size={16} />
                           </button>
                           <button onClick={() => handleToggle(u.id)} className={`p-2.5 rounded-xl border transition-all ${u.is_active ? 'border-white/5 text-gray-600 hover:text-danger' : 'border-success/20 text-success'}`}>
                             <Power size={16} />
                           </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              requests.length > 0 ? (
                <table className="w-full text-left">
                  <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
                    <tr>
                      <th className="px-8 py-5 font-black">Identity Request</th>
                      <th className="px-8 py-5 font-black">Requested Role</th>
                      <th className="px-8 py-5 font-black text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.map(r => (
                      <tr key={r.id} className="group hover:bg-white/[0.02]">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center font-black text-xs text-accent">{r.name.charAt(0)}</div>
                            <div>
                              <div className="font-bold text-gray-200 group-hover:text-white">{r.name}</div>
                              <span className="text-[9px] font-bold text-gray-600">{r.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                           <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500">{r.role}</span>
                        </td>
                        <td className="px-8 py-4 text-right">
                           <button 
                             onClick={() => handleAuthorize(r.id)}
                             className="px-6 py-2.5 rounded-xl bg-success/10 border border-success/20 text-success text-[9px] font-black uppercase tracking-widest hover:bg-success hover:text-black transition-all shadow-glow-sm"
                           >
                             Authorize Identity
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-700 italic border-white/5 border border-dashed m-8 rounded-3xl">Subsystem queue currently clear.</div>
              )
            )}
            {loading && <div className="p-12 text-center text-gray-600 animate-pulse uppercase tracking-widest text-xs">Synchronizing Identity Web...</div>}
          </div>
        </div>

      </div>

      {/* ENROLLMENT MODAL */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-lg premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent"><GraduationCap size={24} /></div>
                 <div>
                    <h2 className="text-xl font-bold text-white font-heading">Academic Synchronization</h2>
                    <p className="text-xs text-gray-500">Mapping <strong>{enrollTarget?.name}</strong> to degree sections.</p>
                 </div>
              </div>
              
              <form onSubmit={handleEnrollmentSync} className="space-y-6">
                 <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableBatches.map(batch => (
                      <label key={batch.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${selectedBatchIds.includes(batch.id) ? 'bg-accent/10 border-accent/40 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                         <div>
                            <p className="text-sm font-bold">{batch.name}</p>
                            <p className="text-[9px] uppercase font-black opacity-60 tracking-widest">{batch.deptName}</p>
                         </div>
                         <input 
                           type="checkbox" 
                           className="w-5 h-5 rounded-lg accent-accent"
                           checked={selectedBatchIds.includes(batch.id)}
                           onChange={(e) => {
                             if (e.target.checked) setSelectedBatchIds(prev => [...prev, batch.id]);
                             else setSelectedBatchIds(prev => prev.filter(id => id !== batch.id));
                           }}
                         />
                      </label>
                    ))}
                    {availableBatches.length === 0 && <p className="text-center py-8 text-gray-700 text-xs font-bold uppercase tracking-widest">No Batches Configured in Registry</p>}
                 </div>

                 <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white">Cancel</button>
                    <button type="submit" className="flex-2 py-4 bg-accent text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow">Apply Sync</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
