import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Layers, Plus, Users, GraduationCap, ChevronRight, Database, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';

export default function AcademicsManagement() {
  const [structure, setStructure] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Forms
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  const [deptData, setDeptData] = useState({ name: '', code: '' });
  const [batchData, setBatchData] = useState({ name: '', year: new Date().getFullYear() });
  const [enrollData, setEnrollData] = useState('');

  useEffect(() => {
    fetchStructure();
  }, []);

  const fetchStructure = async () => {
    try {
      setLoading(true);
      const res = await api.get('/org/structure');
      setStructure(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/org/courses', deptData);
      setDeptData({ name: '', code: '' });
      setShowDeptModal(false);
      fetchStructure();
    } catch (err) {
      alert("Failed to create department");
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/org/sections', { ...batchData, departmentId: selectedDept.id });
      setBatchData({ name: '', year: new Date().getFullYear() });
      setShowBatchModal(false);
      fetchStructure();
    } catch (err) {
      alert("Failed to create section");
    }
  };

  const handleBulkEnroll = async (e) => {
    e.preventDefault();
    const emails = enrollData.split('\n').map(e => e.trim()).filter(e => e.includes('@'));
    if (emails.length === 0) return alert("No valid emails detected");

    try {
      const res = await api.post('/admin/academics/enroll-bulk', { emails, batchId: selectedBatch.id });
      alert(res.data.message);
      setEnrollData('');
      setShowEnrollModal(false);
    } catch (err) {
      alert("Enrollment campaign failed.");
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold font-heading text-white tracking-tight">Academic Architecture</h1>
          <p className="text-gray-400 mt-2 text-lg">Manage institutional departments, degree batches, and student enrollment.</p>
        </div>
        <button 
          onClick={() => setShowDeptModal(true)}
          className="bg-accent hover:bg-accent/80 text-background px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-all shadow-glow hover:scale-[1.02]"
        >
          <Plus size={18} /> Add Department
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse text-gray-500 font-black uppercase tracking-widest text-sm">
           Calibrating Academic Pulse...
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">
          {structure.map((dept) => (
            <div key={dept.id} className="premium-card border border-white/5 bg-[#050A15]/40 overflow-hidden flex flex-col group">
               <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                        <Layers size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-bold text-white font-heading">{dept.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">{dept.code}</p>
                     </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedDept(dept); setShowBatchModal(true); }}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <Plus size={18} />
                  </button>
               </div>
               
               <div className="p-6 space-y-4 flex-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-700 flex items-center gap-2">
                     <ChevronRight size={10} className="text-accent" /> Active Degree Batches
                  </h4>
                  <div className="grid gap-3">
                     {dept.Batches && dept.Batches.length > 0 ? dept.Batches.map(batch => (
                       <div key={batch.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between group/batch hover:border-accent/20 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 group-hover/batch:text-accent transition-colors">
                                <GraduationCap size={16} />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-gray-300 group-hover/batch:text-white transition-colors">{batch.name}</p>
                                <p className="text-[9px] font-black text-gray-700 uppercase">{batch.year} Cohort</p>
                             </div>
                          </div>
                          <button 
                            onClick={() => { setSelectedBatch(batch); setShowEnrollModal(true); }}
                            className="text-[9px] font-black uppercase tracking-widest text-accent border border-accent/20 px-3 py-1.5 rounded-lg opacity-0 group-hover/batch:opacity-100 transform translate-x-2 group-hover/batch:translate-x-0 transition-all hover:bg-accent hover:text-background"
                          >
                             Bulk Enroll
                          </button>
                       </div>
                     )) : (
                       <div className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-gray-800 border border-dashed border-white/5 rounded-2xl">
                          No sections configured
                       </div>
                     )}
                  </div>
               </div>
            </div>
          ))}
          {structure.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center premium-card border-dashed border-white/10 opacity-40">
               <Database size={48} className="mx-auto mb-4 text-gray-600" />
               <p className="text-sm font-black uppercase tracking-widest text-gray-700">Institutional Registry Devoid of Academic Entities</p>
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-md premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <h2 className="text-2xl font-bold text-white mb-2 font-heading">Construct Department</h2>
              <p className="text-gray-500 text-xs mb-8">Define a new institutional academic vertical.</p>
              
              <form onSubmit={handleCreateDept} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">Full Nomenclature</label>
                    <input 
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent outline-none" 
                      placeholder="e.g. Computer Science & Engineering"
                      value={deptData.name}
                      onChange={e => setDeptData({...deptData, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">Institutional Code</label>
                    <input 
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent outline-none" 
                      placeholder="e.g. CSE"
                      value={deptData.code}
                      onChange={e => setDeptData({...deptData, code: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-4 mt-10">
                    <button type="button" onClick={() => setShowDeptModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-accent text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow">Finalize Registry</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-md premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <h2 className="text-2xl font-bold text-white mb-2 font-heading">Spawn Degree Batch</h2>
              <p className="text-gray-500 text-xs mb-8">Assign a new cohort under <strong>{selectedDept?.name}</strong>.</p>
              
              <form onSubmit={handleCreateBatch} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">Cohort Designation</label>
                    <input 
                      required
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent outline-none" 
                      placeholder="e.g. Section Alpha"
                      value={batchData.name}
                      onChange={e => setBatchData({...batchData, name: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">Academic Year</label>
                    <input 
                      required
                      type="number"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-accent outline-none" 
                      placeholder="2024"
                      value={batchData.year}
                      onChange={e => setBatchData({...batchData, year: e.target.value})}
                    />
                 </div>
                 <div className="flex gap-4 mt-10">
                    <button type="button" onClick={() => setShowBatchModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="flex-1 py-4 bg-accent text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow">Commit Batch</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-2xl premium-card p-8 border border-white/10 shadow-3xl bg-[#050A15]">
              <div className="flex items-center gap-4 mb-4">
                 <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 text-accent">
                    <Users size={24} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-bold text-white font-heading">Bulk Enrollment Terminal</h2>
                    <p className="text-gray-500 text-xs">Targeting Cohort: <strong className="text-accent">{selectedBatch?.name}</strong></p>
                 </div>
              </div>
              
              <form onSubmit={handleBulkEnroll} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1 flex justify-between">
                       Institutional Identity Registry (Emails)
                       <span className="text-accent tracking-tighter">Enter one email per line</span>
                    </label>
                    <textarea 
                      required
                      rows={10}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-sm focus:border-accent outline-none font-mono placeholder:opacity-20 translate-z" 
                      placeholder={"student1@mit.edu\nstudent2@mit.edu\nstudent3@mit.edu"}
                      value={enrollData}
                      onChange={e => setEnrollData(e.target.value)}
                    />
                 </div>
                 <div className="flex gap-4 mt-6">
                    <button type="button" onClick={() => setShowEnrollModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Abort Cycle</button>
                    <button type="submit" className="flex-2 py-4 bg-accent text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-glow flex items-center justify-center gap-3">
                       <CheckCircle2 size={16} /> Execute Enrollment Campaign
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
