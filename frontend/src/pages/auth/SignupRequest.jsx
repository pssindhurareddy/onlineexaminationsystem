import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { UserPlus, ShieldPlus, IdCard, Mail, User, GraduationCap, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupRequest() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', role: 'student' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-access', { ...formData, orgSlug });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Identity transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#050A15] flex items-center justify-center p-6 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full premium-card p-10 space-y-6">
           <div className="mx-auto w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success shadow-glow">
              <ShieldPlus size={32} />
           </div>
           <h2 className="text-3xl font-bold font-heading">Authorization Pending</h2>
           <p className="text-gray-400 text-sm leading-relaxed">
             Your identity packet has been transmitted to the institutional administrators. 
             Once authorized, you will receive a <strong>Genesis Activation Key</strong> via your official email.
           </p>
           <button onClick={() => navigate(`/org/${orgSlug}/login`)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-xl font-bold transition-all text-sm uppercase tracking-widest">
             Return to Portal
           </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050A15] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50vh] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-4 shadow-glow">
            <IdCard size={24} />
          </div>
          <h1 className="text-3xl font-bold font-heading tracking-tight">Access Request Protocol</h1>
          <p className="text-gray-500 mt-2 text-xs uppercase font-bold tracking-[0.2em]">Institutional Identity Enrollment</p>
        </div>

        <div className="premium-card p-8 border border-white/10 backdrop-blur-3xl bg-white/[0.02] shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Full Legal Name</label>
              <div className="relative">
                 <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                 <input 
                   required 
                   className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                   placeholder="e.g. Alexander Wright"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Institutional Email</label>
              <div className="relative">
                 <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                 <input 
                   required 
                   type="email"
                   className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                   placeholder="alex@institution.edu"
                   value={formData.email}
                   onChange={e => setFormData({...formData, email: e.target.value})}
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 px-1">Identity Role</label>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   type="button" 
                   onClick={() => setFormData({...formData, role: 'student'})}
                   className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${formData.role === 'student' ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-white/5 text-gray-600'}`}
                 >
                   <GraduationCap size={18} />
                   <span className="text-xs font-bold uppercase tracking-widest">Student</span>
                 </button>
                 <button 
                   type="button" 
                   onClick={() => setFormData({...formData, role: 'faculty'})}
                   className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${formData.role === 'faculty' ? 'bg-accent/10 border-accent text-accent' : 'bg-white/5 border-white/5 text-gray-600'}`}
                 >
                   <Building2 size={18} />
                   <span className="text-xs font-bold uppercase tracking-widest">Faculty</span>
                 </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold text-center">
                {error}
              </div>
            )}

            <button disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-background font-black py-5 rounded-xl shadow-xl shadow-accent/20 transition-all uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3">
              {loading ? <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" /> : 'Transmit Identity'}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
             <Link to={`/org/${orgSlug}/login`} className="text-[10px] text-gray-600 hover:text-white transition-colors uppercase tracking-[0.2em] font-bold">Already authorized? Sign In</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
