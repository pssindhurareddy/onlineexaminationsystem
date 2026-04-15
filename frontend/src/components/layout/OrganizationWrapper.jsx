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
      if (err.message === 'Network Error') {
        console.error("CRITICAL: Frontend cannot reach Backend. Check VITE_API_URL and CORS.");
      }
      setOrg(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!org) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Provide Org Context to Children if needed, for now just render */}
      <Outlet context={{ org }} />
    </div>
  );
}
