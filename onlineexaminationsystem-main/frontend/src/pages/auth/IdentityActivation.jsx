import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Fingerprint, ShieldAlert, CheckCircle2, Key, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function IdentityActivation() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Verify, 2: Setup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', genesisKey: '', password: '', confirmPassword: '' });
  const [identityName, setIdentityName] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-genesis-key', { ...formData, orgSlug });
      setIdentityName(res.data.data.name);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/activate-identity', { ...formData, orgSlug });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Activation protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A15] flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-accent/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
        <div className="text-center mb-4">
          <div className="mx-auto w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center text-accent mb-3 shadow-glow">
            <Fingerprint size={20} />
          </div>
          <h1 className="text-xl font-bold font-heading tracking-tight">Identity Registry Terminal</h1>
          <p className="text-gray-500 mt-0.5 text-[8px] uppercase font-bold tracking-widest leading-none">Claim your institutional identity.</p>
          <div className="mt-2 text-[10px] text-accent/50 cursor-help transition-all hover:text-accent" title="Contact your institution's administrator to receive your 8-digit Genesis Key.">
             <span className="border-b border-accent/20">How do I get my key?</span>
          </div>
        </div>

        <div className="premium-card p-4 border border-white/10 relative overflow-hidden backdrop-blur-xl bg-white/[0.02]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleVerify} className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 px-1">
                    <Mail size={10} /> Institutional Email
                  </label>
                  <input 
                    required 
                    type="email"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="e.g. j.doe@institution.edu"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 px-1">
                    <Key size={10} /> Genesis Identity Key
                  </label>
                  <input 
                    required 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-accent outline-none transition-all placeholder:text-gray-800 tracking-[0.5em] text-center font-black"
                    placeholder="••••••••"
                    value={formData.genesisKey}
                    onChange={e => setFormData({...formData, genesisKey: e.target.value.toUpperCase()})}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold transition-all">
                    <ShieldAlert size={14} /> {error}
                  </div>
                )}

                <button disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-background font-black py-3 rounded-xl shadow-xl shadow-accent/20 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                  {loading ? <div className="w-3 h-3 border-2 border-background border-t-transparent rounded-full animate-spin" /> : 'Authorize Identity'}
                </button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handleActivate} className="space-y-4">
                <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-center">
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Authenticated Identity</p>
                  <h3 className="text-lg font-bold text-white mt-0.5">{identityName}</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-1">New Secure Password</label>
                  <input 
                    required 
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 px-1">Confirm Identity Key</label>
                  <input 
                    required 
                    type="password"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-accent outline-none transition-all placeholder:text-gray-800"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold">
                    <ShieldAlert size={14} /> {error}
                  </div>
                )}

                <button disabled={loading} className="w-full bg-accent hover:bg-accent/80 text-background font-black py-3 rounded-xl shadow-xl shadow-accent/20 transition-all uppercase tracking-widest text-[10px]">
                  {loading ? 'Finalizing...' : 'Establish Secure Password'}
                </button>
              </motion.form>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4 space-y-6">
                <div className="mx-auto w-14 h-14 bg-success/10 border border-success/20 rounded-full flex items-center justify-center text-success shadow-2xl">
                   <CheckCircle2 size={32} />
                </div>
                <div>
                   <h2 className="text-2xl font-bold text-white leading-tight">Identity Established</h2>
                   <p className="text-gray-500 mt-1 text-xs">Your credentials have been successfully provisioned.</p>
                </div>
                <button onClick={() => navigate(`/org/${orgSlug}/login`)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold transition-all underline underline-offset-4 decoration-accent text-xs">Proceed to Portal Access</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center mt-6 text-[8px] text-gray-600 font-bold uppercase tracking-[0.2em]">Institutional Identity Registry</p>
      </motion.div>
    </div>
  );
}
