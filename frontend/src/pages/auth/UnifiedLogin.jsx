import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '../../api/axios';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export default function UnifiedLogin({ roleConfig }) {
  const { orgSlug } = useParams();
  const { org } = useOutletContext();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', { ...data, orgSlug });
      localStorage.setItem('token', res.data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      
      const role = res.data.data.user.role;
      if (roleConfig.expectedRole !== 'any' && role !== roleConfig.expectedRole) {
         setError(`Portal restricted. Your clearance is ${role}.`);
         localStorage.clear();
         return;
      }
      
      navigate(`/org/${orgSlug}/${role}/dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Access Denied.');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-lg premium-card p-4 md:p-5 relative z-10 backdrop-blur-xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-2">
          <div className="mx-auto w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mb-2 border border-accent/20">
             {roleConfig.icon}
          </div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">{org.name}</h1>
          <p className="text-accent font-semibold tracking-widest uppercase text-[7px] mt-0.5">{roleConfig.title}</p>
          <p className="text-gray-400 mt-1 text-[10px]">{roleConfig.subtitle}</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-8 text-sm text-center font-medium animate-in slide-in-from-top-2 flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-300">Identity Alias (Email)</label>
            <input 
              {...register('email')}
              type="email" 
              className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all duration-300"
              placeholder="name@institution.edu"
            />
            {errors.email && <p className="text-danger text-[10px]">{errors.email.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
               <label className="text-xs font-medium text-gray-300">Security Key</label>
               <Link to="/forgot-password" element="a" className="text-[10px] text-accent hover:text-accent/80 transition-colors">Forgot Cipher?</Link>
            </div>
            <input 
              {...register('password')}
              type="password" 
              className="w-full bg-[#050A15] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent transition-all duration-300"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-danger text-[10px]">{errors.password.message}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-[#00A1D6] text-background font-bold py-2.5 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-accent/20 mt-1"
          >
            {isSubmitting ? 'Verifying...' : 'Secure Access'}
          </button>
        </form>

        <div className="mt-3 text-center border-t border-white/5 pt-3 space-y-2.5">
           <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-[7px] font-bold uppercase tracking-widest text-gray-600">
              {roleConfig.expectedRole !== 'student' && <Link className="hover:text-accent transition-colors" to={`/org/${orgSlug}/login`}>Learner Portal</Link>}
              {roleConfig.expectedRole !== 'faculty' && <Link className="hover:text-accent transition-colors" to={`/org/${orgSlug}/faculty-login`}>Faculty Portal</Link>}
              {roleConfig.expectedRole !== 'admin' && <Link className="hover:text-accent transition-colors" to={`/org/${orgSlug}/admin-login`}>Administrator</Link>}
           </div>
           
           <div className="flex flex-col items-center gap-2">
              <Link to={`/org/${orgSlug}/activate`} className="w-full text-[10px] text-accent/80 hover:text-accent font-black uppercase tracking-widest border border-accent/20 px-3 py-2 rounded-xl bg-accent/5 transition-all text-center">Claim Genesis Identity</Link>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[8px] text-gray-700 uppercase font-bold tracking-widest">New Member?</span>
                 <Link to={`/org/${orgSlug}/signup`} className="text-[8px] text-white hover:text-accent font-black uppercase tracking-widest underline underline-offset-4">Request Access</Link>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
