import { useEffect, useState } from 'react';
import { useParams, Outlet, Navigate } from 'react-router-dom';
import api from '../../api/axios';

export default function OrganizationWrapper() {
  const { orgSlug } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrg();
  }, [orgSlug]);

  const fetchOrg = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/auth/organization/${orgSlug}`);
      setOrg(res.data.data);
      // Set theme color CSS variable
      document.documentElement.style.setProperty('--accent', res.data.data.theme_color || '#00C2FF');
      document.title = `${res.data.data.name} | ExamPro`;
    } catch (err) {
      console.error("Organization check failed. API URL:", import.meta.env.VITE_API_URL, "Error:", err.message);
      const status = err.response?.status || 'NETWORK_BLOCKED';
      // Capture the full URL if available
      const fullUrl = err.config?.url ? (err.config.baseURL + err.config.url) : 'COMPUTATION_ERROR';
      setOrg({ errorState: true, status, message: err.message, fullUrl });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (org?.errorState) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full premium-card p-10 border border-red-500/30 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 border border-red-500/20">
          <svg size={40} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold font-heading text-white">System Connectivity Issue</h2>
          <p className="text-gray-400 text-sm">The identity gateway responded with an error while establishing a secure handshake.</p>
        </div>
        <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 font-mono text-[10px] text-red-400 break-all text-left">
          <p>CODE: {org.status}</p>
          <p className="mt-1">FINAL_URL: {org.fullUrl}</p>
          <p className="mt-1">MESSAGE: {org.message}</p>
        </div>
        <button onClick={() => window.location.href = '/'} className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10">
          Return and Retransmit
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white">
      <Outlet context={{ org }} />
    </div>
  );
}
