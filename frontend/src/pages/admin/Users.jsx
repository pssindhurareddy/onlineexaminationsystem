import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus, Power, Shield, User, Mail, Database, CheckCircle2, Copy, Users, ClipboardCheck, History, XCircle } from 'lucide-react';

export default function UsersRoster() {
  const [activeTab, setActiveTab] = useState('registry'); // 'registry' or 'requests'
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState(null); // ID of user copied
  
  const [provisionMode, setProvisionMode] = useState('single'); 
  const [provisionData, setProvisionData] = useState({ name: '', email: '', role: 'student' });
  const [bulkList, setBulkList] = useState('');
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'registry') {
        const res = await api.get('/admin/users');
        setUsers(res.data.data);
      } else {
        const res = await api.get('/admin/requests/pending');
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

      if (usersToProvision.length === 0) return alert("No valid identities detected in the buffer.");

      const res = await api.post('/admin/users/bulk', { users: usersToProvision, role: provisionData.role });
      setResults(res.data.data);
      fetchData();
      
      setProvisionData({ name: '', email: '', role: 'student' });
      setBulkList('');
    } catch (err) {
      alert(err.response?.data?.message || 'Provisioning sequence failed.');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleAuthorize = async (id) => {
    try {
      await api.post(`/admin/requests/${id}/approve`);
      alert("Identity Authorized. Genesis Key dispatched via secure email.");
      fetchData();
    } catch (err) {
      alert("Authorization protocol failed.");
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
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Identity Management Console</h1>
          <p className="text-gray-400 mt-2 text-lg">Provision institutional identities and authorize entry requests.</p>
        </div>
      </div>

      {results && (
        <div className="premium-card p-8 border border-success/20 bg-success/5 animate-in zoom-in-95">
           <div className="flex items-center gap-4 mb-6">
              <CheckCircle2 className="text-success" size={32} />
              <div>
                 <h2 className="text-xl font-bold text-white">Provisioning Cycle Successful</h2>
                 <p className="text-xs text-gray-500 font-medium tracking-wide">Distribute the following Genesis Keys or instruct members to check their email.</p>
              </div>
              <button onClick={() => setResults(null)} className="ml-auto text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest border border-white/5 px-4 py-2 rounded-lg transition-colors">Dismiss</button>
           </div>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-xl">
                   <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-600 truncate">{r.email}</p>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="bg-accent/10 border border-accent/20 text-accent font-black tracking-widest text-xs px-3 py-1.5 rounded-lg select-all">{r.genesisKey}</span>
                      <button onClick={() => copyToClipboard(`res-${i}`, r.genesisKey)} className={`p-2 transition-colors ${copyStatus === `res-${i}` ? 'text-success' : 'text-gray-700 hover:text-accent'}`}>
                         {copyStatus === `res-${i}` ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-10">
        
        {/* Provisioning Control Panel */}
        <div className="lg:col-span-4 h-fit premium-card p-8 border border-white/10 bg-black/40 shadow-2xl">
          <div className="flex gap-4 mb-8">
             <button 
               onClick={() => setProvisionMode('single')} 
               className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${provisionMode === 'single' ? 'bg-accent/10 border-accent text-accent' : 'bg-white/10 border-white/5 text-gray-600 hover:bg-white/20'}`}
             >
                Single Entity
             </button>
             <button 
               onClick={() => setProvisionMode('bulk')}
               className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${provisionMode === 'bulk' ? 'bg-accent/10 border-accent text-accent' : 'bg-white/10 border-white/5 text-gray-600 hover:bg-white/20'}`}
             >
                Bulk Batch
             </button>
          </div>

          <form onSubmit={handleHandleProvision} className="space-y-6">
            {provisionMode === 'single' ? (
              <>
                <div className="space-y-2">
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-1">Identity Name</label>
                  <div className="relative">
                     <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       required 
                       className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 pl-12 text-white text-sm focus:border-accent outline-none transition-all placeholder:text-gray-800" 
                       placeholder="e.g. Alexander Wright" 
                       value={provisionData.name} 
                       onChange={e=>setProvisionData({...provisionData, name: e.target.value})} 
                     />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-1">Official Email</label>
                  <div className="relative">
                     <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                     <input 
                       type="email" 
                       required 
                       className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 pl-12 text-white text-sm focus:border-accent outline-none transition-all placeholder:text-gray-800" 
                       placeholder="alex@institution.edu" 
                       value={provisionData.email} 
                       onChange={e=>setProvisionData({...provisionData, email: e.target.value})} 
                     />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-1 flex justify-between">
                   Identity Data Buffer
                   <span className="text-accent underline font-black">Format: Name, Email</span>
                </label>
                <textarea 
                  required 
                  rows={8}
                  className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent outline-none transition-all placeholder:text-gray-800 font-mono"
                  placeholder="John Doe, john@mit.edu&#10;Jane Smith, jane@mit.edu"
                  value={bulkList}
                  onChange={e => setBulkList(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest px-1">Institutional Clearance Level</label>
              <div className="relative">
                 <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                 <select 
                   className="w-full bg-[#050A15] border border-white/10 rounded-2xl p-4 pl-12 text-white text-sm focus:border-accent outline-none transition-all appearance-none cursor-pointer" 
                   value={provisionData.role} 
                   onChange={e=>setProvisionData({...provisionData, role: e.target.value})}
                 >
                   <option value="student">Student Learner</option>
                   <option value="faculty">Faculty Instructor</option>
                   <option value="admin">System Administrator</option>
                 </select>
              </div>
            </div>

            <button type="submit" className="w-full mt-6 bg-accent text-background font-black py-5 rounded-2xl shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
              <Database size={18} />
              Provision Identities
            </button>
          </form>
        </div>

        {/* Identity Registry Main Section */}
        <div className="lg:col-span-8 premium-card border border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden flex flex-col shadow-2xl">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#050A15]/40">
            <div className="flex gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                <button 
                  onClick={() => setActiveTab('registry')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'registry' ? 'bg-accent text-background shadow-glow' : 'text-gray-600 hover:text-white'}`}
                >
                  <History size={14} /> Master Registry
                </button>
                <button 
                  onClick={() => setActiveTab('requests')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-accent text-background shadow-glow' : 'text-gray-600 hover:text-white'}`}
                >
                  <UserPlus size={14} /> Authorization Requests {requests.length > 0 && <span className="bg-danger text-white px-1.5 rounded-md text-[8px]">{requests.length}</span>}
                </button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            {activeTab === 'registry' ? (
              <table className="w-full text-left">
                <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="px-8 py-5 font-black">Identity</th>
                    <th className="px-8 py-5 font-black">Status & Protocol</th>
                    <th className="px-8 py-5 font-black text-right">Access Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(users || []).map(u => (
                    <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-accent group-hover:bg-accent/10 group-hover:border-accent/20 border border-white/5 transition-all font-black text-sm">
                             {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-200 group-hover:text-white transition-colors">{u.name}</div>
                            <div className="text-[11px] text-gray-600 font-medium">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center gap-2">
                              <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : u.role === 'faculty' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                {u.role}
                              </span>
                              {u.account_status === 'PENDING_ACTIVATION' && (
                                <div className="flex items-center gap-2 ml-1">
                                   <span className="w-fit px-2 py-0.5 rounded-md bg-warning/10 text-warning border border-warning/20 text-[8px] font-bold uppercase">Pending</span>
                                   {u.genesis_key && (
                                     <div className="flex items-center gap-2">
                                       <span className="bg-accent/10 border border-accent/20 text-accent font-black tracking-widest text-[10px] px-2 py-1 rounded-md select-all shadow-glow-sm">
                                          {u.genesis_key}
                                       </span>
                                       <button onClick={() => copyToClipboard(u.id, u.genesis_key)} className={`transition-colors ${copyStatus === u.id ? 'text-success' : 'text-gray-600 hover:text-accent'}`}>
                                          {copyStatus === u.id ? <ClipboardCheck size={12} /> : <Copy size={12} />}
                                       </button>
                                     </div>
                                   )}
                                </div>
                              )}
                           </div>
                           <div className={`flex items-center gap-1.5 ${u.is_active ? 'text-success' : 'text-danger'} text-[9px] font-bold uppercase tracking-widest`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                              {u.is_active ? 'Authorized' : 'Suspended'}
                           </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button 
                           onClick={() => handleToggle(u.id)} 
                           className={`p-3 rounded-xl border transition-all ${u.is_active ? 'border-white/5 text-gray-500 hover:text-danger hover:bg-danger/10 hover:border-danger/20' : 'border-success/20 text-success bg-success/10 hover:opacity-80'}`}
                         >
                           <Power size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-[#050A15]/60 border-b border-white/5 text-gray-600 uppercase tracking-widest text-[9px]">
                  <tr>
                    <th className="px-8 py-5 font-black">Requested Identity</th>
                    <th className="px-8 py-5 font-black">Role & Clearance</th>
                    <th className="px-8 py-5 font-black text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(requests || []).map(r => (
                    <tr key={r.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                         <div>
                            <div className="font-bold text-gray-200">{r.name}</div>
                            <div className="text-[11px] text-gray-600 font-medium">{r.email}</div>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border bg-accent/10 text-accent border-accent/20`}>
                            {r.role}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-right space-x-3">
                         <button onClick={() => handleAuthorize(r.id)} className="px-4 py-2 bg-success/10 border border-success/20 text-success text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-success hover:text-background transition-all">Authorize</button>
                         <button className="px-4 py-2 bg-danger/10 border border-danger/20 text-danger text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-danger hover:text-white transition-all">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {loading && <div className="p-12 text-center text-gray-600 font-bold uppercase tracking-widest text-xs animate-pulse">Synchronizing Identity Registry...</div>}
            {!loading && ((activeTab === 'registry' && users.length === 0) || (activeTab === 'requests' && requests.length === 0)) && (
               <div className="p-12 text-center text-gray-700 italic border border-dashed border-white/5 m-8 rounded-3xl">Subsystem currently devoid of relevant identity data.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
