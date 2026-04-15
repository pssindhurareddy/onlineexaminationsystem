import { useState } from 'react';
import api from '../../api/axios';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: location.state?.email || '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/reset-password', formData);
      alert('Vault Secured. Key altered.');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Access alteration rejected.');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-success/5 via-background to-background relative overflow-hidden">
      <div className="w-full max-w-md premium-card p-10 relative z-10 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-8">
        <h1 className="text-3xl font-bold text-white mb-8">Execute Override</h1>
        {error && <div className="bg-danger/10 border border-danger/30 text-danger p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5"><label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Target Entity</label>
          <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-3 text-white opacity-80" placeholder="Email Array" readOnly={!!location.state?.email} /></div>
          
          <div className="space-y-1.5"><label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">6-Digit Pin</label>
          <input required type="text" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-3.5 text-accent tracking-[1em] text-center text-lg font-bold" placeholder="------" maxLength={6} /></div>
          
          <div className="space-y-1.5"><label className="text-xs text-gray-400 uppercase tracking-widest font-semibold">New Protocol</label>
          <input required type="password" value={formData.newPassword} onChange={e => setFormData({...formData, newPassword: e.target.value})} className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-3 text-white" placeholder="••••••••" /></div>
          
          <button disabled={loading} className="w-full bg-success hover:bg-success/80 text-background font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-success/20 !mt-8">Commit Signature</button>
        </form>
      </div>
    </div>
  );
}
