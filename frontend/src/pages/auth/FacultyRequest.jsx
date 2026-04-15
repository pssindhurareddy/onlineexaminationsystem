import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { UserPlus, ShieldCheck, CheckCircle2, ChevronLeft, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FacultyRequest() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-access', { ...formData, orgSlug, role: 'faculty' });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Access request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A15] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-accent/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <button onClick={() => navigate(`/org/${orgSlug}/faculty-login`)} className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-white transition-colors mb-4 group">
          <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return to Login
        </button>

        <div className="text-center mb-3">
          <div className="mx-auto w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent mb-2 shadow-glow">
            <UserPlus size={20} />
          </div>
          <h1 className="text-xl font-bold font-heading tracking-tight">Access Request</h1>
          <p className="text-gray-400 mt-0.5 text-[9px] uppercase font-bold tracking-widest leading-none">Faculty Authorization Terminal</p>
        </div>

        <div className="premium-card p-4 border border-white/10 relative overflow-hidden backdrop-blur-xl bg-white/[0.02]">
          <AnimatePresence mode="wait">
            {!success ? (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 px-1">
                    <User size={10} /> Full Professional Name
                  </label>
                  <input 
                    required 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="e.g. Dr. Alexander Wright"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 px-1">
                    <Mail size={10} /> Institutional Email
                  </label>
                  <input 
                    required 
                    type="email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="e.g. wright@institution.edu"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex gap-3">
                   <ShieldCheck size={16} className="text-accent shrink-0" />
                   <p className="text-[9px] text-gray-500 leading-relaxed font-medium">Request transmitted to administrators for verification.</p>
                </div>

                {error && (
                  <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold">
                    {error}
                  </div>
                )}

                <button disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-background font-black py-3 rounded-xl shadow-xl shadow-accent/20 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  {loading ? <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" /> : 'Transmit Access Request'}
                </button>
              </motion.form>
            ) : (
              <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4 space-y-6">
                <div className="mx-auto w-14 h-14 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success shadow-2xl">
                   <CheckCircle2 size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-white leading-tight">Request Transmitted</h2>
                   <p className="text-gray-500 mt-1 text-xs">Authorization request recorded. Check email for approval.</p>
                </div>
                <button onClick={() => navigate(`/org/${orgSlug}/faculty-login`)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold transition-all underline underline-offset-4 decoration-accent text-xs">Return to Portal</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">Institutional Access Gateway</p>
      </motion.div>
    </div>
  );
}
