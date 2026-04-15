import { useState } from 'react';
import api from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStatus({ type: 'success', msg: 'Verification packet encrypted and dispatched. Check your mail.' });
      setTimeout(() => navigate('/reset-password', { state: { email } }), 2500);
    } catch (err) {
      setStatus({ type: 'err', msg: err.response?.data?.message || 'Transmission failed.' });
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background px-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/20 via-background to-background relative overflow-hidden">
      <div className="w-full max-w-md premium-card p-10 relative z-10 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
        <h1 className="text-3xl font-bold text-white mb-2">Password Erasure</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">System requires institutional identity verification before generating a Temporary Override PIN.</p>
        
        {status && (
           <div className={`p-4 rounded-xl mb-6 text-sm font-medium ${status.type === 'success' ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
             {status.msg}
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            required
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
            placeholder="target@institution.edu"
          />
          <button disabled={loading} className="w-full bg-white text-black font-bold py-3.5 rounded-xl transition-transform active:scale-95 shadow-lg shadow-white/10 mt-2">
            {loading ? 'Dispatching...' : 'Request Override Sequence'}
          </button>
        </form>
        <Link to="/" className="block mt-6 text-center text-sm text-gray-500 hover:text-white transition-colors">Abort & Return to Gateway</Link>
      </div>
    </div>
  );
}
